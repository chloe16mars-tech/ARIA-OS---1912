import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { supabase, supabaseAdmin } from './supabase.server.js';

export const apiRouter = Router();

apiRouter.post('/generate-script', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      res.status(401).json({ error: 'Unauthorized: Token verification failed' });
      return;
    }

    const { sourceUrl, sourceText, intention, tone, stance, duration } = req.body;

    // Quota check
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('anonymous_generation_count, last_generation_date')
      .eq('id', user.id)
      .single();

    if (profile) {
      const lastGen = profile.last_generation_date ? new Date(profile.last_generation_date) : null;
      const count = profile.anonymous_generation_count || 0;
      
      // Note: We don't have isAnonymous easily here unless we check user metadata
      const isAnonymous = user.app_metadata?.['provider'] === 'anonymous'; 

      if (isAnonymous && lastGen) {
        const now = new Date();
        const diffHours = (now.getTime() - lastGen.getTime()) / (1000 * 60 * 60);

        if (diffHours < 24 && count >= 2) {
          res.status(429).json({ error: 'Quota dépassé. Limite atteinte pour les comptes anonymes.' });
          return;
        }
      }
    }

    let type: 'video' | 'article' | 'social' | 'text' = 'text';
    const model = 'gemini-3.1-pro-preview';
    let tools: Record<string, unknown>[] = [];
    let promptText = '';

    if (sourceUrl) {
      if (sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be')) {
        type = 'video';
        promptText = `Analyze the video at this URL: ${sourceUrl}. `;
        tools = [{ googleSearch: {} }];
      } else if (sourceUrl.includes('facebook.com') || sourceUrl.includes('twitter.com') || sourceUrl.includes('x.com')) {
        type = 'social';
        promptText = `Analyze the social media post at this URL: ${sourceUrl}. `;
        tools = [{ googleSearch: {} }];
      } else {
        type = 'article';
        promptText = `Analyze the article at this URL: ${sourceUrl}. `;
        tools = [{ googleSearch: {} }];
      }
    } else {
      type = 'text';
      promptText = `Analyze the following text: "${sourceText}". `;
    }

    promptText += `
Your task is to generate a highly professional script for a voice-over based on the provided source.
Intention: ${intention}
Tone: ${tone}
Stance / Bias (Parti pris): ${stance}
Target Duration: ${duration}

CRITICAL INSTRUCTIONS FOR FORMATTING:
1. DO NOT include conversational filler like "Voici un script...".
2. DO NOT include meta-commentary about word count or duration.
3. Start IMMEDIATELY with a brief 1-2 sentence explanation of how you adapted the subject to match the requested tone, intention, and stance.
4. You MUST wrap the actual spoken voice-over script inside exactly <script_pro> and </script_pro> XML-like tags. This is mandatory for the application's teleprompter to extract the text seamlessly. DO NOT put headings, stage directions, or markdown inside the <script_pro> tags. ONLY the raw, readable, punctuated spoken text.
5. Provide recording tips outside and after the tags.

Write all content in French. Make it sound natural and professional for a video creator.
`;

    if (!process.env['GEMINI_API_KEY']) {
      res.status(500).json({ error: 'La clé API Gemini est absente de la configuration du serveur.' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env['GEMINI_API_KEY'] });
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: promptText,
      config: {
        tools: tools.length > 0 ? tools : undefined
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    
    // Update Quotas
    try {
      const isAnonymous = user.app_metadata?.['provider'] === 'anonymous'; 
      if (isAnonymous) {
        let countToSet = 1;
        if (profile?.last_generation_date) {
           const lastGen = new Date(profile.last_generation_date);
           const now = new Date();
           const diffHours = (now.getTime() - lastGen.getTime()) / (1000 * 60 * 60);
           if (diffHours < 24) {
             countToSet = (profile.anonymous_generation_count || 0) + 1;
           }
        }
        await supabase
          .from('profiles')
          .update({
            anonymous_generation_count: countToSet,
            last_generation_date: new Date().toISOString()
          })
          .eq('id', user.id);
      } else {
        // Increment non-anonymous generation count
        // Note: Supabase doesn't have a direct increment in update easily without RPC, 
        // but we can compute it or use an RPC. For simplicity, we'll fetch then update or ignore if we don't care about total count precision.
        const currentCount = (profile as any)?.generation_count || 0;
        await supabase
          .from('profiles')
          .update({
            generation_count: currentCount + 1
          })
          .eq('id', user.id);
      }
    } catch (e) {
      console.error("Failed to update stats", e);
    }

    res.write(`data: ${JSON.stringify({ done: true, type })}\n\n`);
    res.end();
    return;

  } catch (error: unknown) {
    console.error('API Error:', error);
    let errMsg = "Erreur interne du serveur lors de la génération.";
    const err = error as any;
    if (err?.status === 429) {
      errMsg = "Quota dépassé sur le service d'Intelligence Artificielle.";
    } else if (err?.status === 400 || err?.message?.includes('API key')) {
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

apiRouter.delete('/user/account', async (req: Request, res: Response): Promise<void> => {
  try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
          return;
      }

      const token = authHeader.split('Bearer ')[1];
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
          res.status(401).json({ error: 'Unauthorized: Token verification failed' });
          return;
      }

      const uid = user.id;

      if (!supabaseAdmin) {
        res.status(500).json({ error: 'Server not configured for admin operations (missing Service Role Key)' });
        return;
      }

      // Supabase cascade deletes scripts and videos if configured in DB
      // We explicitly delete the user using admin client
      const { error: deletionError } = await supabaseAdmin.auth.admin.deleteUser(uid);

      if (deletionError) throw deletionError;

      res.json({ success: true });
  } catch (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({ error: 'Failed to delete account on backend' });
  }
});
