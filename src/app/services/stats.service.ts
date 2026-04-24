import { Injectable, inject } from '@angular/core';
import { supabase } from '../../supabase';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private authService = inject(AuthService);

  getGlobalStatsSnapshot(callback: (total: number) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    // Supabase way: fetch count of all scripts
    this.fetchCount(callback);

    const channel = supabase
      .channel('global-stats')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scripts' },
        () => {
          this.fetchCount(callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  private async fetchCount(callback: (total: number) => void) {
    // Note: count(*) can be slow on very large tables, but fine for now
    const { count, error } = await supabase
      .from('scripts')
      .select('*', { count: 'exact', head: true });

    if (!error) {
      callback(count || 0);
    }
  }
}
