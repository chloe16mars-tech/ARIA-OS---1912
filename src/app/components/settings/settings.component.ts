import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { UserService, UserProfile } from '../../services/user.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [MatIconModule, DatePipe, FormsModule],
  template: `
    <div class="p-4 max-w-3xl mx-auto space-y-8 pb-24">
      <div class="space-y-1 px-2">
        <h2 class="text-2xl font-semibold tracking-tight">Profil & Réglages</h2>
        <p class="text-base text-gray-500 dark:text-gray-400">Gérez votre compte et vos préférences.</p>
      </div>
      
      <!-- Profile Section -->
      <div class="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
        <div class="flex items-center gap-5 mb-8">
          @if (authService.currentUser()?.photoURL) {
            <img [src]="authService.currentUser()?.photoURL" alt="Profile" class="w-20 h-20 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
          } @else {
            <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center text-gray-400">
              <mat-icon class="text-4xl w-10 h-10">person</mat-icon>
            </div>
          }
          <div class="flex-1">
            <h3 class="font-semibold text-xl tracking-tight text-gray-900 dark:text-white">{{ authService.currentUser()?.displayName || 'Invité' }}</h3>
            <p class="text-sm text-gray-500">{{ authService.currentUser()?.email || 'Mode sans compte' }}</p>
          </div>
          <div class="bg-gray-50 dark:bg-[#1C1C1E] px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <mat-icon class="text-gray-900 dark:text-white">auto_awesome</mat-icon>
            <div class="flex flex-col">
              <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Générés</span>
              <span class="text-2xl font-bold text-gray-900 dark:text-white leading-none">{{ userProfile()?.['generationCount'] || 0 }}</span>
            </div>
          </div>
        </div>
        
        <div class="flex gap-3">
          <button (click)="confirmLogout()" class="flex-1 py-3.5 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
            <mat-icon class="text-[20px]">logout</mat-icon> Déconnexion
          </button>
        </div>

        <!-- Account Deletion -->
        @if (!authService.currentUser()?.isAnonymous) {
          <div class="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
            @if (userProfile()?.['scheduledDeletionDate']) {
              <div class="bg-gray-50 dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-4">
                <div class="flex items-start gap-4">
                  <div class="bg-gray-200 dark:bg-[#2C2C2E] p-2 rounded-full">
                    <mat-icon class="text-gray-600 dark:text-gray-400">warning</mat-icon>
                  </div>
                  <div>
                    <h4 class="text-gray-900 dark:text-white font-semibold">Suppression programmée</h4>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Votre compte sera définitivement supprimé le <span class="font-semibold">{{ $any(userProfile()?.['scheduledDeletionDate'])?.toDate() | date:'dd/MM/yyyy à HH:mm' }}</span>.
                    </p>
                  </div>
                </div>
              </div>
              <button (click)="cancelDeletion()" class="w-full py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
                <mat-icon class="text-[20px]">cancel</mat-icon> Annuler la suppression
              </button>
            } @else {
              <button (click)="confirmDeleteAccount()" class="w-full py-3.5 rounded-2xl bg-gray-100 dark:bg-[#2C2C2E] text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-200 dark:hover:bg-[#3C3C3E] flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
                <mat-icon class="text-[20px]">delete_forever</mat-icon> Supprimer mon compte
              </button>
              <p class="text-center text-xs text-gray-500 mt-3">
                Un délai de 3 jours sera appliqué avant la suppression définitive.
              </p>
            }
          </div>
        }
      </div>

      <!-- Preferences Section -->
      <div class="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 class="font-semibold text-lg mb-4 tracking-tight">Préférences</h3>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center">
              <mat-icon class="text-gray-600 dark:text-gray-300">{{ themeService.isDarkMode() ? 'dark_mode' : 'light_mode' }}</mat-icon>
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">Mode sombre</p>
              <p class="text-sm text-gray-500">Inverser les couleurs de l'interface</p>
            </div>
          </div>
          <button (click)="themeService.toggleTheme()" class="relative inline-flex h-7 w-12 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-[#111]" [class.bg-black]="themeService.isDarkMode()" [class.dark:bg-white]="themeService.isDarkMode()" [class.bg-gray-200]="!themeService.isDarkMode()">
            <span class="inline-block h-5 w-5 transform rounded-full bg-white dark:bg-black shadow-sm" [class.translate-x-6]="themeService.isDarkMode()" [class.translate-x-1]="!themeService.isDarkMode()"></span>
          </button>
        </div>
      </div>

      <!-- Links Section -->
      <div class="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-3xl p-2 shadow-sm">
        @if (!authService.currentUser()?.isAnonymous) {
          <button (click)="contactTeam()" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#1C1C1E] rounded-2xl group">
            <div class="flex items-center gap-4">
              <div class="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center group-hover:bg-[#25D366]/20">
                <svg class="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <span class="font-medium text-gray-700 dark:text-gray-300">Contactez l'équipe</span>
            </div>
            <mat-icon class="text-gray-400">chevron_right</mat-icon>
          </button>
        }
        <button (click)="router.navigate(['/cgu'])" (keydown.enter)="router.navigate(['/cgu'])" tabindex="0" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#1C1C1E] rounded-2xl group">
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center group-hover:bg-white dark:group-hover:bg-[#111]">
              <mat-icon class="text-gray-500 text-[20px] w-[20px] h-[20px]">description</mat-icon>
            </div>
            <span class="font-medium text-gray-700 dark:text-gray-300">Conditions Générales d'Utilisation</span>
          </div>
          <mat-icon class="text-gray-400">chevron_right</mat-icon>
        </button>
        <button (click)="router.navigate(['/about'])" (keydown.enter)="router.navigate(['/about'])" tabindex="0" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#1C1C1E] rounded-2xl group">
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center group-hover:bg-white dark:group-hover:bg-[#111]">
              <mat-icon class="text-gray-500 text-[20px] w-[20px] h-[20px]">info</mat-icon>
            </div>
            <span class="font-medium text-gray-700 dark:text-gray-300">À propos de 1912</span>
          </div>
          <mat-icon class="text-gray-400">chevron_right</mat-icon>
        </button>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
    @if (showLogoutModal()) {
      <div class="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 " (click)="cancelLogout()" (keydown.escape)="cancelLogout()" tabindex="-1">
        <div class="bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-sm p-6 text-center space-y-6" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
          <div class="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <mat-icon class="text-red-600 dark:text-red-400 text-3xl w-8 h-8">logout</mat-icon>
          </div>
          <div>
            <h3 class="text-xl font-semibold tracking-tight mb-2">Se déconnecter ?</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Vous devrez vous reconnecter pour accéder à vos scripts.</p>
          </div>
          <div class="flex gap-3">
            <button (click)="cancelLogout()" class="flex-1 py-3 rounded-2xl font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm">Annuler</button>
            <button (click)="executeLogout()" class="flex-1 py-3 rounded-2xl font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm">Déconnexion</button>
          </div>
        </div>
      </div>
    }

    <!-- Delete Account Confirmation Modal -->
    @if (showDeleteModal()) {
      <div class="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 " (click)="cancelDeleteAccount()" (keydown.escape)="cancelDeleteAccount()" tabindex="-1">
        <div class="bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-sm p-6 text-center space-y-6" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
          <div class="w-16 h-16 bg-gray-100 dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto">
            <mat-icon class="text-gray-600 dark:text-gray-400 text-3xl w-8 h-8">delete_forever</mat-icon>
          </div>
          <div>
            <h3 class="text-xl font-semibold tracking-tight mb-2">Supprimer le compte ?</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Cette action programmera la suppression de votre compte dans 3 jours. Vous pourrez annuler d'ici là.</p>
          </div>
          <div class="flex gap-3">
            <button (click)="cancelDeleteAccount()" class="flex-1 py-3 rounded-2xl font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm">Annuler</button>
            <button (click)="executeDeleteAccount()" class="flex-1 py-3 rounded-2xl font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-black hover:bg-black dark:hover:bg-white shadow-sm">Confirmer</button>
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
  private unsubscribeProfile?: () => void;

  public authService = inject(AuthService);
  public themeService = inject(ThemeService);
  private userService = inject(UserService);
  public router = inject(Router);

  ngOnInit() {
    this.unsubscribeProfile = this.userService.getUserProfileSnapshot((data) => {
      this.userProfile.set(data);
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
    const message = encodeURIComponent("Bonjour l'équipe 1912, j'ai une question concernant l'application.");
    window.open(`https://wa.me/24166171036?text=${message}`, '_blank');
  }
}
