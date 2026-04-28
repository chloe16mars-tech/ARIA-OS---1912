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
  readNotifications?: string[];
  deletedNotifications?: string[];
  isAdmin?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private authService = inject(AuthService);

  private mapFromDb(row: Record<string, unknown>): UserProfile {
    return {
      email: row['email'] as string | undefined,
      displayName: row['display_name'] as string | undefined,
      photoURL: row['photo_url'] as string | undefined,
      createdAt: new Date(row['created_at'] as string),
      generationCount: row['generation_count'] as number | undefined,
      anonymousGenerationCount: row['anonymous_generation_count'] as number | undefined,
      lastGenerationDate: row['last_generation_date'] ? new Date(row['last_generation_date'] as string) : undefined,
      scheduledDeletionDate: row['scheduled_deletion_date'] ? new Date(row['scheduled_deletion_date'] as string) : undefined,
      preferences: row['preferences'] as UserPreferences | undefined,
      readNotifications: (row['read_notifications'] as string[]) || [],
      deletedNotifications: (row['deleted_notifications'] as string[]) || [],
      isAdmin: row['is_admin'] as boolean | undefined
    };
  }

  getUserProfileSnapshot(callback: (data: UserProfile | null) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('[UserService] Error fetching profile:', error);
        }
        callback(null);
      } else if (data) {
        callback(this.mapFromDb(data));
      }
    };

    fetchProfile();

    const channel = supabase.channel(`public:profiles:${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles', 
        filter: `id=eq.${user.id}` 
      }, () => {
        fetchProfile();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[UserService] Error fetching profile:', error);
      }
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  }

  async saveUserPreferences(preferences: UserPreferences) {
    const user = this.authService.currentUser();
    if (!user || user.is_anonymous) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ preferences })
      .eq('id', user.id);

    if (error) {
      handleSupabaseError(error, OperationType.UPDATE, 'profiles');
    }
  }

  async scheduleAccountDeletion() {
    const user = this.authService.currentUser();
    if (!user) return;
    
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 3); // +3 days
    
    const { error } = await supabase
      .from('profiles')
      .update({ scheduled_deletion_date: deletionDate.toISOString() })
      .eq('id', user.id);

    if (error) {
      handleSupabaseError(error, OperationType.UPDATE, `profiles/${user.id}`);
    }
  }

  async cancelAccountDeletion() {
    const user = this.authService.currentUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ scheduled_deletion_date: null })
      .eq('id', user.id);

    if (error) {
      handleSupabaseError(error, OperationType.UPDATE, `profiles/${user.id}`);
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
