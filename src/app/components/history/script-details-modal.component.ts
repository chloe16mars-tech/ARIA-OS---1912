import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ScriptData } from '../../services/script.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ScriptFormatPipe } from '../../pipes/script-format.pipe';

@Component({
  selector: 'app-script-details-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe, ScriptFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 bg-gray-950/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500" 
         (click)="close.emit()" 
         (keydown.escape)="close.emit()">
      
      <div class="bg-white dark:bg-[#0D0D0F] rounded-[3rem] shadow-2xl border border-white/5 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 delay-100" 
           (click)="$event.stopPropagation()">
        
        <!-- Header Section -->
        <div class="relative p-8 sm:p-10 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500"></div>
          
          <div class="flex justify-between items-start gap-6">
            <div class="space-y-4">
              <div class="flex flex-wrap gap-2">
                <span class="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Script Analysis</span>
                <span class="px-4 py-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-violet-500/20">{{ script.intention }}</span>
              </div>
              <h3 class="text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">{{ script.title || 'Sans titre' }}</h3>
              <div class="flex items-center gap-6 text-[11px] font-black uppercase tracking-widest text-gray-400">
                <span class="flex items-center gap-2"><mat-icon class="text-lg">record_voice_over</mat-icon> {{ script.tone }}</span>
                <span class="flex items-center gap-2"><mat-icon class="text-lg">timer</mat-icon> {{ script.duration }}</span>
              </div>
            </div>
            
            <button (click)="close.emit()" class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white flex items-center justify-center transition-all group">
              <mat-icon class="group-rotate-90 transition-transform">close</mat-icon>
            </button>
          </div>
        </div>

        <!-- Content Area -->
        <div class="p-8 sm:p-12 overflow-y-auto flex-1 prose prose-xl dark:prose-invert max-w-none scrollbar-hide">
          <div class="text-gray-700 dark:text-gray-300 leading-[1.8] font-medium selection:bg-violet-500/30 whitespace-pre-wrap" 
               [innerHTML]="script.content | scriptFormat">
          </div>
        </div>

        <!-- Footer / Actions -->
        <div class="p-8 sm:p-10 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex gap-4">
          <button (click)="goToStudio.emit()" 
                  class="flex-[2] py-5 rounded-[24px] font-black bg-violet-600 text-white text-xs uppercase tracking-[0.3em] shadow-2xl shadow-violet-500/40 hover:bg-violet-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            <mat-icon>videocam</mat-icon> {{ 'history.modal.studio' | translate }}
          </button>
          <button (click)="edit.emit()" 
                  class="flex-1 py-5 rounded-[24px] font-black bg-black dark:bg-white text-white dark:text-black text-xs uppercase tracking-[0.3em] hover:opacity-80 transition-all flex items-center justify-center gap-3">
            <mat-icon>edit</mat-icon> {{ 'common.edit' | translate }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ScriptDetailsModalComponent {
  @Input({ required: true }) script!: ScriptData;
  @Output() close = new EventEmitter<void>();
  @Output() goToStudio = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
}
