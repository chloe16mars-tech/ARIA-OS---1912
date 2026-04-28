import { Component, signal, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AppConfigService } from '../../services/app-config.service';

@Component({
  selector: 'app-ad-carousel',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ads().length > 0) {
      <div class="w-full rounded-3xl overflow-hidden relative aspect-[21/9] sm:aspect-[3/1] shadow-sm border border-gray-200 dark:border-gray-800 bg-[#0A0A0C] group">
        <!-- Slider Track -->
        <div class="flex w-full h-full transition-transform duration-[2000ms] ease-in-out"
             [style.transform]="'translateX(-' + (currentAdIndex() * 100) + '%)'">
          @for (ad of ads(); track ad.id) {
            <a [href]="ad.link_url" target="_blank" class="min-w-full h-full relative block overflow-hidden">
              <img [src]="ad.image_url" [alt]="ad.title_key" class="absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-105" referrerpolicy="no-referrer">
              <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
              <div class="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent"></div>
              <div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 w-full md:w-[80%] lg:w-[60%]">
                <div class="flex items-center gap-2 mb-3">
                  <span class="inline-block px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white bg-white/10 backdrop-blur-md rounded-md border border-white/20 shadow-sm">{{ ad.badge_key | translate }}</span>
                </div>
                <h3 class="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-md">{{ ad.title_key | translate }}</h3>
                <p class="text-gray-300 text-sm sm:text-base font-medium line-clamp-2 drop-shadow-sm">{{ ad.description_key | translate }}</p>
              </div>
            </a>
          }
        </div>

        <!-- Controls -->
        <div class="absolute bottom-4 sm:bottom-6 right-6 flex items-center gap-2 z-20">
           @for (ad of ads(); track ad.id; let i = $index) {
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
    }
  `
})
export class AdCarouselComponent implements OnInit, OnDestroy {
  private appConfigService = inject(AppConfigService);
  ads = this.appConfigService.ads;

  currentAdIndex = signal(0);
  private adInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.startAdRotation();
  }

  ngOnDestroy() {
    this.stopAdRotation();
  }

  startAdRotation() {
    if (typeof window !== 'undefined') {
      this.adInterval = setInterval(() => {
        const len = this.ads().length;
        if (len > 0) {
          this.currentAdIndex.update(i => (i + 1) % len);
        }
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
