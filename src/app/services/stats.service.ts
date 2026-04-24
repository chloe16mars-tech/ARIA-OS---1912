import { Injectable, inject } from '@angular/core';
import { supabase, handleSupabaseError, OperationType } from '../../supabase';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private authService = inject(AuthService);

  getGlobalStatsSnapshot(callback: (total: number) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    const fetchStats = async () => {
      const { data, error } = await supabase
        .from('global_stats')
        .select('total_generations')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error, OperationType.GET, 'global_stats');
      } else if (data) {
        callback(data.total_generations || 0);
      } else {
        callback(0);
      }
    };

    fetchStats();

    const channel = supabase.channel('public:global_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_stats', filter: 'id=eq.1' }, payload => {
        fetchStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }
}
