import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Ad, AppConfig } from './admin.service';
import { Language } from './language.service';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private supabase = inject(SupabaseService).client;
  
  public ads = signal<Ad[]>([]);
  public config = signal<AppConfig | null>(null);
  public specialPopupVisible = signal(false);

  async initialize() {
    await Promise.all([
      this.loadAds(),
      this.loadConfig()
    ]);
    
    this.checkSpecialPopup();
  }

  async loadAds() {
    const { data, error } = await this.supabase
      .from('ads')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });
    
    if (!error && data) {
      this.ads.set(data);
    }
  }

  async loadConfig() {
    const { data: langs } = await this.supabase.from('app_config').select('value').eq('key', 'languages').single();
    const { data: popup } = await this.supabase.from('app_config').select('value').eq('key', 'special_popup').single();
    
    this.config.set({
      languages: langs?.value || { fr: true, en: true },
      special_popup: popup?.value || { enabled: false }
    } as AppConfig);
  }

  private checkSpecialPopup() {
    const cfg = this.config();
    if (cfg?.special_popup?.enabled) {
      const lastShown = localStorage.getItem('aria_os_popup_last_shown');
      const now = Date.now();
      
      // Show once every 24 hours
      if (!lastShown || now - parseInt(lastShown) > 24 * 60 * 60 * 1000) {
        this.specialPopupVisible.set(true);
      }
    }
  }

  closeSpecialPopup() {
    this.specialPopupVisible.set(false);
    localStorage.setItem('aria_os_popup_last_shown', Date.now().toString());
  }

  async getLegalContent(id: string) {
    const { data, error } = await this.supabase
      .from('legal_content')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  }
}
