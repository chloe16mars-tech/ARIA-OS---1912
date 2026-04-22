import { Component, OnInit, OnDestroy, signal, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { StatsService } from '../../services/stats.service';
import { NotificationService, AppNotification } from '../../services/notification.service';
import { UserService, UserProfile } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ToastComponent } from '../ui/toast/toast.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, ToastComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-[#F9F9FB] dark:bg-[#0A0A0C] text-gray-900 dark:text-gray-100 relative">
      <app-toast />
      
      <!-- Background Pattern -->
      <div class="fixed inset-0 pointer-events-none z-[-1] opacity-[0.03] bg-cakenews-pattern"></div>

      <!-- Global Fixed Header -->
      <div class="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0A0A0C]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50" style="padding-top: var(--sat);">
        <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-black tracking-tight drop-shadow-sm flex items-center gap-1">
               <span class="text-red-500">A</span><span class="text-orange-500">R</span><span class="text-yellow-500">I</span><span class="text-green-500">A</span><span class="text-gray-900 dark:text-white">OS</span>
            </h1>
          </div>
          <div class="bg-gray-50/80 dark:bg-[#1C1C1E]/80 px-3 py-1.5 rounded-full border-[0.5px] border-gray-200/50 dark:border-gray-800/50 flex items-center gap-2 shadow-sm">
            <div class="relative w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <div class="flex flex-col">
              <span class="text-[9px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold leading-none mb-0.5">Scripts générés</span>
              <span class="font-bold text-black dark:text-white leading-none font-mono text-sm">{{ totalGenerations() | number }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <main class="flex-1 pb-32 relative" style="padding-top: calc(80px + var(--sat));">
        <router-outlet></router-outlet>
      </main>

      <!-- Copyright -->
      <div class="fixed bottom-3 left-0 right-0 text-center z-30 pointer-events-none">
        <p class="text-[10px] text-gray-400 dark:text-gray-600 font-medium">&copy; 2026 Mmedia Universe</p>
      </div>

      <!-- Bottom Navigation (Floating Pill Style for modern ergonomics) -->
      <div class="fixed bottom-10 left-0 right-0 flex justify-center z-40 pointer-events-none px-4">
        <nav class="bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg shadow-black/5 dark:shadow-black/20 rounded-[2rem] flex justify-around items-center px-2 py-2 gap-1 sm:gap-2 pointer-events-auto">
          <a routerLink="/" routerLinkActive="text-black dark:text-white bg-gray-100 dark:bg-[#2C2C2E]" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center justify-center rounded-2xl text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 w-[64px] h-[64px] sm:w-[72px] sm:h-[72px]">
            <mat-icon class="text-2xl">auto_awesome</mat-icon>
            <span class="text-[10px] mt-1 font-medium truncate w-full text-center px-1">Générer</span>
          </a>
          @if (!authService.isAnonymous()) {
            <a routerLink="/history" routerLinkActive="text-black dark:text-white bg-gray-100 dark:bg-[#2C2C2E]" class="flex flex-col items-center justify-center rounded-2xl text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 w-[64px] h-[64px] sm:w-[72px] sm:h-[72px]">
              <mat-icon class="text-2xl">text_snippet</mat-icon>
              <span class="text-[10px] mt-1 font-medium truncate w-full text-center px-1">Scripts</span>
            </a>
            <a routerLink="/videos" routerLinkActive="text-black dark:text-white bg-gray-100 dark:bg-[#2C2C2E]" class="flex flex-col items-center justify-center rounded-2xl text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 w-[64px] h-[64px] sm:w-[72px] sm:h-[72px]">
              <mat-icon class="text-2xl">video_library</mat-icon>
              <span class="text-[10px] mt-1 font-medium truncate w-full text-center px-1">Vidéos</span>
            </a>
          }
          <a routerLink="/notifications" routerLinkActive="text-black dark:text-white bg-gray-100 dark:bg-[#2C2C2E]" class="flex flex-col items-center justify-center rounded-2xl text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] relative">
            <div class="relative flex flex-col items-center justify-center">
              <mat-icon class="text-2xl">notifications</mat-icon>
              @if (unreadCount() > 0) {
                <span class="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[#1C1C1E]">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
              }
            </div>
            <span class="text-[10px] mt-1 font-medium truncate w-full text-center px-1">Boîte</span>
          </a>
          <a routerLink="/settings" routerLinkActive="text-black dark:text-white bg-gray-100 dark:bg-[#2C2C2E]" class="flex flex-col items-center justify-center rounded-2xl text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 w-[64px] h-[64px] sm:w-[72px] sm:h-[72px]">
            <mat-icon class="text-2xl">person</mat-icon>
            <span class="text-[10px] mt-1 font-medium truncate w-full text-center px-1">Moi</span>
          </a>
        </nav>
      </div>
    </div>
  `
})
export class LayoutComponent implements OnInit, OnDestroy {
  totalGenerations = signal(0);
  notifications = signal<AppNotification[]>([]);
  userProfile = signal<UserProfile | null>(null);
  
  private unsubscribeStats?: () => void;
  private unsubNotifications?: () => void;
  private unsubProfile?: () => void;
  
  private statsService = inject(StatsService);
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  public authService = inject(AuthService);

  unreadCount = computed(() => {
    const notifs = this.notifications();
    const profile = this.userProfile();
    if (!profile) return 0;
    
    const deleted = profile.deletedNotifications || [];
    const read = profile.readNotifications || [];
    
    return notifs.filter(n => !deleted.includes(n.id!) && !read.includes(n.id!)).length;
  });

  ngOnInit() {
    this.unsubscribeStats = this.statsService.getGlobalStatsSnapshot((total) => {
      this.totalGenerations.set(total);
    });
    
    this.unsubNotifications = this.notificationService.getNotificationsSnapshot((data) => {
      this.notifications.set(data);
    });

    this.unsubProfile = this.userService.getUserProfileSnapshot((data) => {
      this.userProfile.set(data);
    });
  }

  ngOnDestroy() {
    if (this.unsubscribeStats) this.unsubscribeStats();
    if (this.unsubNotifications) this.unsubNotifications();
    if (this.unsubProfile) this.unsubProfile();
  }
}
