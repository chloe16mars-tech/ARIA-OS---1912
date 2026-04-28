import { Component, OnInit, inject } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-white dark:bg-[#0A0A0C]">
      <div class="text-center space-y-4">
        <div class="w-12 h-12 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-gray-600 dark:text-gray-400 font-medium">{{ 'common.loading' | translate }}...</p>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  async ngOnInit() {
    await this.authService.waitForAuthReady();
    const user = this.authService.currentUser();

    if (user) {
      // Wait for profile to load (max 2 seconds)
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
  }
}
