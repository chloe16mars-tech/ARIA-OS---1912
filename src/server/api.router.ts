import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

export const apiRouter = Router();

// Initialize Supabase Admin client
const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase Admin SDK init failed. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
}

const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

apiRouter.post('/generate-script', async (req, res): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const jwt = authHeader.split('Bearer ')[1];
    
    // Verify user JWT with Supabase Admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
    }

    const uid = user.id;
    const isAnonymous = user.is_anonymous;

    // Quota Logic with Supabase
    if (isAnonymous) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('anonymous_generation_count, last_generation_date')
        .eq('id', uid)
        .single();
        
      if (!userError && userData) {
        const lastGenDateStr = userData.last_generation_date;
        const count = userData.anonymous_generation_count || 0;

        if (lastGenDateStr) {
          const lastGen = new Date(lastGenDateStr);
          const now = new Date();
          const diffHours = (now.getTime() - lastGen.getTime()) / (1000 * 60 * 60);

          if (diffHours < 24 && count >= 2) {
            return res.status(429).json({ error: 'Quota dépassé. Limite atteinte pour les comptes anonymes.' });
          }
        }
      }
    }

    const { sourceUrl, sourceText, intention, tone, stance, duration } = req.body;

    let type: 'video' | 'article' | 'social' | 'text' = 'text';
    const model = 'gemini-3.1-pro-preview';
    let tools: Record<string, unknown>[] = [];
    let prompt = '';

    if (sourceUrl) {
      if (sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be')) {
        type = 'video';
        prompt = `Analyze the video at this URL: ${sourceUrl}. `;
        tools = [{ googleSearch: {} }];
      } else if (sourceUrl.includes('facebook.com') || sourceUrl.includes('twitter.com') || sourceUrl.includes('x.com')) {
        type = 'social';
        prompt = `Analyze the social media post at this URL: ${sourceUrl}. `;
        tools = [{ googleSearch: {} }];
      } else {
        type = 'article';
        prompt = `Analyze the article at this URL: ${sourceUrl}. `;
        tools = [{ googleSearch: {} }];
      }
    } else {
      type = 'text';
      prompt = `Analyze the following text: "${sourceText}". `;
    }

    prompt += `
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
      return res.status(500).json({ error: 'La clé API Gemini est absente de la configuration du serveur.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env['GEMINI_API_KEY'] });
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: prompt,
      config: {
        tools: tools.length > 0 ? tools : undefined
      }
    });

    let fullText = '';
    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullText += chunk.text;
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    
    // Update Quotas & Stats Securely AFTER successful generation
    try {
      // 1. Update Global Stats (using RPC if possible, otherwise read/write)
      const { data: globalData } = await supabaseAdmin
        .from('global_stats')
        .select('total_generations')
        .eq('id', 1)
        .single();
        
      if (globalData) {
         await supabaseAdmin
           .from('global_stats')
           .update({ total_generations: (globalData.total_generations || 0) + 1 })
           .eq('id', 1);
      }

      // 2. Update User Stats
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('anonymous_generation_count, generation_count, last_generation_date')
        .eq('id', uid)
        .single();

      if (userData) {
        if (isAnonymous) {
          const lastGenDateStr = userData.last_generation_date;
          const existingCount = userData.anonymous_generation_count || 0;
          let countToSet = 1;

          if (lastGenDateStr) {
            const lastGen = new Date(lastGenDateStr);
            const now = new Date();
            const diffHours = (now.getTime() - lastGen.getTime()) / (1000 * 60 * 60);
            if (diffHours < 24) {
              countToSet = existingCount + 1;
            }
          }
          await supabaseAdmin
            .from('users')
            .update({ 
              anonymous_generation_count: countToSet,
              last_generation_date: new Date().toISOString()
            })
            .eq('id', uid);
        } else {
          await supabaseAdmin
            .from('users')
            .update({ 
              generation_count: (userData.generation_count || 0) + 1,
              last_generation_date: new Date().toISOString()
            })
            .eq('id', uid);
        }
      }
    } catch (e) {
      console.error("Failed to update stats transaction", e);
    }

    res.write(`data: ${JSON.stringify({ done: true, type })}\n\n`);
    res.end();

  } catch (error: any) {
    console.error('API Error:', error);
    let errMsg = "Erreur interne du serveur lors de la génération.";
    if (error?.status === 429) {
      errMsg = "Quota dépassé sur le service d'Intelligence Artificielle.";
    } else if (error?.status === 400 || error?.message?.includes('API key')) {
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

apiRouter.delete('/user/account', async (req, res): Promise<any> => {
  try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      }

      const jwt = authHeader.split('Bearer ')[1];
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
      
      if (authError || !user) {
         return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
      }
      
      const uid = user.id;

      // Note: Because of PostgreSQL ON DELETE CASCADE on public.users and public.scripts,
      // deleting the user from auth.users will automatically cascade and delete everything!
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(uid);
      
      if (deleteError) {
         throw deleteError;
      }

      res.json({ success: true });
  } catch (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({ error: 'Failed to delete account on backend' });
  }
});
