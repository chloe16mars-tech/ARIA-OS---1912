import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const apiRouter = Router();
const db = getFirestore();

// Middleware to verify Firebase ID Token
const authenticateUser = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Missing Bearer token.' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.status(403).json({ error: 'Unauthorized. Invalid token.' });
  }
};

apiRouter.post('/generate-script', authenticateUser, async (req: any, res: any) => {
  try {
    const { sourceUrl, sourceText, intention, tone, stance, duration } = req.body;
    const uid = req.user.uid;
    const isAnonymous = req.user.provider_id === 'anonymous';

    // 1. Quota Check
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (isAnonymous) {
      if (userDoc.exists) {
        const data = userDoc.data();
        const lastGen = data?.lastGenerationDate?.toDate();
        const count = data?.anonymousGenerationCount || 0;

        if (lastGen) {
          const now = new Date();
          const diffHours = (now.getTime() - lastGen.getTime()) / (1000 * 60 * 60);

          if (diffHours < 24 && count >= 2) {
            return res.status(429).json({ error: 'Anonymous quota exceeded (2 per 24h).' });
          }
        }
      }
    }

    // 2. Prepare Gemini Prompt
    let type: 'video' | 'article' | 'social' | 'text' = 'text';
    const model = 'gemini-3.1-pro-preview';
    let tools: any[] = [];
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
Stance / Bias (Parti pris): ${stance || ''}
Target Duration: ${duration}

CRITICAL INSTRUCTIONS FOR FORMATTING:
1. DO NOT include conversational filler like "Voici un script...".
2. DO NOT include meta-commentary about word count or duration.
3. Start IMMEDIATELY with a brief 1-2 sentence explanation of how you adapted the subject to match the requested tone, intention, and stance.
4. You MUST wrap the actual spoken voice-over script inside exactly <script_pro> and </script_pro> XML-like tags. This is mandatory for the application's teleprompter to extract the text seamlessly. DO NOT put headings, stage directions, or markdown inside the <script_pro> tags. ONLY the raw, readable, punctuated spoken text.
5. Provide recording tips outside and after the tags.

Write all content in French. Make it sound natural and professional for a video creator.
`;

    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      throw new Error('Server misconfiguration: GEMINI_API_KEY is not set.');
    }

    // 3. Generate via Gemini with Exponential Backoff Retry
    const ai = new GoogleGenAI({ apiKey });
    let response;
    let retries = 0;
    const maxRetries = 3;
    const baseDelayMs = 1000;

    while (true) {
      try {
        response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            tools: tools.length > 0 ? tools : undefined
          }
        });
        break; // Success, exit loop
      } catch (error: any) {
        retries++;
        console.warn(`[Gemini API] Attempt ${retries} failed: ${error.message}`);
        
        // Try to identify transient errors (500, 503, 429, timeouts)
        const isTransient = error?.status === 429 || error?.status === 500 || error?.status === 503 || error?.message?.includes('timeout') || error?.message?.includes('fetch failed') || error?.message?.includes('Quota');
        
        if (retries >= maxRetries || !isTransient) {
          throw error; // Fail permanently
        }
        
        const delay = baseDelayMs * Math.pow(2, retries - 1);
        console.log(`[Gemini API] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    const fullText = response.text;

    // 4. Update Stats & Quotas Securely
    const statsRef = db.collection('stats').doc('global');
    
    // Using a batch to ensure atomicity
    const batch = db.batch();
    
    batch.set(statsRef, {
      totalGenerations: FieldValue.increment(1)
    }, { merge: true });

    if (isAnonymous) {
      const data = userDoc.data();
      let count = 0;
      let lastGen = FieldValue.serverTimestamp();

      if (data && data.lastGenerationDate) {
        const lastGenDate = data.lastGenerationDate.toDate();
        const diffHours = (new Date().getTime() - lastGenDate.getTime()) / (1000 * 60 * 60);

        if (diffHours >= 24) {
          count = 1;
        } else {
          count = (data.anonymousGenerationCount || 0) + 1;
          lastGen = data.lastGenerationDate; // keep existing date
        }
      } else {
        count = 1;
      }

      batch.set(userRef, {
        anonymousGenerationCount: count,
        lastGenerationDate: lastGen
      }, { merge: true });
    } else {
      batch.set(userRef, {
        generationCount: FieldValue.increment(1)
      }, { merge: true });
    }

    await batch.commit();

    // 5. Send back the response
    res.json({ script: fullText, type });

  } catch (error: any) {
    console.error('Error in /generate-script:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});
