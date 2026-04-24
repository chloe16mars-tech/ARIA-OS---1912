import { Injectable, inject } from '@angular/core';
import { supabase } from '../../supabase';
import { AuthService } from './auth.service';

export interface ScriptData {
  id?: string;
  user_id: string;
  source_url?: string;
  source_text?: string;
  source_type: 'video' | 'article' | 'social' | 'text';
  intention: string;
  tone: string;
  stance?: string;
  duration: string;
  content: string;
  created_at: string;
  is_trashed?: boolean;
  trashed_at?: string;
  reflection_time?: number;
  title?: string;
  pinned?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ScriptService {
  private authService = inject(AuthService);

  async saveScript(script: Omit<ScriptData, 'id' | 'user_id' | 'created_at'>) {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('scripts')
      .insert({
        ...script,
        user_id: user.id,
        created_at: new Date().toISOString(),
        is_trashed: false
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving script:", error);
      throw error;
    }
    return data.id;
  }

  async updateScript(scriptId: string, partial: Partial<ScriptData>) {
    const { error } = await supabase
      .from('scripts')
      .update(partial)
      .eq('id', scriptId);
    
    if (error) {
      console.error("Error updating script:", error);
      throw error;
    }
  }

  async moveToTrash(scriptId: string) {
    const { error } = await supabase
      .from('scripts')
      .update({
        is_trashed: true,
        trashed_at: new Date().toISOString()
      })
      .eq('id', scriptId);

    if (error) {
       console.error("Error moving to trash:", error);
       throw error;
    }
  }

  async restoreScript(scriptId: string) {
    const { error } = await supabase
      .from('scripts')
      .update({
        is_trashed: false,
        trashed_at: null
      })
      .eq('id', scriptId);

    if (error) {
       console.error("Error restoring script:", error);
       throw error;
    }
  }

  async deleteScript(scriptId: string) {
    const { error } = await supabase
      .from('scripts')
      .delete()
      .eq('id', scriptId);

    if (error) {
       console.error("Error deleting script:", error);
       throw error;
    }
  }

  getScriptsSnapshot(callback: (scripts: ScriptData[]) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    // Initial fetch
    this.fetchScripts(user.id, false, callback);

    // Subscribe
    const channel = supabase
      .channel(`scripts-user-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scripts', filter: `user_id=eq.${user.id}` },
        () => {
          this.fetchScripts(user.id!, false, callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  private async fetchScripts(userId: string, trashed: boolean, callback: (scripts: ScriptData[]) => void) {
    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_trashed', trashed)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching scripts:", error);
    } else {
      callback(data as ScriptData[]);
    }
  }

  getTrashedScriptsSnapshot(callback: (scripts: ScriptData[]) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    // Initial fetch
    this.fetchScripts(user.id, true, callback);

    // Subscribe
    const channel = supabase
      .channel(`trashed-scripts-user-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scripts', filter: `user_id=eq.${user.id}` },
        () => {
          this.fetchScripts(user.id!, true, callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
