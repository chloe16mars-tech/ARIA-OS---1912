import { Injectable, signal, computed } from '@angular/core';

export type Language = 'fr' | 'en' | 'zh' | 'ar' | 'es' | 'pt';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  public currentLang = signal<Language>('fr');
  private translations = signal<Record<string, string>>({});

  constructor() {
    let saved: Language | null = null;
    if (typeof window !== 'undefined') {
      try {
        saved = localStorage.getItem('aria_os_lang') as Language;
      } catch (e) {
        console.warn("localStorage not available for language preference", e);
      }
    }
    
    const validLangs: Language[] = ['fr', 'en', 'zh', 'ar', 'es', 'pt'];
    const initialLang = (saved && validLangs.includes(saved)) ? saved : 'fr';
    
    this.setLanguage(initialLang);
  }

  async setLanguage(lang: Language) {
    this.currentLang.set(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('aria_os_lang', lang);
      } catch (e) {
        // Ignored
      }
    }
    
    await this.loadTranslations(lang);
    this.applyLanguage(lang);
  }

  private async loadTranslations(lang: Language) {
    try {
      // Use dynamic import or fetch to load the JSON file
      // Since it's a standalone app, we can fetch from assets if we put them there, 
      // or use dynamic imports if configured. 
      // For now, let's assume they are in src/app/i18n/ and we can use dynamic import.
      const module = await import(`../i18n/${lang}.json`);
      this.translations.set(module.default || module);
    } catch (e) {
      console.error(`Failed to load translations for ${lang}`, e);
      // Fallback to FR if not already FR
      if (lang !== 'fr') {
        await this.loadTranslations('fr');
      }
    }
  }

  private applyLanguage(lang: Language) {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang;
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
      document.body.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
      document.body.dir = 'ltr';
    }
  }

  translate(key: string): string {
    return this.translations()[key] || key;
  }
}
