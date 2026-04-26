import { describe, expect, it } from 'vitest';
import { buildPrompt, detectSourceType } from './prompt-builder';

describe('detectSourceType', () => {
  it('classifies YouTube URLs as video', () => {
    expect(detectSourceType('https://youtube.com/watch?v=x')).toBe('video');
    expect(detectSourceType('https://youtu.be/x')).toBe('video');
  });

  it('classifies social URLs', () => {
    expect(detectSourceType('https://twitter.com/foo/status/1')).toBe('social');
    expect(detectSourceType('https://x.com/foo/status/1')).toBe('social');
    expect(detectSourceType('https://facebook.com/foo')).toBe('social');
  });

  it('falls back to article', () => {
    expect(detectSourceType('https://example.com/news/article-1')).toBe('article');
  });
});

describe('buildPrompt', () => {
  const base = {
    intention: 'Analyser',
    tone: 'Factuel (Neutre)',
    stance: 'Objectif',
    duration: '1 min',
  };

  it('builds a video prompt with googleSearch tool when given a YouTube URL', () => {
    const built = buildPrompt({ ...base, sourceUrl: 'https://youtu.be/abc' });
    expect(built.sourceType).toBe('video');
    expect(built.tools).toEqual([{ googleSearch: {} }]);
    expect(built.prompt).toContain('Analyse la vidéo');
    expect(built.prompt).toContain('https://youtu.be/abc');
  });

  it('builds a text prompt without tools and truncates oversized text', () => {
    const longText = 'a'.repeat(8000);
    const built = buildPrompt({ ...base, sourceText: longText });
    expect(built.sourceType).toBe('text');
    expect(built.tools).toEqual([]);
    // 6000 chars in the source + the framing => well under 8000.
    expect(built.prompt.includes('a'.repeat(6000))).toBe(true);
    expect(built.prompt.includes('a'.repeat(6001))).toBe(false);
  });

  it('always reminds Gemini to wrap output in <script_pro>', () => {
    const built = buildPrompt({ ...base, sourceText: 'hello world' });
    expect(built.prompt).toContain('<script_pro>');
    expect(built.prompt).toContain('</script_pro>');
  });
});
