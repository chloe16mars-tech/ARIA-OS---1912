import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

export const apiRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Admin Client (server-side only — service role key NEVER sent to client)
// ─────────────────────────────────────────────────────────────────────────────

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[API] FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Server will not function correctly.');
}

const supabaseAdmin = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiting — protège contre le spam, les bots et les attaques DDoS
// ─────────────────────────────────────────────────────────────────────────────

/** Limite générale sur toutes les routes API */
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Veuillez patienter quelques minutes.' },
});

/** Limite stricte sur la génération de script (opération coûteuse) */
const generateScriptLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // max 20 générations par IP par heure
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de génération atteinte. Réessayez dans une heure.' },
});

/** Limite stricte sur la suppression de compte */
const deleteAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // max 3 tentatives par IP par heure
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de suppression de compte.' },
});

// Appliquer le rate limiter global sur toutes les routes de ce router
apiRouter.use(globalApiLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// Schémas de validation Zod — tous les inputs serveur sont validés
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_INTENTIONS = ['Résumer', 'Analyser', 'Critiquer', 'Expliquer', 'Reformuler', 'Débattre'] as const;
const ALLOWED_TONES = ['Factuel (Neutre)', 'Punchy (Dynamique)', 'Satyrique', 'Inspirant', 'Analytique', 'Dramatique'] as const;
const ALLOWED_STANCES = ['Objectif', 'Favorable (Élogieux)', 'Défavorable (À charge)'] as const;
const ALLOWED_DURATIONS = ['30 sec', '1 min', '2 min', '3 min', '5 min'] as const;

const generateScriptSchema = z.object({
  sourceUrl: z.string()
    .url('URL invalide')
    .max(2048, 'URL trop longue')
    .refine(
      (url) => {
        // Bloquer les URLs locales (SSRF protection)
        const lower = url.toLowerCase();
        return !lower.includes('localhost') &&
               !lower.includes('127.0.0.1') &&
               !lower.includes('0.0.0.0') &&
               !lower.includes('::1') &&
               !lower.includes('169.254') &&
               !lower.includes('10.') &&
               !lower.includes('192.168.') &&
               !lower.startsWith('file://') &&
               !lower.startsWith('ftp://');
      },
      { message: 'URL non autorisée.' }
    )
    .optional(),
  sourceText: z.string()
    .min(10, 'Le texte source doit contenir au moins 10 caractères')
    .max(8000, 'Le texte source ne peut pas dépasser 8000 caractères')
    .optional(),
  intention: z.enum(ALLOWED_INTENTIONS, { invalid_type_error: 'Intention invalide.' }),
  tone: z.enum(ALLOWED_TONES, { invalid_type_error: 'Ton invalide.' }),
  stance: z.enum(ALLOWED_STANCES, { invalid_type_error: 'Parti pris invalide.' }),
  duration: z.enum(ALLOWED_DURATIONS, { invalid_type_error: 'Durée invalide.' }),
}).refine(
  (data) => data.sourceUrl || data.sourceText,
  { message: 'Une source est requise : URL ou texte.' }
);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers d'authentification
// ─────────────────────────────────────────────────────────────────────────────

async function verifyJwt(req: Request, res: Response): Promise<{ id: string; is_anonymous: boolean } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Token manquant ou invalide.' });
    return null;
  }

  const jwt = authHeader.split('Bearer ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(jwt);

  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized: Vérification du token échouée.' });
    return null;
  }

  return { id: user.id, is_anonymous: user.is_anonymous ?? false };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/generate-script
// Génère un script voice-over avec Gemini AI via streaming SSE.
// ─────────────────────────────────────────────────────────────────────────────

apiRouter.post('/generate-script', generateScriptLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Vérifier l'authentification
    const user = await verifyJwt(req, res);
    if (!user) return;

    // 2. Valider et parser les inputs
    const parseResult = generateScriptSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message ?? 'Données invalides.';
      res.status(400).json({ error: firstError });
      return;
    }
    const { sourceUrl, sourceText, intention, tone, stance, duration } = parseResult.data;

    // 3. Vérifier le quota anonyme via RPC atomique (évite les race conditions)
    if (user.is_anonymous) {
      const { data: quotaData, error: quotaError } = await supabaseAdmin
        .rpc('check_anonymous_quota', { p_user_id: user.id });

      if (quotaError) {
        console.error('[API] Quota RPC error:', quotaError);
        res.status(500).json({ error: 'Erreur lors de la vérification du quota.' });
        return;
      }

      if (!quotaData) {
        res.status(429).json({
          error: 'Quota dépassé. Les comptes anonymes sont limités à 2 générations par 24h. Créez un compte pour continuer.'
        });
        return;
      }
    }

    // 4. Vérifier la clé Gemini
    if (!process.env['GEMINI_API_KEY']) {
      console.error('[API] FATAL: GEMINI_API_KEY is not set');
      res.status(500).json({ error: 'Configuration serveur incomplète. Contactez l\'administrateur.' });
      return;
    }

    // 5. Construire le prompt
    let sourceType: 'video' | 'article' | 'social' | 'text' = 'text';
    let tools: Record<string, unknown>[] = [];
    let prompt = '';

    if (sourceUrl) {
      const lowerUrl = sourceUrl.toLowerCase();
      if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        sourceType = 'video';
        prompt = `Analyse la vidéo à cette URL : ${sourceUrl}. `;
        tools = [{ googleSearch: {} }];
      } else if (
        lowerUrl.includes('facebook.com') ||
        lowerUrl.includes('twitter.com') ||
        lowerUrl.includes('x.com')
      ) {
        sourceType = 'social';
        prompt = `Analyse la publication sur les réseaux sociaux à cette URL : ${sourceUrl}. `;
        tools = [{ googleSearch: {} }];
      } else {
        sourceType = 'article';
        prompt = `Analyse l'article à cette URL : ${sourceUrl}. `;
        tools = [{ googleSearch: {} }];
      }
    } else if (sourceText) {
      sourceType = 'text';
      // Limite la longueur du texte source dans le prompt pour éviter les injections massives
      const safeText = sourceText.slice(0, 6000);
      prompt = `Analyse le texte suivant : """${safeText}""". `;
    }

    prompt += `
Ta mission est de générer un script professionnel pour une voix off basé sur la source fournie.
Intention : ${intention}
Ton : ${tone}
Parti pris : ${stance}
Durée cible : ${duration}

INSTRUCTIONS CRITIQUES DE FORMATAGE :
1. Ne commence PAS par des formules de politesse comme "Voici un script...".
2. N'inclus PAS de méta-commentaires sur le nombre de mots ou la durée.
3. Commence par une brève explication (1-2 phrases) de la façon dont tu as adapté le sujet au ton, à l'intention et au parti pris demandés.
4. TU DOIS envelopper le texte de la voix off dans des balises XML exactement <script_pro> et </script_pro>. C'est OBLIGATOIRE pour le téléprompter. N'inclus PAS de titres, de didascalies ou de markdown dans les balises <script_pro>. UNIQUEMENT le texte lu, ponctué, naturel.
5. Fournis des conseils d'enregistrement à l'extérieur et après les balises.

Rédige tout le contenu en français. Donne un résultat naturel et professionnel pour un créateur vidéo.
`;

    // 6. Initialiser et configurer les SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Désactive le buffering Nginx pour les SSE

    // 7. Appeler Gemini en streaming
    const ai = new GoogleGenAI({ apiKey: process.env['GEMINI_API_KEY'] });

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-pro-preview-05-06',
      contents: prompt,
      config: {
        tools: tools.length > 0 ? (tools as Parameters<typeof ai.models.generateContentStream>[0]['config'] extends { tools?: infer T } ? T : never) : undefined,
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    // 8. Mettre à jour les quotas et stats de façon atomique APRÈS la génération réussie
    try {
      // Incrément atomique du compteur global via RPC
      await supabaseAdmin.rpc('increment_global_generations');

      // Incrément du compteur utilisateur
      if (user.is_anonymous) {
        await supabaseAdmin.rpc('increment_anonymous_generation_count', { p_user_id: user.id });
      } else {
        await supabaseAdmin.rpc('increment_user_generation_count', { p_user_id: user.id });
      }
    } catch (statsError) {
      // Les erreurs de stats ne doivent pas bloquer la réponse utilisateur
      console.error('[API] Failed to update generation stats:', statsError);
    }

    res.write(`data: ${JSON.stringify({ done: true, type: sourceType })}\n\n`);
    res.end();

  } catch (error: unknown) {
    console.error('[API] /generate-script error:', error);

    const isRateLimitError = error instanceof Error && error.message.includes('429');
    const isInvalidKeyError = error instanceof Error && (
      error.message.includes('API key') ||
      error.message.includes('400')
    );

    let errMsg = 'Erreur interne du serveur lors de la génération.';
    if (isRateLimitError) {
      errMsg = "Quota dépassé sur le service d'Intelligence Artificielle. Réessayez dans quelques instants.";
    } else if (isInvalidKeyError) {
      errMsg = "Clé d'API invalide ou requête incorrecte.";
    }

    if (!res.headersSent) {
      res.status(500).json({ error: errMsg });
    } else {
      res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
      res.end();
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/user/account
// Supprime définitivement le compte de l'utilisateur authentifié.
// ─────────────────────────────────────────────────────────────────────────────

apiRouter.delete('/user/account', deleteAccountLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await verifyJwt(req, res);
    if (!user) return;

    // ON DELETE CASCADE en PostgreSQL supprime automatiquement users et scripts liés
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      throw deleteError;
    }

    res.json({ success: true });
  } catch (error: unknown) {
    console.error('[API] Account deletion error:', error);
    res.status(500).json({ error: 'Échec de la suppression du compte côté serveur.' });
  }
});
