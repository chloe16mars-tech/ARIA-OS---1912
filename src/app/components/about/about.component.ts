import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  template: `
    <div class="p-4 max-w-3xl mx-auto space-y-6 text-center">
      <div class="flex items-center gap-4 mb-8 text-left">
        <button (click)="goBack()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 class="text-2xl font-bold">{{ 'about.title' | translate }}</h2>
      </div>
      
      <div class="w-24 h-24 bg-gray-900 dark:bg-white text-white dark:text-black rounded-3xl mx-auto flex items-center justify-center font-bold text-3xl shadow-lg mb-6">
        <mat-icon class="text-4xl w-9 h-9">auto_awesome</mat-icon>
      </div>
      
      <h1 class="text-3xl font-bold mb-2">
         A<span class="text-orange-500">R</span><span class="text-yellow-500">I</span><span class="text-green-500">A</span> OS
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mb-8">{{ 'about.version' | translate }}</p>
      
      <p class="text-lg leading-relaxed max-w-xl mx-auto mb-6">
        {{ 'about.desc' | translate }}
      </p>

      <div class="bg-gray-50 dark:bg-[#1C1C1E] rounded-3xl p-6 max-w-xl mx-auto border border-gray-200 dark:border-gray-800 text-left mb-12">
        <h3 class="font-bold text-xl mb-3">{{ 'about.why' | translate }}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {{ 'about.whyDesc' | translate }}
        </p>
      </div>
      
      <div class="bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 max-w-sm mx-auto border border-gray-200 dark:border-gray-800">
        <p class="text-sm text-gray-500 mb-2">{{ 'about.footer' | translate }}</p>
        <p class="font-bold text-lg text-violet-600 dark:text-violet-400">Mmedia Universe</p>
      </div>
      
      <p class="text-xs text-gray-400 mt-12">
        &copy; 2026 Mmedia Universe
      </p>
    </div>
  `
})
export class AboutComponent {
  public location = inject(Location);
  public router = inject(Router);

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }
}
