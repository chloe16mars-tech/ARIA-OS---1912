import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AriaNeonContainerComponent } from '../ui/aria-neon-container.component';

@Component({
  selector: 'app-source-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe, AriaNeonContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-6 sm:p-10 border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <!-- Gradient Aura -->
      <div class="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div class="space-y-8 relative z-10">
        <div class="space-y-2">
          <h2 class="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{{ 'home.source.title' | translate }}</h2>
          <p class="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{{ 'home.source.desc' | translate }}</p>
        </div>
        
        <!-- Tab Switcher -->
        <div class="flex p-1.5 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-100 dark:border-white/5 shadow-inner">
          @if (!isAnonymous) {
            <button (click)="type.set('url')" 
                    [class.bg-white]="type() === 'url'" 
                    [class.dark:bg-white/10]="type() === 'url'"
                    [class.text-violet-600]="type() === 'url'"
                    [class.dark:text-violet-400]="type() === 'url'"
                    [class.shadow-md]="type() === 'url'"
                    class="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300">
              {{ 'home.source.url' | translate }}
            </button>
          }
          <button (click)="type.set('text')" 
                  [class.bg-white]="type() === 'text'"
                  [class.dark:bg-white/10]="type() === 'text'"
                  [class.text-violet-600]="type() === 'text'"
                  [class.dark:text-violet-400]="type() === 'text'"
                  [class.shadow-md]="type() === 'text'"
                  class="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300">
            {{ 'home.source.rawText' | translate }}
          </button>
        </div>

        <!-- URL Input -->
        @if (type() === 'url') {
          <div class="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
            <app-aria-neon-container 
              containerClass="w-full bg-gray-100 dark:bg-white/5 rounded-3xl overflow-hidden" 
              innerClass="bg-white dark:bg-[#1C1C1E] flex items-center border border-gray-100 dark:border-white/5">
                 <div class="pl-5 flex items-center text-gray-400">
                    <mat-icon>link</mat-icon>
                 </div>
                 <input type="url" 
                        [(ngModel)]="url" 
                        (ngModelChange)="urlChange.emit($event)"
                        [placeholder]="'home.source.placeholderUrl' | translate" 
                        class="w-full pl-3 pr-6 py-5 bg-transparent focus:outline-none text-base font-bold text-gray-900 dark:text-white">
            </app-aria-neon-container>
            @if (error) {
              <div class="flex items-center gap-2 px-4 text-red-500 animate-bounce">
                <mat-icon class="text-sm">error_outline</mat-icon>
                <p class="text-xs font-bold uppercase tracking-tight">{{ error }}</p>
              </div>
            }
          </div>
        } 
        <!-- Text Input -->
        @else {
          <div class="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <app-aria-neon-container 
                containerClass="w-full bg-gray-100 dark:bg-white/5 rounded-3xl overflow-hidden"
                innerClass="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5">
                  <textarea [(ngModel)]="text" 
                            (ngModelChange)="textChange.emit($event)"
                            rows="6" 
                            [placeholder]="'home.source.placeholderText' | translate" 
                            class="w-full p-6 bg-transparent focus:outline-none resize-none text-base font-bold text-gray-900 dark:text-white leading-relaxed"></textarea>
            </app-aria-neon-container>
          </div>
        }

        <!-- Action Button -->
        <button (click)="onContinue()" 
                [disabled]="!canContinue()" 
                class="w-full py-5 rounded-[20px] bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 disabled:grayscale flex items-center justify-center gap-3 group">
          {{ 'home.actions.continue' | translate }}
          <mat-icon class="text-lg group-hover:translate-x-1 transition-transform">arrow_forward</mat-icon>
        </button>
      </div>
    </div>
  `
})
export class SourceInputComponent {
  @Input() url = '';
  @Input() text = '';
  @Input() error = '';
  @Input() isAnonymous = false;

  @Output() urlChange = new EventEmitter<string>();
  @Output() textChange = new EventEmitter<string>();
  @Output() continue = new EventEmitter<void>();

  type = signal<'url' | 'text'>('text');

  canContinue(): boolean {
    if (this.type() === 'url') return this.url.length > 5;
    return this.text.trim().length > 20;
  }

  onContinue() {
    if (this.canContinue()) this.continue.emit();
  }
}
