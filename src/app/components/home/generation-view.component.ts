import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ScriptFormatPipe } from '../../pipes/script-format.pipe';
import { AriaNeonContainerComponent } from '../ui/aria-neon-container.component';

@Component({
  selector: 'app-generation-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe, ScriptFormatPipe, AriaNeonContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-in fade-in duration-1000">
      
      <!-- Generation Header / Loading State -->
      <div class="relative bg-black dark:bg-white rounded-[3rem] p-10 overflow-hidden shadow-2xl">
        <!-- Animated Background Rings -->
        @if (isGenerating) {
          <div class="absolute inset-0 flex items-center justify-center opacity-20">
            <div class="aria-ring-1 w-[400px] h-[400px] border-[1px] border-white dark:border-black rounded-full"></div>
            <div class="aria-ring-2 absolute w-[300px] h-[300px] border-[1px] border-white dark:border-black rounded-full opacity-50"></div>
          </div>
        }

        <div class="relative z-10 flex flex-col items-center text-center gap-6">
          <div class="w-20 h-20 rounded-3xl bg-white/10 dark:bg-black/5 backdrop-blur-xl flex items-center justify-center text-white dark:text-black border border-white/20 dark:border-black/10">
            <mat-icon class="text-4xl animate-pulse">auto_awesome</mat-icon>
          </div>
          
          <div class="space-y-2">
            <h2 class="text-2xl font-black tracking-tighter text-white dark:text-black uppercase">
              {{ isGenerating ? ('home.loading.title' | translate) : ('home.result.title' | translate) }}
            </h2>
            <div class="flex items-center justify-center gap-1">
              @if (isGenerating) {
                <div class="flex gap-1.5">
                  <div class="aria-dot-1 w-1.5 h-1.5 rounded-full bg-violet-400"></div>
                  <div class="aria-dot-2 w-1.5 h-1.5 rounded-full bg-violet-400"></div>
                  <div class="aria-dot-3 w-1.5 h-1.5 rounded-full bg-violet-400"></div>
                </div>
                <span class="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 dark:text-black/40 ml-2">ARIA Intelligence</span>
              } @else {
                 <span class="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">Génération terminée</span>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Result Content -->
      @if (scriptContent) {
        <div class="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <app-aria-neon-container 
              containerClass="w-full bg-gray-100 dark:bg-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl"
              innerClass="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5 p-8 md:p-12">
            
            <div class="prose prose-invert max-w-none">
              <div class="text-gray-800 dark:text-gray-200 leading-relaxed font-medium whitespace-pre-wrap selection:bg-violet-500/30"
                   [innerHTML]="scriptContent | scriptFormat">
              </div>
            </div>

            <!-- Result Actions -->
            @if (!isGenerating) {
              <div class="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row gap-4">
                <button (click)="goToStudio.emit()" 
                        class="flex-1 py-5 rounded-2xl bg-violet-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-violet-500/20 hover:bg-violet-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <mat-icon>videocam</mat-icon>
                  {{ 'home.result.openStudio' | translate }}
                </button>
                <button (click)="reset.emit()" 
                        class="px-8 py-5 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
                  {{ 'home.result.new' | translate }}
                </button>
              </div>
            }
          </app-aria-neon-container>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes aria-spin-1 { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes aria-spin-2 { 0% { transform: rotate(0deg); } 100% { transform: rotate(-360deg); } }
    .aria-ring-1 { animation: aria-spin-1 10s linear infinite; }
    .aria-ring-2 { animation: aria-spin-2 15s linear infinite; }
    @keyframes aria-type { 
      0%, 100% { transform: scale(1); opacity: 0.3; } 
      50% { transform: scale(1.5); opacity: 1; filter: drop-shadow(0 0 4px currentColor); } 
    }
    .aria-dot-1 { animation: aria-type 1.2s infinite 0s; }
    .aria-dot-2 { animation: aria-type 1.2s infinite 0.2s; }
    .aria-dot-3 { animation: aria-type 1.2s infinite 0.4s; }
  `]
})
export class GenerationViewComponent {
  @Input() isGenerating = false;
  @Input() scriptContent = '';

  @Output() goToStudio = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
}
