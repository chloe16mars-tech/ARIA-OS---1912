/**
 * Pure helpers for the /generate-script route. No I/O, easy to unit-test.
 */

export type SourceType = 'video' | 'article' | 'social' | 'text';

export interface PromptInput {
  sourceUrl?: string;
  sourceText?: string;
  intention: string;
  tone: string;
  stance: string;
  duration: string;
}

export interface BuiltPrompt {
  prompt: string;
  sourceType: SourceType;
  tools: Record<string, unknown>[];
}

const MAX_TEXT_INLINED_IN_PROMPT = 6000;

export function detectSourceType(url: string): SourceType {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'video';
  if (
    lower.includes('facebook.com') ||
    lower.includes('twitter.com') ||
    lower.includes('x.com')
  )
    return 'social';
  return 'article';
}

export function buildPrompt(input: PromptInput): BuiltPrompt {
  const { sourceUrl, sourceText, intention, tone, stance, duration } = input;

  let sourceType: SourceType = 'text';
  let tools: Record<string, unknown>[] = [];
  let head = '';

  if (sourceUrl) {
    sourceType = detectSourceType(sourceUrl);
    tools = [{ googleSearch: {} }];
    head =
      sourceType === 'video'
        ? `Analyse la vidéo à cette URL : ${sourceUrl}. `
        : sourceType === 'social'
          ? `Analyse la publication sur les réseaux sociaux à cette URL : ${sourceUrl}. `
          : `Analyse l'article à cette URL : ${sourceUrl}. `;
  } else if (sourceText) {
    const safe = sourceText.slice(0, MAX_TEXT_INLINED_IN_PROMPT);
    head = `Analyse le texte suivant : """${safe}""". `;
  }

  const body = `
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

  return { prompt: head + body, sourceType, tools };
}
