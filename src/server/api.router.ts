import { Router, type Request, type Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { buildPrompt, type SourceType } from './prompt-builder.js';
import { isSafePublicUrl } from './ssrf-guard.js';

// ─────────────────────────────────────────────────────────────────────────
// Supabase admin client (service role, server-only)
// ─────────────────────────────────────────────────────────────────────────
const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
const geminiApiKey = process.env['GEMINI_API_KEY'];
const geminiModel = process.env['GEMINI_MODEL'] ?? 'gemini-2.5-pro';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '[api] FATAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing — protected endpoints will return 500.'
  );
}
if (!geminiApiKey) {
  console.error('[api] FATAL: GEMINI_API_KEY is missing — script generation is disabled.');
}

const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl ?? '',
  supabaseServiceKey ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─────────────────────────────────────────────────────────────────────────
// Rate limiting
// ─────────────────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Veuillez patienter quelques minutes.' },
});

const generateScriptLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de génération atteinte. Réessayez dans une heure.' },
});

const deleteAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de suppression de compte.' },
});

export const apiRouter = Router();
apiRouter.use(globalLimiter);

// ─────────────────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────────────────
const ALLOWED_INTENTIONS = [
  'Résumer',
  'Analyser',
  'Critiquer',
  'Expliquer',
  'Reformuler',
  'Débattre',
] as const;
const ALLOWED_TONES = [
  'Factuel (Neutre)',
  'Punchy (Dynamique)',
  'Satyrique',
  'Inspirant',
  'Analytique',
  'Dramatique',
] as const;
const ALLOWED_STANCES = ['Objectif', 'Favorable (Élogieux)', 'Défavorable (À charge)'] as const;
const ALLOWED_DURATIONS = ['30 sec', '1 min', '2 min', '3 min', '5 min'] as const;

const generateScriptSchema = z
  .object({
    sourceUrl: z
      .string()
      .max(2048, 'URL trop longue')
      .optional()
      .refine(val => !val || val === '' || isSafePublicUrl(val), { message: 'URL non autorisée.' })
      .refine(val => !val || val === '' || /^https?:\/\//.test(val), { message: 'URL invalide' }),
    sourceText: z
      .string()
      .max(8000, 'Le texte source ne peut pas dépasser 8000 caractères')
      .optional()
      .refine(val => !val || val === '' || val.length >= 10, {
        message: 'Le texte source doit contenir au moins 10 caractères',
      }),
    intention: z.enum(ALLOWED_INTENTIONS),
    tone: z.enum(ALLOWED_TONES),
    stance: z.enum(ALLOWED_STANCES),
    duration: z.enum(ALLOWED_DURATIONS),
  })
  .refine((d) => d.sourceUrl || d.sourceText, {
    message: 'Une source est requise : URL ou texte.',
  });

// ─────────────────────────────────────────────────────────────────────────
// Auth helper
// ─────────────────────────────────────────────────────────────────────────
interface AuthedUser {
  id: string;
  isAnonymous: boolean;
}

async function verifyJwt(req: Request, res: Response): Promise<AuthedUser | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Token manquant ou invalide.' });
    return null;
  }
  const jwt = header.slice('Bearer '.length);
  const { data, error } = await supabaseAdmin.auth.getUser(jwt);
  if (error || !data.user) {
    res.status(401).json({ error: 'Unauthorized: Vérification du token échouée.' });
    return null;
  }
  return { id: data.user.id, isAnonymous: data.user.is_anonymous ?? false };
}

// ─────────────────────────────────────────────────────────────────────────
// POST /api/generate-script
// Streams a Gemini-generated voice-over script via Server-Sent Events.
// ─────────────────────────────────────────────────────────────────────────
apiRouter.post(
  '/generate-script',
  generateScriptLimiter,
  async (req: Request, res: Response): Promise<void> => {
    console.log('[api] POST /generate-script - Request received');
    try {
      const user = await verifyJwt(req, res);
      if (!user) {
        console.warn('[api] verifyJwt failed');
        return;
      }

      const parsed = generateScriptSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: parsed.error.issues[0]?.message ?? 'Données invalides.',
        });
        return;
      }
      const { sourceUrl, sourceText, intention, tone, stance, duration } = parsed.data;

      // Anonymous quota check (atomic via Postgres RPC).
      if (user.isAnonymous) {
        const { data: hasQuota, error: quotaError } = await supabaseAdmin.rpc(
          'check_anonymous_quota',
          { p_user_id: user.id }
        );
        if (quotaError) {
          console.error('[api] check_anonymous_quota failed:', quotaError);
          res.status(500).json({ error: 'Erreur lors de la vérification du quota.' });
          return;
        }
        if (!hasQuota) {
          res.status(429).json({
            error:
              'Quota dépassé. Les comptes anonymes sont limités à 2 générations par 24 h. Créez un compte pour continuer.',
          });
          return;
        }
      }

      if (!geminiApiKey) {
        res.status(500).json({ error: 'Configuration serveur incomplète.' });
        return;
      }

      const { prompt, sourceType, tools } = buildPrompt({
        sourceUrl,
        sourceText,
        intention,
        tone,
        stance,
        duration,
      });

      // SSE init — disable Nginx buffering so chunks reach the client live.
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      console.log(`[api] Generating with model: ${geminiModel}`);
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const stream = await ai.models.generateContentStream({
        model: geminiModel,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        // Enable Google Search grounding for URL-based sources so the model
        // can retrieve current page content and produce accurate scripts.
        config: tools.length > 0 ? { tools } : undefined,
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      // Best-effort stats — never fail the user if metrics fail.
      void incrementStats(supabaseAdmin, user).catch((err) =>
        console.error('[api] stats update failed:', err)
      );

      res.write(`data: ${JSON.stringify({ done: true, type: sourceType })}\n\n`);
      res.end();
    } catch (error: unknown) {
      console.error('[api] /generate-script error:', error);
      const errMsg = mapGeminiError(error);
      if (!res.headersSent) {
        res.status(500).json({ error: errMsg });
      } else {
        res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
        res.end();
      }
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────
// DELETE /api/user/account
// Removes the authenticated user. Cascade deletes are handled in Postgres.
// ─────────────────────────────────────────────────────────────────────────
apiRouter.delete(
  '/user/account',
  deleteAccountLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await verifyJwt(req, res);
      if (!user) return;
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: unknown) {
      console.error('[api] account deletion failed:', error);
      res.status(500).json({ error: 'Échec de la suppression du compte côté serveur.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────
// GET /api/health — used by uptime monitors and Capacitor pre-flight
// ─────────────────────────────────────────────────────────────────────────
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: process.env['NODE_ENV'] ?? 'development',
    time: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────
/**
 * Fire both stat increments in parallel — halves the DB round-trips.
 * Global counter always increments; the per-user counter depends on
 * whether the caller is anonymous or authenticated.
 */
async function incrementStats(db: SupabaseClient, user: AuthedUser): Promise<void> {
  const tasks: Promise<any>[] = [Promise.resolve(db.rpc('increment_global_generations'))];
  if (user.isAnonymous) {
    tasks.push(Promise.resolve(db.rpc('increment_anonymous_generation_count', { p_user_id: user.id })));
  } else {
    tasks.push(Promise.resolve(db.rpc('increment_user_generation_count', { p_user_id: user.id })));
  }
  await Promise.all(tasks);
}

function mapGeminiError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Erreur inconnue lors de la génération.';
  }
  console.error('[Gemini Detail]', error.message);
  // Surface quota/safety errors clearly; hide internal details otherwise.
  if (error.message.includes('429') || error.message.toLowerCase().includes('quota')) {
    return 'Quota API Gemini atteint. Veuillez réessayer dans quelques instants.';
  }
  if (error.message.includes('SAFETY') || error.message.toLowerCase().includes('safety')) {
    return 'La génération a été bloquée par les filtres de sécurité. Reformulez votre source.';
  }
  return 'Erreur lors de la génération IA. Veuillez réessayer.';
}

export type { SourceType };
