import { Component, signal, inject, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-ad-carousel',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full rounded-3xl overflow-hidden relative aspect-[21/9] sm:aspect-[3/1] shadow-sm border border-gray-200 dark:border-gray-800 bg-[#0A0A0C] group">
      <!-- Slider Track -->
      <div class="flex w-full h-full transition-transform duration-[2000ms] ease-in-out"
           [style.transform]="'translateX(-' + (currentAdIndex() * 100) + '%)'">
        @for (ad of ads; track ad.title) {
          <a [href]="ad.link" target="_blank" class="min-w-full h-full relative block overflow-hidden">
            <img [src]="ad.image" [alt]="ad.title" class="absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-105" referrerpolicy="no-referrer">
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent"></div>
            <div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 w-full md:w-[80%] lg:w-[60%]">
              <div class="flex items-center gap-2 mb-3">
                <span class="inline-block px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white bg-white/10 backdrop-blur-md rounded-md border border-white/20 shadow-sm">{{ ad.badge | translate }}</span>
              </div>
              <h3 class="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-md">{{ ad.title | translate }}</h3>
              <p class="text-gray-300 text-sm sm:text-base font-medium line-clamp-2 drop-shadow-sm">{{ ad.description | translate }}</p>
            </div>
          </a>
        }
      </div>

      <!-- Controls -->
      <div class="absolute bottom-4 sm:bottom-6 right-6 flex items-center gap-2 z-20">
         @for (ad of ads; track ad.title; let i = $index) {
            <button (click)="setAdIndex(i); $event.preventDefault();"
                    class="h-1.5 rounded-full transition-all duration-500 overflow-hidden relative"
                    [class.w-8]="currentAdIndex() === i"
                    [class.w-2]="currentAdIndex() !== i"
                    [class.bg-white]="currentAdIndex() === i"
                    [class.bg-white/40]="currentAdIndex() !== i"
                    [class.hover:bg-white/70]="currentAdIndex() !== i">
            </button>
         }
      </div>
    </div>
  `
})
export class AdCarouselComponent implements OnInit, OnDestroy {
  ads = [
    {
      image: 'https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=1200&auto=format&fit=crop',
      badge: 'home.ad1.badge',
      title: 'home.ad1.title',
      description: 'home.ad1.desc',
      link: '#'
    },
    {
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200&auto=format&fit=crop',
      badge: 'home.ad2.badge',
      title: 'home.ad2.title',
      description: 'home.ad2.desc',
      link: '#'
    },
    {
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
      badge: 'home.ad3.badge',
      title: 'home.ad3.title',
      description: 'home.ad3.desc',
      link: '#'
    }
  ];

  currentAdIndex = signal(0);
  private adInterval: any;

  ngOnInit() {
    this.startAdRotation();
  }

  ngOnDestroy() {
    this.stopAdRotation();
  }

  startAdRotation() {
    if (typeof window !== 'undefined') {
      this.adInterval = setInterval(() => {
        this.currentAdIndex.update(i => (i + 1) % this.ads.length);
      }, 5000);
    }
  }

  stopAdRotation() {
    if (this.adInterval) {
      clearInterval(this.adInterval);
    }
  }

  setAdIndex(index: number) {
    this.currentAdIndex.set(index);
    this.stopAdRotation();
    this.startAdRotation();
  }
}
