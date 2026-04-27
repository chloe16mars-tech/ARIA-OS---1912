import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';
import { environment } from '../../environments/environment';

export type ScriptSourceType = 'video' | 'article' | 'social' | 'text';

export interface GenerateResult {
  script: string;
  type: ScriptSourceType;
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private auth = inject(AuthService);
  private logger = inject(LoggerService);

  /**
   * Streams a generated script from the API. `onProgress` receives the
   * full text accumulated so far on every chunk.
   */
  async analyzeAndGenerateScript(
    sourceUrl: string | undefined,
    sourceText: string | undefined,
    intention: string,
    tone: string,
    stance: string,
    duration: string,
    onProgress?: (text: string) => void
  ): Promise<GenerateResult> {
    const user = this.auth.currentUser();
    console.log('[GeminiService] User status at generation:', user ? `ID: ${user.id}` : 'NULL');
    
    if (!user) {
      throw new Error('Vous devez être connecté pour générer un script.');
    }
    const token = await this.auth.getIdToken();
    if (!token) throw new Error("Impossible d'obtenir le jeton d'authentification.");

    const response = await fetch(`${environment.apiUrl}/api/generate-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sourceUrl, sourceText, intention, tone, stance, duration }),
    });

    if (!response.ok) {
      const errorObj = await response.json().catch(() => null);
      throw new Error(
        errorObj?.error ?? `Erreur HTTP ${response.status} lors de la génération.`
      );
    }
    if (!response.body) throw new Error('Réponse vide du serveur.');

    return this.consumeSseStream(response.body, onProgress);
  }

  private async consumeSseStream(
    body: ReadableStream<Uint8Array>,
    onProgress?: (text: string) => void
  ): Promise<GenerateResult> {
    const reader = body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let finalType: ScriptSourceType = 'text';
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const event of events) {
        if (!event.startsWith('data: ')) continue;
        const dataStr = event.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') continue;
        try {
          const data = JSON.parse(dataStr);
          if (data.error) throw new Error(data.error);
          if (typeof data.text === 'string') {
            fullText += data.text;
            onProgress?.(fullText);
          }
          if (data.done && typeof data.type === 'string') {
            finalType = data.type;
          }
        } catch (err) {
          // Ignore partial JSON chunks; rethrow real backend errors.
          if (err instanceof Error && !err.message.includes('JSON')) {
            this.logger.error('GeminiService', 'SSE parse error:', err);
            throw err;
          }
        }
      }
    }

    return { script: fullText, type: finalType };
  }
}
