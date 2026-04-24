import { Injectable, inject } from '@angular/core';
import { supabase } from '../../supabase';
import { AuthService } from './auth.service';

export interface AppNotification {
  id?: string;
  title: string;
  message: string;
  type: 'update' | 'info' | 'alert';
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private authService = inject(AuthService);

  getNotificationsSnapshot(callback: (notifications: AppNotification[]) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => { /* no-op */ };

    this.fetchNotifications(callback);

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          this.fetchNotifications(callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  private async fetchNotifications(callback: (notifications: AppNotification[]) => void) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) {
      callback(data as AppNotification[]);
    }
  }

  async markNotificationAsRead(notificationId: string) {
    const user = this.authService.currentUser();
    if (!user) return;

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('read_notifications')
      .eq('id', user.id)
      .single();

    if (profile) {
      const readNotifications = profile.read_notifications || [];
      if (!readNotifications.includes(notificationId)) {
        await supabase
          .from('profiles')
          .update({ read_notifications: [...readNotifications, notificationId] })
          .eq('id', user.id);
      }
    }
  }

  async deleteNotification(notificationId: string) {
    const user = this.authService.currentUser();
    if (!user) return;

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('deleted_notifications')
      .eq('id', user.id)
      .single();

    if (profile) {
      const deletedNotifications = profile.deleted_notifications || [];
      if (!deletedNotifications.includes(notificationId)) {
        await supabase
          .from('profiles')
          .update({ deleted_notifications: [...deletedNotifications, notificationId] })
          .eq('id', user.id);
      }
    }
  }
}
