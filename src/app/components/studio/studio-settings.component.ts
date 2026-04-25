import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-studio-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" (click)="close.emit()"></div>
      
      <div class="relative w-full max-w-sm bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-[32px] border border-white/10 p-6 pointer-events-auto shadow-2xl animate-scale-up">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-xl font-black text-white tracking-tight">{{ 'studio.settings.title' | translate }}</h3>
          <button (click)="close.emit()" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="space-y-8">
          <!-- Font Size -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-white/50 text-xs font-black uppercase tracking-widest">{{ 'studio.settings.fontSize' | translate }}</span>
              <span class="text-white font-mono font-bold">{{ fontSize }}px</span>
            </div>
            <div class="flex items-center gap-4">
              <button (click)="changeFontSize.emit(-2)" class="flex-1 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95">
                <mat-icon>text_decrease</mat-icon>
              </button>
              <button (click)="changeFontSize.emit(2)" class="flex-1 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95">
                <mat-icon>text_increase</mat-icon>
              </button>
            </div>
          </div>

          <!-- Scroll Speed -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-white/50 text-xs font-black uppercase tracking-widest">{{ 'studio.settings.speed' | translate }}</span>
              <span class="text-white font-mono font-bold">x{{ scrollingSpeed }}</span>
            </div>
            <div class="flex items-center gap-4">
              <button (click)="changeSpeed.emit(-0.5)" class="flex-1 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95">
                <mat-icon>remove</mat-icon>
              </button>
              <button (click)="changeSpeed.emit(0.5)" class="flex-1 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95">
                <mat-icon>add</mat-icon>
              </button>
            </div>
          </div>

          <!-- Mask Opacity -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-white/50 text-xs font-black uppercase tracking-widest">{{ 'studio.settings.mask' | translate }}</span>
              <span class="text-white font-mono font-bold">{{ (maskOpacity * 100).toFixed(0) }}%</span>
            </div>
            <div class="flex items-center gap-4">
              <button (click)="changeMask.emit(-0.1)" class="flex-1 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95">
                <mat-icon>brightness_low</mat-icon>
              </button>
              <button (click)="changeMask.emit(0.1)" class="flex-1 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95">
                <mat-icon>brightness_high</mat-icon>
              </button>
            </div>
          </div>

          <!-- Text Options -->
          <button (click)="toggleShadow.emit()" 
                  class="w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all font-bold text-sm"
                  [class.bg-white]="textShadow" [class.text-black]="textShadow"
                  [class.bg-white/5]="!textShadow" [class.text-white]="!textShadow">
            <mat-icon>{{ textShadow ? 'format_color_text' : 'format_color_reset' }}</mat-icon>
            {{ 'studio.settings.shadow' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes scale-up { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
  `]
})
export class StudioSettingsComponent {
  @Input() fontSize = 28;
  @Input() scrollingSpeed = 1;
  @Input() maskOpacity = 0.5;
  @Input() textShadow = true;

  @Output() changeFontSize = new EventEmitter<number>();
  @Output() changeSpeed = new EventEmitter<number>();
  @Output() changeMask = new EventEmitter<number>();
  @Output() toggleShadow = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
}
