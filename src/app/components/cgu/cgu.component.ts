import { Component, inject, signal, input, output } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-cgu',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  template: `
    <div class="flex flex-col w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8"
         [style.height]="isPopup() ? '100%' : 'calc(100dvh - 13rem)'">
      <div class="shrink-0 flex items-center gap-4 mb-6">
        <button (click)="goBack()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white">
          <mat-icon>{{ isPopup() ? 'close' : 'arrow_back' }}</mat-icon>
        </button>
        <h2 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{{ 'legal.title' | translate }}</h2>
      </div>

      <!-- Tabs -->
      <div class="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-[#1C1C1E] rounded-2xl mb-8">
        <button (click)="activeTab.set('cgu')" 
                class="flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-medium leading-tight sm:leading-normal"
                [class.bg-white]="activeTab() === 'cgu'"
                [class.dark:bg-[#2C2C2E]]="activeTab() === 'cgu'"
                [class.shadow-sm]="activeTab() === 'cgu'"
                [class.text-gray-900]="activeTab() === 'cgu'"
                [class.dark:text-white]="activeTab() === 'cgu'"
                [class.text-gray-500]="activeTab() !== 'cgu'">
          {{ 'legal.tabs.cgu' | translate }}
        </button>
        <button (click)="activeTab.set('legal')" 
                class="flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-medium leading-tight sm:leading-normal"
                [class.bg-white]="activeTab() === 'legal'"
                [class.dark:bg-[#2C2C2E]]="activeTab() === 'legal'"
                [class.shadow-sm]="activeTab() === 'legal'"
                [class.text-gray-900]="activeTab() === 'legal'"
                [class.dark:text-white]="activeTab() === 'legal'"
                [class.text-gray-500]="activeTab() !== 'legal'">
          {{ 'legal.tabs.mentions' | translate }}
        </button>
        <button (click)="activeTab.set('privacy')" 
                class="flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-medium leading-tight sm:leading-normal"
                [class.bg-white]="activeTab() === 'privacy'"
                [class.dark:bg-[#2C2C2E]]="activeTab() === 'privacy'"
                [class.shadow-sm]="activeTab() === 'privacy'"
                [class.text-gray-900]="activeTab() === 'privacy'"
                [class.dark:text-white]="activeTab() === 'privacy'"
                [class.text-gray-500]="activeTab() !== 'privacy'">
          {{ 'legal.tabs.privacy' | translate }}
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto prose dark:prose-invert max-w-none text-sm leading-relaxed text-gray-700 dark:text-gray-300 space-y-6 bg-white dark:bg-[#111] p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm relative">
        
        @if (activeTab() === 'cgu') {
          <div [innerHTML]="'legal.cgu.text' | translate"></div>
        }

        @if (activeTab() === 'legal') {
          <div [innerHTML]="'legal.mentions.text' | translate"></div>
        }

        @if (activeTab() === 'privacy') {
          <div [innerHTML]="'legal.privacy.text' | translate"></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class CguComponent {
  public location = inject(Location);
  public router = inject(Router);
  public activeTab = signal<'cgu' | 'legal' | 'privacy'>('cgu');
  
  isPopup = input<boolean>(false);
  closePopup = output<void>();

  goBack() {
    if (this.isPopup()) {
      this.closePopup.emit();
    } else if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }
}
