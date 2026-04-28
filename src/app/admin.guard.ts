import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const adminGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('%c[AdminGuard] Checking access...', 'color: #ffa500; font-weight: bold;');
  await authService.waitForAuthReady();

  const user = authService.currentUser();
  if (!user) {
    console.warn('[AdminGuard] No user session found. Redirecting to /login');
    return router.parseUrl('/login');
  }

  // If profile isn't loaded yet, wait a bit
  let attempts = 0;
  while (!authService.currentUserProfile() && attempts < 15) {
    console.log(`[AdminGuard] Waiting for profile... Attempt ${attempts + 1}/15`);
    await new Promise(r => setTimeout(r, 200));
    attempts++;
  }

  const profile = authService.currentUserProfile();
  console.log('[AdminGuard] Profile check:', profile);

  if (!profile?.isAdmin) {
    console.warn('%c[AdminGuard] ACCESS DENIED: User is not an admin. Redirecting to /', 'color: #ff0000; font-weight: bold;');
    return router.parseUrl('/');
  }

  console.log('%c[AdminGuard] ACCESS GRANTED: Welcome, admin.', 'color: #00ff00; font-weight: bold;');
  return true;
};
