import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { AppNotification } from '../../models/notification.model';
import { UserService } from '../../services/user.service';
import { UserProfile } from '../../models/user.model';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [MatIconModule, DatePipe],
  template: `
    <div class="p-4 max-w-3xl mx-auto space-y-6 pb-24">
      <div class="space-y-1 px-2">
        <h2 class="text-2xl font-semibold tracking-tight">Notifications</h2>
        <p class="text-base text-gray-500 dark:text-gray-400">Restez informé des mises à jour.</p>
      </div>
      
      @if (visibleNotifications().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 text-center px-4">
          <div class="w-20 h-20 bg-gray-100 dark:bg-[#1C1C1E] rounded-full flex items-center justify-center mb-6">
            <mat-icon class="text-gray-400 text-4xl w-10 h-10">notifications_none</mat-icon>
          </div>
          <h3 class="text-xl font-semibold mb-2">Aucune notification</h3>
          <p class="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Vous êtes à jour ! Les nouvelles annonces apparaîtront ici.</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (notif of visibleNotifications(); track notif.id) {
            <div class="bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden transition-all"
                 [class.opacity-70]="isRead(notif.id!)">
              
              <!-- Unread Indicator -->
              @if (!isRead(notif.id!)) {
                <div class="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>
              }

              <div class="flex gap-4">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                     [class.bg-blue-50]="notif.type === 'info'"
                     [class.dark:bg-blue-900/20]="notif.type === 'info'"
                     [class.text-blue-600]="notif.type === 'info'"
                     [class.dark:text-blue-400]="notif.type === 'info'"
                     [class.bg-violet-50]="notif.type === 'update'"
                     [class.dark:bg-violet-900/20]="notif.type === 'update'"
                     [class.text-violet-600]="notif.type === 'update'"
                     [class.dark:text-violet-400]="notif.type === 'update'"
                     [class.bg-red-50]="notif.type === 'alert'"
                     [class.dark:bg-red-900/20]="notif.type === 'alert'"
                     [class.text-red-600]="notif.type === 'alert'"
                     [class.dark:text-red-400]="notif.type === 'alert'">
                  <mat-icon>{{ getIcon(notif.type) }}</mat-icon>
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start gap-2 mb-1">
                    <h3 class="font-bold text-base truncate" [class.text-gray-900]="!isRead(notif.id!)" [class.dark:text-white]="!isRead(notif.id!)">{{ notif.title }}</h3>
                    <span class="text-xs text-gray-400 whitespace-nowrap shrink-0">{{ notif.createdAt.toDate() | date:'dd MMM yyyy' }}</span>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{{ notif.message }}</p>
                  
                  <div class="flex gap-2">
                    @if (!isRead(notif.id!)) {
                      <button (click)="markAsRead(notif.id!)" class="text-xs font-medium px-3 py-1.5 bg-gray-100 dark:bg-[#2C2C2E] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        Marquer comme lu
                      </button>
                    }
                    <button (click)="deleteNotification(notif.id!)" class="text-xs font-medium px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  private router = inject(Router);

  notifications = signal<AppNotification[]>([]);
  userProfile = signal<UserProfile | null>(null);
  loading = signal(true);
  
  private unsubNotifications?: () => void;
  private unsubProfile?: () => void;

  visibleNotifications = computed(() => {
    const deleted = this.userProfile()?.deletedNotifications || [];
    return this.notifications().filter(n => !deleted.includes(n.id!));
  });

  ngOnInit() {
    this.unsubNotifications = this.notificationService.getNotificationsSnapshot((data) => {
      this.notifications.set(data);
      this.checkLoading();
    });

    this.unsubProfile = this.userService.getUserProfileSnapshot((data) => {
      this.userProfile.set(data);
      this.checkLoading();
    });
  }

  checkLoading() {
    if (this.notifications() !== undefined && this.userProfile() !== undefined) {
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    if (this.unsubNotifications) this.unsubNotifications();
    if (this.unsubProfile) this.unsubProfile();
  }

  isRead(id: string): boolean {
    return this.userProfile()?.readNotifications?.includes(id) || false;
  }

  getIcon(type: string): string {
    switch (type) {
      case 'update': return 'new_releases';
      case 'alert': return 'warning';
      default: return 'info';
    }
  }

  async markAsRead(id: string) {
    await this.notificationService.markNotificationAsRead(id);
  }

  async deleteNotification(id: string) {
    if (confirm('Voulez-vous vraiment supprimer cette notification ?')) {
      await this.notificationService.deleteNotification(id);
    }
  }
}
