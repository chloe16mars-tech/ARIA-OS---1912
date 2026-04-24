import { Injectable, inject } from '@angular/core';
import { supabase, handleSupabaseError, OperationType } from '../../supabase';
import { AuthService } from './auth.service';

export interface ScriptData {
  id?: string;
  userId: string;
  sourceUrl?: string;
  sourceText?: string;
  sourceType: 'video' | 'article' | 'social' | 'text';
  intention: string;
  tone: string;
  stance?: string;
  duration: string;
  content: string;
  reflectionTime?: number;
  createdAt: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  title?: string;
  pinned?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ScriptService {
  private authService = inject(AuthService);

  private mapFromDb(row: any): ScriptData {
    return {
      id: row.id,
      userId: row.user_id,
      sourceUrl: row.source_url,
      sourceText: row.source_text,
      sourceType: row.source_type,
      intention: row.intention,
      tone: row.tone,
      stance: row.stance,
      duration: row.duration,
      content: row.content,
      createdAt: new Date(row.created_at),
      isDeleted: row.is_deleted,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      title: row.title,
      pinned: row.pinned
    };
  }

  async saveScript(script: Omit<ScriptData, 'id' | 'userId' | 'createdAt'>) {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('scripts')
      .insert({
        user_id: user.id,
        source_url: script.sourceUrl,
        source_text: script.sourceText,
        source_type: script.sourceType,
        intention: script.intention,
        tone: script.tone,
        stance: script.stance,
        duration: script.duration,
        content: script.content,
        title: script.title,
        pinned: script.pinned || false
      })
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, OperationType.CREATE, 'scripts');
    }
    return data.id;
  }

  async updateScript(scriptId: string, partial: Partial<ScriptData>) {
    const updates: any = {};
    if (partial.title !== undefined) updates.title = partial.title;
    if (partial.content !== undefined) updates.content = partial.content;
    if (partial.pinned !== undefined) updates.pinned = partial.pinned;
    if (partial.isDeleted !== undefined) updates.is_deleted = partial.isDeleted;

    const { error } = await supabase
      .from('scripts')
      .update(updates)
      .eq('id', scriptId);

    if (error) {
      handleSupabaseError(error, OperationType.UPDATE, `scripts/${scriptId}`);
    }
  }

  async moveToTrash(scriptId: string) {
    const { error } = await supabase
      .from('scripts')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', scriptId);

    if (error) {
      handleSupabaseError(error, OperationType.UPDATE, `scripts/${scriptId}`);
    }
  }

  async restoreScript(scriptId: string) {
    const { error } = await supabase
      .from('scripts')
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', scriptId);

    if (error) {
      handleSupabaseError(error, OperationType.UPDATE, `scripts/${scriptId}`);
    }
  }

  async deleteScript(scriptId: string) {
    const { error } = await supabase
      .from('scripts')
      .delete()
      .eq('id', scriptId);

    if (error) {
      handleSupabaseError(error, OperationType.DELETE, `scripts/${scriptId}`);
    }
  }

  getScriptsSnapshot(callback: (scripts: ScriptData[]) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    const fetchScripts = async () => {
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error, OperationType.LIST, 'scripts');
      } else if (data) {
        callback(data.map(this.mapFromDb));
      }
    };

    fetchScripts();

    const channel = supabase.channel('public:scripts:active')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scripts', filter: `user_id=eq.${user.id}` }, payload => {
        fetchScripts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }

  getTrashedScriptsSnapshot(callback: (scripts: ScriptData[]) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    const fetchScripts = async () => {
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (error) {
        handleSupabaseError(error, OperationType.LIST, 'scripts/trash');
      } else if (data) {
        callback(data.map(this.mapFromDb));
      }
    };

    fetchScripts();

    const channel = supabase.channel('public:scripts:trash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scripts', filter: `user_id=eq.${user.id}` }, payload => {
        fetchScripts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }
}
