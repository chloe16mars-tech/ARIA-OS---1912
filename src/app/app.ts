import {ChangeDetectionStrategy, Component, effect, inject, OnInit} from '@angular/core';
import {RouterOutlet, Router} from '@angular/router';
import {ThemeService} from './services/theme.service';
import {AuthService} from './services/auth.service';
import {UserService} from './services/user.service';
import {AppConfigService} from './services/app-config.service';
import {SpecialPopupComponent} from './components/ui/special-popup.component';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, SpecialPopupComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private appConfigService = inject(AppConfigService);
  private router = inject(Router);

  constructor() {
    effect(() => {
      // Setup dynamic StatusBar colors according to the Angular theme context
      if (Capacitor.isNativePlatform()) {
        const isDark = this.themeService.isDarkMode();
        StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {
          // Status bar not available or failed to set
        });
        if (Capacitor.getPlatform() === 'android') {
          StatusBar.setBackgroundColor({ color: isDark ? '#0A0A0C' : '#F9F9FB' }).catch(() => {
            // Fails on some versions/platforms
          });
        }
      }

      if (this.authService.isAuthReady() && this.authService.currentUser()) {
        this.checkAccountDeletion();
        // Hide splash screen once auth state is fully evaluated
        if (Capacitor.isNativePlatform()) {
          SplashScreen.hide().catch(() => {
            // Splash screen might not be present
          });
        }
      } else if (this.authService.isAuthReady() && !this.authService.currentUser()) {
        // Also hide it if user is logged out and ready to see the login page
        if (Capacitor.isNativePlatform()) {
          SplashScreen.hide().catch(() => {
             // Splash screen might not be present
          });
        }
      }
    });
  }

  async ngOnInit() {
    // Basic native platform initialization (fallback)
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#0A0A0C' });
          await StatusBar.setOverlaysWebView({ overlay: false });
        }
      } catch (e) {
        console.warn('Status bar not available', e);
      }
    }
    
    // Initialize Global App Configuration
    await this.appConfigService.initialize();
  }

  private checkAccountDeletion() {
    const unsubscribe = this.userService.getUserProfileSnapshot(async (profile) => {
      if (profile && profile.scheduledDeletionDate) {
        const deletionDate = new Date(profile.scheduledDeletionDate);
        if (new Date() > deletionDate) {
          try {
            await this.userService.deleteUserAccount();
            this.router.navigate(['/login']);
          } catch (error) {
            console.error("Failed to delete account", error);
          }
        }
      }
      unsubscribe(); // Only need to check once on load
    });
  }
}
