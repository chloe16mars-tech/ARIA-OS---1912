import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private authService = inject(AuthService);
  
  async analyzeAndGenerateScript(
    sourceUrl: string,
    sourceText: string,
    intention: string,
    tone: string,
    stance: string,
    duration: string,
    onProgress?: (text: string) => void
  ): Promise<{ script: string, type: 'video' | 'article' | 'social' | 'text' }> {
    
    // We execute the async logic directly and wrap in a try-catch for the promise
    const session = this.authService.session();
    if (!session) {
      throw new Error("Vous devez être connecté pour générer un script.");
    }
    
    const token = session.access_token;

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
       let errorObj;
       try {
         errorObj = await response.json();
       } catch {
         throw new Error("Erreur de connexion au serveur.");
       }
       throw new Error(errorObj.error || "Erreur HTTP " + response.status);
    }

    if (!response.body) {
       throw new Error("Réponse vide du serveur.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let finalType: 'video' | 'article' | 'social' | 'text' = 'text';
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || ''; // Keep the last potentially incomplete chunk in the buffer
      
      for (const ev of parts) {
        if (ev.startsWith('data: ')) {
          try {
             const dataStr = ev.replace(/^data:\s*/, '');
             if (dataStr === '[DONE]') continue; // Standard ignore for end blocks
             
             const data = JSON.parse(dataStr);
             if (data.error) {
                throw new Error(data.error);
             }
             if (data.text) {
                fullText += data.text;
                if (onProgress) onProgress(fullText);
             }
             if (data.done) {
                finalType = data.type || 'text';
             }
          } catch (e: unknown) {
             if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                throw e; // Rethrow actual backend errors, ignore silent incomplete chunks 
             }
          }
        }
      }
    }
    return { script: fullText, type: finalType };
  }
}
