import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-script-config',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      <!-- Section 1: Intention -->
      <div class="space-y-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center border border-violet-500/20">
            <mat-icon>psychology</mat-icon>
          </div>
          <div>
            <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ 'home.config.q1' | translate }}</h3>
            <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">{{ 'home.config.desc_intention' | translate }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          @for (intent of intentions; track intent.key) {
            <button (click)="selectIntention(intent.key)" 
                    [disabled]="isAnonymous && intent.key !== 'home.intentions.sum'"
                    class="relative p-5 rounded-[24px] text-left transition-all duration-300 border flex flex-col gap-2 group overflow-hidden"
                    [class.bg-black]="selectedIntention === intent.key" 
                    [class.dark:bg-white]="selectedIntention === intent.key" 
                    [class.text-white]="selectedIntention === intent.key" 
                    [class.dark:text-black]="selectedIntention === intent.key"
                    [class.border-transparent]="selectedIntention === intent.key"
                    [class.bg-white]="selectedIntention !== intent.key" 
                    [class.dark:bg-[#1C1C1E]]="selectedIntention !== intent.key" 
                    [class.text-gray-700]="selectedIntention !== intent.key" 
                    [class.dark:text-gray-400]="selectedIntention !== intent.key" 
                    [class.border-gray-100]="selectedIntention !== intent.key" 
                    [class.dark:border-white/5]="selectedIntention !== intent.key"
                    [class.opacity-40]="isAnonymous && intent.key !== 'home.intentions.sum'">
              
              <div class="flex justify-between items-center">
                <span class="text-xs font-black uppercase tracking-widest">{{ intent.key | translate }}</span>
                @if (selectedIntention === intent.key) {
                  <mat-icon class="text-lg">check_circle</mat-icon>
                } @else if (isAnonymous && intent.key !== 'home.intentions.sum') {
                  <mat-icon class="text-sm opacity-50">lock</mat-icon>
                }
              </div>

              <!-- Selection Glow -->
              @if (selectedIntention === intent.key) {
                <div class="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-50"></div>
              }
            </button>
          }
        </div>
      </div>

      <!-- Section 2: Tone & Stance (Reveal after intention) -->
      @if (selectedIntention || isAnonymous) {
        <div class="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <!-- Tone -->
          <div class="space-y-6">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                <mat-icon>record_voice_over</mat-icon>
              </div>
              <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ 'home.config.q2' | translate }}</h3>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              @for (t of tones; track t.key) {
                <button (click)="selectTone(t.key)" 
                        [disabled]="isAnonymous && t.key !== 'home.tones.fact'"
                        class="p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all"
                        [class.bg-black]="selectedTone === t.key" [class.dark:bg-white]="selectedTone === t.key" [class.text-white]="selectedTone === t.key" [class.dark:text-black]="selectedTone === t.key"
                        [class.bg-white]="selectedTone !== t.key" [class.dark:bg-[#1C1C1E]]="selectedTone !== t.key" [class.text-gray-500]="selectedTone !== t.key" [class.border-gray-100]="selectedTone !== t.key" [class.dark:border-white/5]="selectedTone !== t.key"
                        [class.opacity-40]="isAnonymous && t.key !== 'home.tones.fact'">
                  {{ t.key | translate }}
                </button>
              }
            </div>
          </div>

          <!-- Duration -->
          <div class="space-y-6">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
                <mat-icon>timer</mat-icon>
              </div>
              <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ 'home.config.q4' | translate }}</h3>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              @for (d of durations; track d.key) {
                <button (click)="selectDuration(d.key)" 
                        class="p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all"
                        [class.bg-black]="selectedDuration === d.key" [class.dark:bg-white]="selectedDuration === d.key" [class.text-white]="selectedDuration === d.key" [class.dark:text-black]="selectedDuration === d.key"
                        [class.bg-white]="selectedDuration !== d.key" [class.dark:bg-[#1C1C1E]]="selectedDuration !== d.key" [class.text-gray-500]="selectedDuration !== d.key" [class.border-gray-100]="selectedDuration !== d.key" [class.dark:border-white/5]="selectedDuration !== d.key">
                  {{ d.key | translate }}
                </button>
              }
            </div>
          </div>

          <!-- Submit Button -->
          <button (click)="generate.emit()" 
                  class="w-full py-6 rounded-[28px] bg-violet-600 text-white font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-violet-500/40 hover:bg-violet-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group overflow-hidden relative">
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <mat-icon>auto_awesome</mat-icon>
            {{ 'home.actions.generate' | translate }}
          </button>
        </div>
      }
    </div>
  `
})
export class ScriptConfigComponent {
  @Input() intentions: { key: string; val: string }[] = [];
  @Input() tones: { key: string; val: string }[] = [];
  @Input() stances: { key: string; val: string }[] = [];
  @Input() durations: { key: string; val: string }[] = [];
  
  @Input() selectedIntention: string | null = null;
  @Input() selectedTone: string | null = null;
  @Input() selectedStance: string | null = null;
  @Input() selectedDuration: string | null = null;
  @Input() isAnonymous = false;

  @Output() intentionChange = new EventEmitter<string>();
  @Output() toneChange = new EventEmitter<string>();
  @Output() stanceChange = new EventEmitter<string>();
  @Output() durationChange = new EventEmitter<string>();
  @Output() generate = new EventEmitter<void>();

  selectIntention(key: string) {
    if (this.isAnonymous && key !== 'home.intentions.sum') return;
    this.intentionChange.emit(key);
  }

  selectTone(key: string) {
    if (this.isAnonymous && key !== 'home.tones.fact') return;
    this.toneChange.emit(key);
  }

  selectDuration(key: string) {
    this.durationChange.emit(key);
  }
}
