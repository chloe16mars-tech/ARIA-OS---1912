import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppConfigService } from '../../services/app-config.service';

@Component({
  selector: 'app-special-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (configService.specialPopupVisible() && configService.config()?.special_popup; as popup) {
      <div class="fixed inset-0 z-[999] flex items-center justify-center p-6 animate-in fade-in duration-500">
        <!-- Overlay -->
        <div 
          class="absolute inset-0 bg-black/60 backdrop-blur-md"
          [style.opacity]="popup.overlay_opacity"
          (click)="configService.closeSpecialPopup()"
        ></div>

        <!-- Content -->
        <div 
          [style.background-color]="popup.bg_color"
          class="relative w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 text-white"
        >
          @if (popup.image_url) {
            <div class="h-48 overflow-hidden">
              <img [src]="popup.image_url" class="w-full h-full object-cover" alt="">
            </div>
          }

          <div class="p-10 text-center space-y-6">
            <h2 class="text-3xl font-black tracking-tight leading-tight">
              {{ popup.title }}
            </h2>
            <p class="text-white/80 leading-relaxed">
              {{ popup.text }}
            </p>

            <div class="pt-4 flex flex-col gap-4">
              <a 
                [href]="popup.button_link" 
                target="_blank"
                class="bg-white text-black py-4 px-8 rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl"
                (click)="configService.closeSpecialPopup()"
              >
                {{ popup.button_text }}
              </a>
              <button 
                (click)="configService.closeSpecialPopup()"
                class="text-white/60 hover:text-white transition-colors text-sm font-medium"
              >
                Fermer
              </button>
            </div>
          </div>

          <!-- Close button -->
          <button 
            (click)="configService.closeSpecialPopup()"
            class="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-all border border-white/20"
          >
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class SpecialPopupComponent {
  public configService = inject(AppConfigService);
}
