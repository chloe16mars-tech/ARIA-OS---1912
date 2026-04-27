import { Component, OnInit, OnDestroy, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { UserService, UserProfile } from '../../services/user.service';
import { LanguageService } from '../../services/language.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DatePipe, FormsModule, TranslatePipe],
  template: `
    <div class="p-4 max-w-3xl mx-auto space-y-8 pb-24">
      <div class="space-y-1 px-2">
        <h2 class="text-2xl font-semibold tracking-tight">{{ 'settings.title' | translate }}</h2>
        <p class="text-base text-gray-500 dark:text-gray-400">{{ 'settings.desc' | translate }}</p>
      </div>
      
      <!-- Profile Section -->
      <div class="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
        <div class="flex items-center gap-5 mb-8">
          @if (authService.currentUser()?.user_metadata?.['avatar_url']) {
            <img [src]="authService.currentUser()?.user_metadata?.['avatar_url']" alt="Profile" class="w-20 h-20 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
          } @else {
            <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center text-gray-400">
              <mat-icon class="text-4xl w-10 h-10">person</mat-icon>
            </div>
          }
          <div class="flex-1">
            <h3 class="font-semibold text-xl tracking-tight text-gray-900 dark:text-white">{{ authService.currentUser()?.user_metadata?.['full_name'] || authService.currentUser()?.user_metadata?.['name'] || ('settings.guest' | translate) }}</h3>
            <p class="text-sm text-gray-500">{{ authService.currentUser()?.email || ('settings.noAccount' | translate) }}</p>
          </div>
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-tr from-violet-500/30 to-fuchsia-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative bg-gray-50 dark:bg-[#1C1C1E] px-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 transition-transform group-hover:scale-[1.02]">
              <div class="w-10 h-10 rounded-full bg-white dark:bg-black shadow-inner flex items-center justify-center">
                <mat-icon class="text-gray-900 dark:text-white text-[20px] w-[20px] h-[20px]">auto_awesome</mat-icon>
              </div>
              <div class="flex flex-col">
                <span class="text-[9px] text-gray-500 font-black uppercase tracking-[0.15em] mb-1">{{ 'settings.generated' | translate }}</span>
                <span class="text-3xl font-black text-gray-900 dark:text-white leading-none font-mono tracking-tighter">{{ formatCompactNumber(userProfile()?.generationCount || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex gap-3">
          <button (click)="confirmLogout()" class="flex-1 py-3.5 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
            <mat-icon class="text-[20px] rtl:rotate-180">logout</mat-icon> {{ 'settings.logout' | translate }}
          </button>
        </div>

    <!-- Account Deletion -->
        <div class="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
          @if (isDeleting()) {
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 text-center">
              <mat-icon class="text-red-500 animate-spin mb-2">autorenew</mat-icon>
              <p class="text-red-600 dark:text-red-400 font-semibold">{{ 'settings.account.deleting' | translate }}</p>
              <p class="text-sm text-red-500 mt-1">{{ 'settings.account.deletingDesc' | translate }}</p>
            </div>
          } @else if (userProfile()?.scheduledDeletionDate) {
            <div class="bg-gray-50 dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-4">
              <div class="flex items-start gap-4">
                <div class="bg-gray-200 dark:bg-[#2C2C2E] p-2 rounded-full">
                  <mat-icon class="text-gray-600 dark:text-gray-400">warning</mat-icon>
                </div>
                <div>
                  <h4 class="text-gray-900 dark:text-white font-semibold">{{ 'settings.account.scheduled' | translate }}</h4>
                  <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {{ 'settings.account.scheduledDesc' | translate }} <span class="font-semibold">{{ userProfile()?.scheduledDeletionDate | date:'dd/MM/yyyy HH:mm' }}</span>.
                  </p>
                </div>
              </div>
            </div>
            <button (click)="cancelDeletion()" class="w-full py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
              <mat-icon class="text-[20px]">cancel</mat-icon> {{ 'settings.account.cancelDelete' | translate }}
            </button>
          } @else {
            <button (click)="confirmDeleteAccount()" class="w-full py-3.5 rounded-2xl bg-gray-100 dark:bg-[#2C2C2E] text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-200 dark:hover:bg-[#3C3C3E] flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
              <mat-icon class="text-[20px]">delete_forever</mat-icon> {{ 'settings.account.deleteAccount' | translate }}
            </button>
            <p class="text-center text-xs text-gray-500 mt-3">
              {{ 'settings.account.deleteWarning' | translate }}
            </p>
          }
        </div>
      </div>

      <!-- Preferences Section -->
      <div class="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 space-y-6 shadow-sm">
        <h3 class="font-semibold text-lg tracking-tight">{{ 'settings.preferences' | translate }}</h3>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center">
              <mat-icon class="text-gray-600 dark:text-gray-300">{{ themeService.isDarkMode() ? 'dark_mode' : 'light_mode' }}</mat-icon>
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">{{ 'settings.darkMode' | translate }}</p>
              <p class="text-sm text-gray-500">{{ 'settings.darkModeDesc' | translate }}</p>
            </div>
          </div>
          <button (click)="themeService.toggleTheme()" class="relative inline-flex h-7 w-12 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-[#111]" [class.bg-black]="themeService.isDarkMode()" [class.dark:bg-white]="themeService.isDarkMode()" [class.bg-gray-200]="!themeService.isDarkMode()">
            <span class="inline-block h-5 w-5 transform rounded-full bg-white dark:bg-black shadow-sm" [class.rtl:-translate-x-6]="themeService.isDarkMode()" [class.translate-x-6]="themeService.isDarkMode()" [class.translate-x-1]="!themeService.isDarkMode()"></span>
          </button>
        </div>

        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center">
              <mat-icon class="text-gray-600 dark:text-gray-300">language</mat-icon>
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">{{ 'settings.language' | translate }}</p>
              <p class="text-sm text-gray-500">{{ 'settings.languageDesc' | translate }}</p>
            </div>
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            @for (lang of [
              { id: 'fr', label: 'Français' },
              { id: 'en', label: 'English' },
              { id: 'zh', label: '中文' },
              { id: 'ar', label: 'العربية' },
              { id: 'es', label: 'Español' },
              { id: 'pt', label: 'Português' }
            ]; track lang.id) {
              <button (click)="languageService.setLanguage($any(lang.id))"
                      [class.bg-black]="languageService.currentLang() === lang.id"
                      [class.dark:bg-white]="languageService.currentLang() === lang.id"
                      [class.text-white]="languageService.currentLang() === lang.id"
                      [class.dark:text-black]="languageService.currentLang() === lang.id"
                      [class.border-black]="languageService.currentLang() === lang.id"
                      [class.dark:border-white]="languageService.currentLang() === lang.id"
                      [class.bg-gray-50]="languageService.currentLang() !== lang.id"
                      [class.dark:bg-[#1C1C1E]]="languageService.currentLang() !== lang.id"
                      [class.text-gray-600]="languageService.currentLang() !== lang.id"
                      [class.dark:text-gray-400]="languageService.currentLang() !== lang.id"
                      [class.border-gray-200]="languageService.currentLang() !== lang.id"
                      [class.dark:border-gray-800]="languageService.currentLang() !== lang.id"
                      class="py-3 px-4 rounded-2xl border text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-sm">
                {{ lang.label }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Links Section -->
      <div class="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-3xl p-2 shadow-sm">
        @if (!authService.isAnonymous()) {
          <button (click)="contactTeam()" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#1C1C1E] rounded-2xl group">
            <div class="flex items-center gap-4">
              <div class="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center group-hover:bg-[#25D366]/20">
                <svg class="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <span class="font-medium text-gray-700 dark:text-gray-300">{{ 'settings.contact' | translate }}</span>
            </div>
            <mat-icon class="text-gray-400 rtl:rotate-180">chevron_right</mat-icon>
          </button>
        }
        <button (click)="router.navigate(['/cgu'])" (keydown.enter)="router.navigate(['/cgu'])" tabindex="0" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#1C1C1E] rounded-2xl group">
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center group-hover:bg-white dark:group-hover:bg-[#111]">
              <mat-icon class="text-gray-500 text-[20px] w-[20px] h-[20px]">description</mat-icon>
            </div>
            <span class="font-medium text-gray-700 dark:text-gray-300">{{ 'settings.cgu' | translate }}</span>
          </div>
          <mat-icon class="text-gray-400 rtl:rotate-180">chevron_right</mat-icon>
        </button>
        <button (click)="router.navigate(['/about'])" (keydown.enter)="router.navigate(['/about'])" tabindex="0" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#1C1C1E] rounded-2xl group">
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center group-hover:bg-white dark:group-hover:bg-[#111]">
              <mat-icon class="text-gray-500 text-[20px] w-[20px] h-[20px]">info</mat-icon>
            </div>
            <span class="font-medium text-gray-700 dark:text-gray-300">{{ 'settings.about' | translate }}</span>
          </div>
          <mat-icon class="text-gray-400 rtl:rotate-180">chevron_right</mat-icon>
        </button>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
    @if (showLogoutModal()) {
      <div class="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 aria-reveal" (click)="cancelLogout()" (keydown.escape)="cancelLogout()" tabindex="-1">
        <div class="bg-white/90 dark:bg-[#111]/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/5 w-full max-w-sm p-8 text-center space-y-8 transition-all" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
          <div class="w-20 h-20 bg-red-500/10 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-500/5">
            <mat-icon class="text-red-600 dark:text-red-400 text-4xl w-10 h-10">logout</mat-icon>
          </div>
          <div>
            <h3 class="text-2xl font-black tracking-tight mb-3 text-gray-900 dark:text-white">{{ 'settings.modal.logoutTitle' | translate }}</h3>
            <p class="text-gray-500 dark:text-gray-400 font-medium px-4 leading-relaxed">{{ 'settings.modal.logoutDesc' | translate }}</p>
          </div>
          <div class="flex flex-col gap-3">
            <button (click)="executeLogout()" class="w-full py-4 rounded-2xl font-black bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95">{{ 'settings.logout' | translate }}</button>
            <button (click)="cancelLogout()" class="w-full py-4 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">{{ 'common.cancel' | translate }}</button>
          </div>
        </div>
      </div>
    }

    <!-- Delete Account Confirmation Modal -->
    @if (showDeleteModal()) {
      <div class="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 aria-reveal" (click)="cancelDeleteAccount()" (keydown.escape)="cancelDeleteAccount()" tabindex="-1">
        <div class="bg-white/90 dark:bg-[#111]/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/5 w-full max-w-sm p-8 text-center space-y-8 transition-all" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
          <div class="w-20 h-20 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-gray-500/5">
            <mat-icon class="text-gray-900 dark:text-white text-4xl w-10 h-10">delete_forever</mat-icon>
          </div>
          <div>
            <h3 class="text-2xl font-black tracking-tight mb-3 text-gray-900 dark:text-white">{{ 'settings.modal.deleteTitle' | translate }}</h3>
            <p class="text-gray-500 dark:text-gray-400 font-medium px-4 leading-relaxed">{{ 'settings.modal.deleteDesc' | translate }}</p>
          </div>
          <div class="flex flex-col gap-3">
            <button (click)="executeDeleteAccount()" class="w-full py-4 rounded-2xl font-black bg-black dark:bg-white text-white dark:text-black shadow-xl transition-all active:scale-95">{{ 'common.confirm' | translate }}</button>
            <button (click)="cancelDeleteAccount()" class="w-full py-4 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">{{ 'common.cancel' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `
})
export class SettingsComponent implements OnInit, OnDestroy {
  userProfile = signal<UserProfile | null>(null);
  showLogoutModal = signal(false);
  showDeleteModal = signal(false);
  isDeleting = signal(false);
  private unsubscribeProfile?: () => void;

  public authService = inject(AuthService);
  public themeService = inject(ThemeService);
  private userService = inject(UserService);
  public languageService = inject(LanguageService);
  public router = inject(Router);

  formatCompactNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
  }

  async ngOnInit() {
    // Wait for auth — prevents getUserProfileSnapshot returning a no-op
    // when the page is loaded directly (e.g. deep-link or hard refresh).
    await this.authService.waitForAuthReady();

    this.unsubscribeProfile = this.userService.getUserProfileSnapshot(async (data) => {
      this.userProfile.set(data);

      // Proactive cold deletion: if the scheduled date has passed on the frontend
      // before the backend cron ran, trigger deletion immediately.
      if (data?.scheduledDeletionDate) {
        const deletionTime = new Date(data.scheduledDeletionDate).getTime();
        const now = Date.now();
        if (now >= deletionTime && !this.isDeleting()) {
          this.isDeleting.set(true);
          try {
            await this.userService.deleteUserAccount();
          } catch (e) {
            console.error('Proactive deletion failed:', e);
            this.isDeleting.set(false);
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.unsubscribeProfile) {
      this.unsubscribeProfile();
    }
  }

  confirmLogout() {
    this.showLogoutModal.set(true);
  }

  cancelLogout() {
    this.showLogoutModal.set(false);
  }

  async executeLogout() {
    this.showLogoutModal.set(false);
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  confirmDeleteAccount() {
    this.showDeleteModal.set(true);
  }

  cancelDeleteAccount() {
    this.showDeleteModal.set(false);
  }

  async executeDeleteAccount() {
    this.showDeleteModal.set(false);
    await this.userService.scheduleAccountDeletion();
  }

  async cancelDeletion() {
    await this.userService.cancelAccountDeletion();
  }

  contactTeam() {
    const message = encodeURIComponent("Bonjour l'équipe Aria OS, j'ai une question concernant l'application.");
    window.open(`https://wa.me/24166171036?text=${message}`, '_blank');
  }
}
