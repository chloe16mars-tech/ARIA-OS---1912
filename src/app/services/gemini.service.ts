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
    
    return new Promise(async (resolve, reject) => {
      try {
        const user = this.authService.currentUser();
        if (!user) {
          throw new Error("Vous devez être connecté pour générer un script.");
        }
        
        const token = await this.authService.getIdToken();
        if (!token) throw new Error("Impossible d'obtenir le jeton d'authentification.");

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
           } catch (e) {
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
        resolve({ script: fullText, type: finalType });
      } catch (error: any) {
        reject(error);
      }
    });
  }
}
