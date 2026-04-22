import {ChangeDetectionStrategy, Component, effect, inject, OnInit} from '@angular/core';
import {RouterOutlet, Router} from '@angular/router';
import {ThemeService} from './services/theme.service';
import {AuthService} from './services/auth.service';
import {UserService} from './services/user.service';
import {Timestamp} from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  constructor() {
    effect(() => {
      // Setup dynamic StatusBar colors according to the Angular theme context
      if (Capacitor.isNativePlatform()) {
        const isDark = this.themeService.isDarkMode();
        StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
        if (Capacitor.getPlatform() === 'android') {
          StatusBar.setBackgroundColor({ color: isDark ? '#0A0A0C' : '#F9F9FB' }).catch(() => {});
        }
      }

      if (this.authService.isAuthReady() && this.authService.currentUser()) {
        this.checkAccountDeletion();
        // Hide splash screen once auth state is fully evaluated
        if (Capacitor.isNativePlatform()) {
          SplashScreen.hide().catch(() => {});
        }
      } else if (this.authService.isAuthReady() && !this.authService.currentUser()) {
        // Also hide it if user is logged out and ready to see the login page
        if (Capacitor.isNativePlatform()) {
          SplashScreen.hide().catch(() => {});
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
          await StatusBar.setOverlaysWebView({ overlay: false }); // Ensure it pushes content down gracefully
        }
      } catch (e) {
        console.warn('Status bar not available', e);
      }
    }
  }

  private checkAccountDeletion() {
    const unsubscribe = this.userService.getUserProfileSnapshot(async (profile) => {
      if (profile && profile['scheduledDeletionDate']) {
        const deletionDate = (profile['scheduledDeletionDate'] as Timestamp).toDate();
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
