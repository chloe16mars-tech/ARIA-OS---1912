import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { GoogleGenAI } from '@google/genai';

// Initialize Firebase Admin safely
if (!getApps().length) {
  try {
    initializeApp({
        credential: applicationDefault()
    });
  } catch (error) {
    console.warn("Firebase Admin SDK init failed. Certain backend routes like account deletion will not work locally without ADC credentials.", error);
  }
}

export const apiRouter = Router();

apiRouter.post('/generate-script', async (req, res): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
    }

    const uid = decodedToken.uid;
    const isAnonymous = decodedToken.firebase?.sign_in_provider === 'anonymous';

    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);
    const globalStatsRef = db.collection('stats').doc('global');

    // Quota Logic
    if (isAnonymous) {
      const userDoc = await userRef.get();
      const data = userDoc.data() || {};
      const lastGen = data['lastGenerationDate'] ? data['lastGenerationDate'].toDate() : null;
      const count = data['anonymousGenerationCount'] || 0;

      if (lastGen) {
        const now = new Date();
        const diffHours = (now.getTime() - lastGen.getTime()) / (1000 * 60 * 60);

        if (diffHours < 24 && count >= 2) {
          return res.status(429).json({ error: 'Quota dépassé. Limite atteinte pour les comptes anonymes.' });
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
    
    // Server-sent events for streaming
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
      await db.runTransaction(async (t) => {
        // Global
        t.set(globalStatsRef, { totalGenerations: FieldValue.increment(1) }, { merge: true });
        
        // User
        const userDoc = await t.get(userRef);
        if (isAnonymous) {
           const data = userDoc.data() || {};
           const lastGen = data['lastGenerationDate'] ? data['lastGenerationDate'].toDate() : null;
           const existingCount = data['anonymousGenerationCount'] || 0;
           let countToSet = 1;

           if (lastGen) {
             const now = new Date();
             const diffHours = (now.getTime() - lastGen.getTime()) / (1000 * 60 * 60);
             if (diffHours < 24) {
               countToSet = existingCount + 1;
             }
           }
           t.set(userRef, {
             anonymousGenerationCount: countToSet,
             lastGenerationDate: FieldValue.serverTimestamp()
           }, { merge: true });
        } else {
           t.set(userRef, {
             generationCount: FieldValue.increment(1)
           }, { merge: true });
        }
      });
    } catch (e) {
      console.error("Failed to update stats transaction", e);
      // We don't fail the request since generation succeeded
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

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await getAuth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const db = getFirestore();

      // 1. Delete all scripts efficiently using Batches
      const scriptsRef = db.collection('scripts');
      const snapshot = await scriptsRef.where('userId', '==', uid).get();

      let batch = db.batch();
      let count = 0;
      for (const doc of snapshot.docs) {
          batch.delete(doc.ref);
          count++;
          if (count === 490) { // Keep under 500 operation limit
              await batch.commit();
              batch = db.batch();
              count = 0;
          }
      }
      if (count > 0) {
          await batch.commit();
      }

      // 2. Delete user profile
      await db.collection('users').doc(uid).delete();

      // 3. Delete auth account
      await getAuth().deleteUser(uid);

      res.json({ success: true });
  } catch (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({ error: 'Failed to delete account on backend' });
  }
});
