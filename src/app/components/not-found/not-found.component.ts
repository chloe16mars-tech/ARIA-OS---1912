import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-black">
      <p class="text-7xl font-black tracking-tighter text-violet-600 dark:text-violet-400">404</p>
      <h1 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Page introuvable</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400 max-w-md">
        Cette page n'existe pas ou a été déplacée.
      </p>
      <a
        routerLink="/"
        class="mt-8 px-6 py-3 rounded-full bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors"
      >
        Retour à l'accueil
      </a>
    </div>
  `,
})
export class NotFoundComponent {}
