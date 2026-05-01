import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { adminGuard } from './admin.guard';


const authGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  await authService.waitForAuthReady();

  const targetUrl = router.getCurrentNavigation()?.extractedUrl.toString() || '/';
  const publicRoutes = ['/cgu', '/about', '/login', '/auth/callback'];
  if (publicRoutes.some(r => targetUrl.startsWith(r))) {
    return true;
  }

  if (!authService.currentUser()) {
    return router.parseUrl('/login');
  }

  // Wait for profile (max 1s for better UX)
  let attempts = 0;
  while (!authService.currentUserProfile() && attempts < 5) {
    await new Promise(r => setTimeout(r, 200));
    attempts++;
  }

  const profile = authService.currentUserProfile();
  if (profile?.isAdmin) {
    if (targetUrl === '/' || targetUrl === '/login' || targetUrl === '/auth/callback') {
      return router.parseUrl('/admin');
    }
  }

  return true;
};

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/callback', loadComponent: () => import('./components/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent) },
  {
    path: '',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
      { path: 'history', loadComponent: () => import('./components/history/history.component').then(m => m.HistoryComponent) },
      { path: 'videos', loadComponent: () => import('./components/videos/videos.component').then(m => m.VideosComponent) },
      { path: 'studio', loadComponent: () => import('./components/studio/studio.component').then(m => m.StudioComponent) },
      { path: 'notifications', loadComponent: () => import('./components/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'settings', loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent) },
      { path: 'cgu', loadComponent: () => import('./components/cgu/cgu.component').then(m => m.CguComponent) },
      { path: 'about', loadComponent: () => import('./components/about/about.component').then(m => m.AboutComponent) },
      { 
        path: 'admin', 
        loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [adminGuard]
      }
    ]
  },
  { path: 'cgu', loadComponent: () => import('./components/cgu/cgu.component').then(m => m.CguComponent) },
  { path: 'about', loadComponent: () => import('./components/about/about.component').then(m => m.AboutComponent) },
  {
    path: '**',
    loadComponent: () =>
      import('./components/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
