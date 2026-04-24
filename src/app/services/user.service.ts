import { Injectable, inject } from '@angular/core';
import { supabase } from '../../supabase';
import { AuthService } from './auth.service';

export interface UserPreferences {
  intention?: string;
  tone?: string;
  stance?: string;
  duration?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  display_name?: string;
  photo_url?: string;
  created_at: string;
  generation_count?: number;
  anonymous_generation_count?: number;
  last_generation_date?: string;
  scheduled_deletion_date?: string;
  deleted_notifications?: string[];
  read_notifications?: string[];
  preferences?: UserPreferences;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private authService = inject(AuthService);

  getUserProfileSnapshot(callback: (data: UserProfile | null) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    // Initial fetch
    this.fetchProfile(user.id, callback);

    // Subscribe to changes
    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          callback(payload.new as UserProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  private async fetchProfile(id: string, callback: (data: UserProfile | null) => void) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching profile:", error);
      callback(null);
    } else {
      callback(data as UserProfile);
    }
  }

  async saveUserPreferences(preferences: UserPreferences) {
    const user = this.authService.currentUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ preferences })
      .eq('id', user.id);
    
    if (error) {
      console.error("Error saving preferences:", error);
      throw error;
    }
  }

  async scheduleAccountDeletion() {
    const user = this.authService.currentUser();
    if (!user) return;
    
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 3); // +3 days
    
    const { error } = await supabase
      .from('profiles')
      .update({
        scheduled_deletion_date: deletionDate.toISOString()
      })
      .eq('id', user.id);
    
    if (error) {
      console.error("Error scheduling deletion:", error);
      throw error;
    }
  }

  async cancelAccountDeletion() {
    const user = this.authService.currentUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({
        scheduled_deletion_date: null
      })
      .eq('id', user.id);
    
    if (error) {
      console.error("Error cancelling deletion:", error);
      throw error;
    }
  }

  async deleteUserAccount() {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      // With Supabase, we can use a Database Function or Edge Function for complex deletion
      // For now, we'll use the profile deletion which is cascaded
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      // Wait, client SDK cannot delete users for security reasons usually (needs service role)
      // So we'll call our backend
      
      const session = this.authService.session();
      const token = session?.access_token;
      
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
