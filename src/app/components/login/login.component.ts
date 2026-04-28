import { Component, signal, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CguComponent } from '../cgu/cgu.component';
import { Capacitor } from '@capacitor/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatIconModule, CguComponent, TranslatePipe],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-[#F9F9FB] dark:bg-[#0A0A0C] p-4 relative">
      
      <div class="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-10 space-y-10 relative z-10">
        
        <div class="text-center space-y-4">
          <div class="w-16 h-16 mx-auto bg-gray-900 dark:bg-white rounded-2xl flex items-center justify-center p-3 mb-6 shadow-xl">
            <mat-icon class="text-white dark:text-black text-4xl w-full h-full flex items-center justify-center">auto_awesome</mat-icon>
          </div>
          <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white pb-2 flex flex-col gap-2 items-center justify-center">
            <span class="text-2xl font-semibold">{{ 'login.welcome' | translate }}</span>
            <span class="font-black tracking-tight drop-shadow-sm">
               <span class="text-red-500">A</span><span class="text-orange-500">R</span><span class="text-yellow-500">I</span><span class="text-green-500">A</span><span class="text-gray-900 dark:text-white">OS</span>
            </span>
          </h1>
          <p class="text-gray-500 dark:text-gray-400 font-medium text-[15px] max-w-[280px] mx-auto leading-relaxed">
            {{ 'login.desc' | translate }}
          </p>
        </div>

        <div class="pt-6 space-y-4">
          @if (errorMessage()) {
            <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/50 whitespace-pre-wrap">
              {{ errorMessage() }}
            </div>
          }
          <button (click)="login()" [disabled]="isLoadingGoogle()" class="w-full relative flex items-center justify-center gap-3 bg-black dark:bg-white border border-transparent hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black font-semibold py-4 px-4 rounded-2xl shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
            @if (isLoadingGoogle()) {
              <div class="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>
              {{ 'common.loading' | translate }}
            } @else {
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {{ 'login.google' | translate }}
            }
          </button>

          <button (click)="loginAnonymously()" class="w-full relative flex items-center justify-center gap-3 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#3C3C3E] text-gray-900 dark:text-white font-semibold py-4 px-4 rounded-2xl shadow-sm active:scale-[0.98]">
            <mat-icon>person_outline</mat-icon>
            {{ 'login.anonymous' | translate }}
          </button>
        </div>
        
        <p class="text-center text-xs text-gray-500 mt-8 font-medium">
          {{ 'login.cgu' | translate }} <br><button (click)="showCgu.set(true)" class="text-black dark:text-white hover:underline font-bold cursor-pointer bg-transparent border-0 inline">{{ 'settings.cgu' | translate }}</button>.
        </p>
      </div>
      
      <!-- Copyright -->
      <div class="fixed bottom-4 left-0 right-0 text-center z-30 pointer-events-none">
        <p class="text-[10px] text-gray-400 dark:text-gray-600 font-medium">&copy; 2026 Mmedia Universe</p>
      </div>

      <!-- CGU Popup -->
      @if (showCgu()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 shadow-2xl">
          <div class="bg-white dark:bg-[#0A0A0C] w-full max-w-4xl h-full max-h-[90vh] rounded-3xl overflow-hidden flex flex-col relative shadow-[0_0_40px_rgba(0,0,0,0.3)] border border-white/10">
            <app-cgu [isPopup]="true" (closePopup)="showCgu.set(false)" class="h-full block overflow-y-auto" />
          </div>
        </div>
      }
    </div>
  `
})
export class LoginComponent {
  errorMessage = signal<string | null>(null);
  isLoadingGoogle = signal(false);
  showCgu = signal(false);

  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  constructor() {
    // If the user is already logged in, send them home immediately
    this.authService.waitForAuthReady().then(async () => {
      const user = this.authService.currentUser();
      if (user) {
        // Wait for profile to load
        let attempts = 0;
        while (!this.authService.currentUserProfile() && attempts < 10) {
          await new Promise(r => setTimeout(r, 200));
          attempts++;
        }

        const profile = this.authService.currentUserProfile();
        if (profile?.isAdmin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      }
    });
  }

  async login() {
    if (this.isLoadingGoogle()) return;
    
    this.errorMessage.set(null);
    this.isLoadingGoogle.set(true);
    try {
      await this.authService.loginWithGoogle();
      
      // Wait for auth to be fully ready and session applied
      await this.authService.waitForAuthReady();
      const user = this.authService.currentUser();
      
      if (user) {
        // Wait for profile to load
        let attempts = 0;
        while (!this.authService.currentUserProfile() && attempts < 10) {
          await new Promise(r => setTimeout(r, 200));
          attempts++;
        }

        const profile = this.authService.currentUserProfile();
        if (profile?.isAdmin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      } else {
        this.router.navigate(['/']);
      }
    } catch (error) {
      console.error('Login error', error);
      
      const err = Object(error);
      const isNative = Capacitor.isNativePlatform();
      
      // Determine error code correctly depending on whether it's a native plugin error or Firebase web error
      const errorCode = err?.code || err?.message || '';

      if (errorCode.includes('network-request-failed') || errorCode.includes('network error') || errorCode.includes('OFFLINE')) {
        this.errorMessage.set(`🔌 Vous êtes hors ligne.\nVeuillez vérifier votre connexion internet (Wi-Fi ou données mobiles) et réessayer.`);
      } else if (errorCode.includes('popup-blocked')) {
        this.errorMessage.set("🛑 La fenêtre de connexion a été bloquée par votre navigateur.\n\nVeuillez autoriser les fenêtres pop-up pour ce site et réessayer.");
      } else if (errorCode.includes('popup-closed-by-user') || errorCode.includes('SIGN_IN_CANCELLED')) {
        this.errorMessage.set("💡 La fenêtre de connexion a été fermée. Vous pouvez réessayer quand vous serez prêt.");
      } else if (errorCode.includes('cancelled-popup-request') || errorCode.includes('SIGN_IN_IN_PROGRESS')) {
        this.errorMessage.set("⌛ Une tentative de connexion est déjà en cours. Veuillez patienter.");
      } else if (errorCode.includes('internal-error')) {
        this.errorMessage.set("⚙️ Une erreur interne s'est produite lors de la connexion. Veuillez réessayer plus tard.");
      } else {
        // Fallback for iframe web preview if really needed, but keep it clean
        if (!isNative && errorCode.includes('cross-origin')) {
           this.errorMessage.set("🛑 La connexion est bloquée par votre navigateur.\n\nVeuillez autoriser les fenêtres pop-up ou ouvrir l'application dans un nouvel onglet.");
        } else {
           this.errorMessage.set("⚠️ Impossible de se connecter pour le moment. Veuillez réessayer.");
        }
      }
      this.isLoadingGoogle.set(false);
    }
  }

  async loginAnonymously() {
    try {
      await this.authService.loginAnonymously();
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Anonymous login error', error);
      this.errorMessage.set("⚠️ Impossible de se connecter en mode invité.");
    }
  }
}
