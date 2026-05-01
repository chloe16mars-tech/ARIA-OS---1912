import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { AdminAdsComponent } from './admin-ads.component';
import { AdminConfigComponent } from './admin-config.component';
import { AdminLegalComponent } from './admin-legal.component';

type AdminSection = 'ads' | 'config' | 'legal';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, AdminAdsComponent, AdminConfigComponent, AdminLegalComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex flex-col md:flex-row">
      <!-- Admin Sidebar -->
      <aside class="w-full md:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-8">
        <div>
          <h2 class="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h2>
          <p class="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold">ARIA-OS Control Panel</p>
        </div>

        <nav class="flex flex-col gap-2">
          <button 
            (click)="currentSection.set('ads')"
            [class.bg-violet-500]="currentSection() === 'ads'"
            [class.text-white]="currentSection() === 'ads'"
            class="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-gray-800 group"
          >
            <span class="material-icons-outlined group-hover:scale-110 transition-transform">campaign</span>
            <span class="font-medium">Bannières Pub</span>
          </button>

          <button 
            (click)="currentSection.set('config')"
            [class.bg-violet-500]="currentSection() === 'config'"
            [class.text-white]="currentSection() === 'config'"
            class="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-gray-800 group"
          >
            <span class="material-icons-outlined group-hover:scale-110 transition-transform">settings</span>
            <span class="font-medium">Configuration</span>
          </button>

          <button 
            (click)="currentSection.set('legal')"
            [class.bg-violet-500]="currentSection() === 'legal'"
            [class.text-white]="currentSection() === 'legal'"
            class="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-gray-800 group"
          >
            <span class="material-icons-outlined group-hover:scale-110 transition-transform">gavel</span>
            <span class="font-medium">Légal & CGU</span>
          </button>
        </nav>

        <div class="mt-auto pt-6 border-t border-gray-200 dark:border-gray-800">
          <button 
            class="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            (click)="backToApp()"
          >
            <span class="material-icons-outlined">arrow_back</span>
            <span class="font-medium">Retour à l'App</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 p-4 md:p-10 overflow-y-auto">
        <div class="max-w-5xl mx-auto">
          @if (currentSection() === 'ads') {
            <app-admin-ads></app-admin-ads>
          } @else if (currentSection() === 'config') {
            <app-admin-config></app-admin-config>
          } @else if (currentSection() === 'legal') {
            <app-admin-legal></app-admin-legal>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .material-icons-outlined { font-size: 20px; }
  `]
})
export class AdminComponent {
  private langService = inject(LanguageService);
  currentSection = signal<AdminSection>('ads');

  backToApp() {
    window.location.href = '/';
  }
}
