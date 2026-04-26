import { Component, OnInit } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

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
  async ngOnInit() {
    // Supabase will automatically handle the fragment in the URL
    // and store the session in local storage.
    
    // We wait a bit to ensure the session is processed
    setTimeout(() => {
      if (window.opener) {
        // Send a message to the parent window if needed
        window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
        // Close the popup
        window.close();
      } else {
        // If not in a popup, redirect to home
        window.location.href = '/';
      }
    }, 1500);
  }
}
