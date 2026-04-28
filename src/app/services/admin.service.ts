import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Language } from './language.service';

export interface Ad {
  id: string;
  image_url: string;
  badge_key: string;
  title_key: string;
  description_key: string;
  link_url: string;
  is_active: boolean;
  order: number;
}

export interface AppConfig {
  languages: Record<Language, boolean>;
  special_popup: {
    enabled: boolean;
    title: string;
    text: string;
    image_url: string;
    button_text: string;
    button_link: string;
    bg_color: string;
    overlay_opacity: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private supabase = inject(SupabaseService).client;

  // Ads
  async getAds() {
    const { data, error } = await this.supabase
      .from('ads')
      .select('*')
      .order('order', { ascending: true });
    if (error) throw error;
    return data as Ad[];
  }

  async saveAd(ad: Partial<Ad>) {
    const { data, error } = await this.supabase
      .from('ads')
      .upsert(ad)
      .select();
    if (error) throw error;
    return data[0] as Ad;
  }

  async deleteAd(id: string) {
    const { error } = await this.supabase
      .from('ads')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // Config
  async getConfig<T>(key: string): Promise<T> {
    const { data, error } = await this.supabase
      .from('app_config')
      .select('value')
      .eq('key', key)
      .single();
    if (error) throw error;
    return data.value as T;
  }

  async saveConfig(key: string, value: any) {
    const { error } = await this.supabase
      .from('app_config')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
  }

  // Legal
  async getLegalContent(id: string) {
    const { data, error } = await this.supabase
      .from('legal_content')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async saveLegalContent(id: string, titleKey: string, contentHtml: string) {
    const { error } = await this.supabase
      .from('legal_content')
      .upsert({ id, title_key: titleKey, content_html: contentHtml, last_updated: new Date().toISOString() });
    if (error) throw error;
  }
}
