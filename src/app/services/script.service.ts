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

  private mapFromDb(row: Record<string, unknown>): ScriptData {
    return {
      id: row['id'] as string,
      userId: row['user_id'] as string,
      sourceUrl: row['source_url'] as string | undefined,
      sourceText: row['source_text'] as string | undefined,
      sourceType: row['source_type'] as ScriptData['sourceType'],
      intention: row['intention'] as string,
      tone: row['tone'] as string,
      stance: row['stance'] as string | undefined,
      duration: row['duration'] as string,
      content: row['content'] as string,
      createdAt: new Date(row['created_at'] as string),
      isDeleted: row['is_deleted'] as boolean,
      deletedAt: row['deleted_at'] ? new Date(row['deleted_at'] as string) : undefined,
      title: row['title'] as string | undefined,
      pinned: row['pinned'] as boolean | undefined
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
    if (!data) {
      throw new Error('Insert script returned no data.');
    }
    return data.id as string;
  }

  async updateScript(scriptId: string, partial: Partial<ScriptData>) {
    const updates: Record<string, unknown> = {};
    if (partial.title !== undefined) updates['title'] = partial.title;
    if (partial.content !== undefined) updates['content'] = partial.content;
    if (partial.pinned !== undefined) updates['pinned'] = partial.pinned;
    if (partial.isDeleted !== undefined) updates['is_deleted'] = partial.isDeleted;

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

    let currentScripts: ScriptData[] = [];

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
        currentScripts = data.map(d => this.mapFromDb(d));
        callback(currentScripts);
      }
    };

    fetchScripts();

    const channel = supabase.channel(`public:scripts:active:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scripts', filter: `user_id=eq.${user.id}` }, payload => {
        if (payload.eventType === 'UPDATE') {
          const updated = this.mapFromDb(payload.new);
          if (updated.isDeleted) {
            currentScripts = currentScripts.filter(s => s.id !== updated.id);
          } else {
            const index = currentScripts.findIndex(s => s.id === updated.id);
            if (index !== -1) {
              currentScripts[index] = updated;
            } else {
              currentScripts = [updated, ...currentScripts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            }
          }
          callback([...currentScripts]);
        } else {
          fetchScripts();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }

  getTrashedScriptsSnapshot(callback: (scripts: ScriptData[]) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    let currentScripts: ScriptData[] = [];

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
        currentScripts = data.map(d => this.mapFromDb(d));
        callback(currentScripts);
      }
    };

    fetchScripts();

    const channel = supabase.channel(`public:scripts:trash:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scripts', filter: `user_id=eq.${user.id}` }, payload => {
        if (payload.eventType === 'UPDATE') {
          const updated = this.mapFromDb(payload.new);
          if (!updated.isDeleted) {
            currentScripts = currentScripts.filter(s => s.id !== updated.id);
          } else {
            const index = currentScripts.findIndex(s => s.id === updated.id);
            if (index !== -1) {
              currentScripts[index] = updated;
            } else {
              currentScripts = [updated, ...currentScripts].sort((a, b) => (b.deletedAt?.getTime() || 0) - (a.deletedAt?.getTime() || 0));
            }
          }
          callback([...currentScripts]);
        } else if (payload.eventType === 'DELETE') {
            currentScripts = currentScripts.filter(s => s.id !== payload.old['id']);
            callback([...currentScripts]);
        } else {
          fetchScripts();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }
}
