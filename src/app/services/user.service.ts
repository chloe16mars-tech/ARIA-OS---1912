import { Injectable, inject } from '@angular/core';
import { supabase, handleSupabaseError, OperationType } from '../../supabase';
import { AuthService } from './auth.service';

export interface UserPreferences {
  intention?: string;
  tone?: string;
  stance?: string;
  duration?: string;
}

export interface UserProfile {
  email?: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  generationCount?: number;
  anonymousGenerationCount?: number;
  lastGenerationDate?: Date;
  scheduledDeletionDate?: Date;
  preferences?: UserPreferences;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private authService = inject(AuthService);

  private mapFromDb(row: any): UserProfile {
    return {
      email: row.email,
      displayName: row.display_name,
      photoURL: row.photo_url,
      createdAt: new Date(row.created_at),
      generationCount: row.generation_count,
      anonymousGenerationCount: row.anonymous_generation_count,
      lastGenerationDate: row.last_generation_date ? new Date(row.last_generation_date) : undefined,
      scheduledDeletionDate: row.scheduled_deletion_date ? new Date(row.scheduled_deletion_date) : undefined,
      preferences: row.preferences
    };
  }

  getUserProfileSnapshot(callback: (data: UserProfile | null) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // If row doesn't exist yet (before trigger), ignore or log
        if (error.code !== 'PGRST116') {
          handleSupabaseError(error, OperationType.GET, `users/${user.id}`);
        }
        callback(null);
      } else if (data) {
        callback(this.mapFromDb(data));
      }
    };

    fetchProfile();

    const channel = supabase.channel('public:users:profile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, payload => {
        fetchProfile();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }

  async saveUserPreferences(preferences: UserPreferences) {
    const user = this.authService.currentUser();
    if (!user || user.is_anonymous) return;
    
    const { error } = await supabase
      .from('users')
      .update({ preferences })
      .eq('id', user.id);

    if (error) {
      handleSupabaseError(error, OperationType.UPDATE, 'users');
    }
  }

  async scheduleAccountDeletion() {
    const user = this.authService.currentUser();
    if (!user) return;
    
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 3); // +3 days
    
    const { error } = await supabase
      .from('users')
      .update({ scheduled_deletion_date: deletionDate.toISOString() })
      .eq('id', user.id);

    if (error) {
      handleSupabaseError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  }

  async cancelAccountDeletion() {
    const user = this.authService.currentUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('users')
      .update({ scheduled_deletion_date: null })
      .eq('id', user.id);

    if (error) {
      handleSupabaseError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  }

  async deleteUserAccount() {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) throw new Error("No access token available");

      const response = await fetch('/api/user/account', {
          method: 'DELETE',
          headers: {
              'Authorization': `Bearer ${token}`
          }
      });

      if (!response.ok) {
          throw new Error("Erreur serveur lors de la suppression.");
      }

      await this.authService.logout();
    } catch (error) {
      console.error("Error deleting user account:", error);
      throw error;
    }
  }
}
