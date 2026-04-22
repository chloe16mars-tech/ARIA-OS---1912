import { Injectable, inject } from '@angular/core';
import { auth } from '../../firebase';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  
  async analyzeAndGenerateScript(
    sourceUrl: string,
    sourceText: string,
    intention: string,
    tone: string,
    stance: string,
    duration: string,
    onProgress?: (text: string) => void
  ): Promise<{ script: string, type: 'video' | 'article' | 'social' | 'text' }> {
    
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
    }
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

Example Structure:
[Brief explanation of adaptation methods]

<script_pro>
Here is exactly what the presenter will read aloud, word for word. No markdown, no italic stage directions inside this block. Sentences should be easy to read out loud.
</script_pro>

**💡 Conseils pour l'enregistrement :**
* [Tip 1: e.g., camera angle, lighting, attitude, pacing]
* [Tip 2]

Write all content in French. Make it sound natural and professional for a video creator.
`;

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Utilisateur non authentifié.");
      }
      const token = await user.getIdToken();

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceUrl,
          sourceText,
          intention,
          tone,
          stance,
          duration
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erreur serveur: ${response.status}`);
      }

      const data = await response.json();
      
      if (onProgress) {
        // Since we are no longer streaming from backend for simplicity,
        // we just call onProgress once with the full text.
        onProgress(data.script);
      }

      return { script: data.script, type: data.type };
    } catch (error: any) {
      console.error('Error generating script:', error);
      let errMsg = "Erreur lors de la génération du contenu.";
      if (error?.status === 429 || (error?.message && error.message.includes('429'))) {
         errMsg = "Quota dépassé sur le service d'Intelligence Artificielle.";
      } else if (error?.status === 400 || (error?.message && error.message.includes('400')) || (error?.message && error.message.includes('API key'))) {
         errMsg = "Clé d'API invalide ou requête incorrecte.";
      }
      
      throw new Error(errMsg);
    }
  }
}
