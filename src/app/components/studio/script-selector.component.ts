import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ScriptData } from '../../services/script.service';

@Component({
  selector: 'app-script-selector',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" (click)="close.emit()"></div>
      
      <!-- Modal Content -->
      <div class="relative w-full max-w-lg bg-[#1C1C1E] rounded-t-[32px] sm:rounded-[32px] border border-white/10 shadow-2xl flex flex-col max-h-[85vh] animate-slide-up">
        
        <!-- Header -->
        <div class="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 class="text-xl font-black text-white tracking-tight">{{ 'studio.actions.selectScript' | translate }}</h3>
          <button (click)="close.emit()" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Scripts List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          @if (isLoading) {
            <div class="flex flex-col items-center justify-center py-20 gap-4">
              <div class="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
              <p class="text-white/40 text-sm font-medium">{{ 'common.loading' | translate }}</p>
            </div>
          } @else if (scripts.length === 0) {
            <div class="flex flex-col items-center justify-center py-20 text-center px-10">
              <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/20">
                <mat-icon class="text-4xl">description</mat-icon>
              </div>
              <p class="text-white/60 font-bold mb-1">{{ 'studio.scripts.empty' | translate }}</p>
              <p class="text-white/30 text-xs">{{ 'studio.scripts.emptyHint' | translate }}</p>
            </div>
          } @else {
            @for (script of scripts; track script.id) {
              <button (click)="select.emit(script)" 
                      class="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left group active:scale-[0.98]">
                <div class="flex justify-between items-start mb-2">
                  <span class="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-[10px] font-black uppercase tracking-wider border border-violet-500/30">{{ script.sourceType }}</span>
                  <span class="text-white/20 text-[10px] font-mono">{{ script.createdAt | date:'short' }}</span>
                </div>
                <h4 class="text-white font-bold text-sm mb-1 line-clamp-1 group-hover:text-violet-300 transition-colors">{{ script.title || script.intention }}</h4>
                <p class="text-white/40 text-xs line-clamp-2 leading-relaxed">{{ getPreview(script) }}</p>
              </button>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
    .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  `]
})
export class ScriptSelectorComponent {
  @Input() scripts: ScriptData[] = [];
  @Input() isLoading = false;

  @Output() select = new EventEmitter<ScriptData>();
  @Output() close = new EventEmitter<void>();

  getPreview(script: ScriptData): string {
    const text = script.content.replace(/<[^>]*>/g, ''); // Simple tag strip
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
  }
}
