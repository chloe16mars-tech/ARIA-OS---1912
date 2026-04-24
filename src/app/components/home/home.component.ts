import { Component, signal, computed, OnInit, OnDestroy, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GeminiService } from '../../services/gemini.service';
import { ScriptService, ScriptData } from '../../services/script.service';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ScriptFormatPipe } from '../../pipes/script-format.pipe';
import { SourceViewerComponent } from '../source-viewer/source-viewer.component';
import { ToastService } from '../../services/toast.service';
import { AriaNeonContainerComponent } from '../ui/aria-neon-container.component';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule, CommonModule, ScriptFormatPipe, SourceViewerComponent, AriaNeonContainerComponent, TranslatePipe],
  styles: [`
    @keyframes aria-spin-1 {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes aria-spin-2 {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(-360deg); }
    }
    @keyframes aria-breathe {
      0%, 100% { transform: scale(1); opacity: 0.8; filter: drop-shadow(0 0 2px currentColor); }
      50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 10px currentColor); }
    }
    .aria-breathe-anim {
       animation: aria-breathe 2s ease-in-out infinite alternate;
    }
    .aria-ring-1 {
      animation: aria-spin-1 3s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite, aria-breathe 2s ease-in-out infinite;
    }
    .aria-ring-2 {
      animation: aria-spin-2 4s cubic-bezier(0.65, 0, 0.35, 1) infinite, aria-breathe 2.5s ease-in-out infinite 0.5s;
    }
    @keyframes slideDownFade {
      from { opacity: 0; transform: translateY(-15px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .aria-reveal {
      animation: slideDownFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes aria-type {
      0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
      50% { transform: translateY(-4px) scale(1.2); opacity: 1; filter: drop-shadow(0 0 6px currentColor); }
    }
    .aria-dot-1 { animation: aria-type 1.2s infinite 0s; }
    .aria-dot-2 { animation: aria-type 1.2s infinite 0.2s; }
    .aria-dot-3 { animation: aria-type 1.2s infinite 0.4s; }
    @keyframes aria-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
  template: `
    <div class="p-4 max-w-3xl mx-auto space-y-8 pb-24">
      
      <!-- Ad Carousel: Animated Horizontal Slider -->
      <div class="w-full rounded-3xl overflow-hidden relative aspect-[21/9] sm:aspect-[3/1] shadow-sm border border-gray-200 dark:border-gray-800 bg-[#0A0A0C] group">
        <!-- Slider Track -->
        <div class="flex w-full h-full transition-transform duration-[2000ms] ease-in-out"
             [style.transform]="'translateX(-' + (currentAdIndex() * 100) + '%)'">
          @for (ad of ads; track ad.title) {
            <a [href]="ad.link" target="_blank" class="min-w-full h-full relative block overflow-hidden">
              <!-- Image with slow zoom effect -->
              <img [src]="ad.image" [alt]="ad.title" class="absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-105" referrerpolicy="no-referrer">
              
              <!-- Gradients for text readability -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
              <div class="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent"></div>
              
              <!-- Content -->
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
                      [class.hover:bg-white/70]="currentAdIndex() !== i"
                      [attr.aria-label]="('home.ad.goToSlide' | translate) + ' ' + (i + 1)">
              </button>
           }
        </div>
      </div>

      <!-- Steps Indicator -->
      <div class="flex justify-center gap-16 items-center px-4 py-8 relative">
        @for (step of steps; track step.id) {
          <div class="flex flex-col items-center gap-3 relative z-10 w-24">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shadow-sm"
                 [class.bg-black]="currentStep() >= step.id"
                 [class.dark:bg-white]="currentStep() >= step.id"
                 [class.text-white]="currentStep() >= step.id"
                 [class.dark:text-black]="currentStep() >= step.id"
                 [class.ring-4]="currentStep() === step.id"
                 [class.ring-gray-200]="currentStep() === step.id"
                 [class.dark:ring-gray-800]="currentStep() === step.id"
                 [class.bg-white]="currentStep() < step.id"
                 [class.dark:bg-[#1C1C1E]]="currentStep() < step.id"
                 [class.border]="currentStep() < step.id"
                 [class.border-gray-200]="currentStep() < step.id"
                 [class.dark:border-gray-800]="currentStep() < step.id"
                 [class.text-gray-400]="currentStep() < step.id">
              {{ step.id }}
            </div>
            <span class="text-xs font-medium tracking-wide"
                  [class.text-gray-900]="currentStep() >= step.id"
                  [class.dark:text-white]="currentStep() >= step.id"
                  [class.text-gray-400]="currentStep() < step.id">
              {{ step.label | translate }}
            </span>
          </div>
        }
      </div>

      <!-- Step 1: Charger -->
      @if (currentStep() === 1) {
        <div class="relative bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <!-- Decorative Background element -->
          <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          <div class="space-y-6 relative z-10">
            <div class="space-y-2">
              <h2 class="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{{ 'home.source.title' | translate }}</h2>
              <p class="text-base font-medium text-gray-500 dark:text-gray-400">{{ 'home.source.desc' | translate }}</p>
            </div>
            
            <div class="flex gap-2 p-1.5 bg-gray-50 dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800">
              @if (!is_anonymous()) {
                <button (click)="inputType.set('url')" [class.bg-white]="inputType() === 'url'" [class.shadow-sm]="inputType() === 'url'" [class.text-orange-600]="inputType() === 'url'" [class.dark:text-orange-400]="inputType() === 'url'" [class.dark:bg-[#1C1C1E]]="inputType() === 'url'" [class.text-gray-500]="inputType() !== 'url'" class="flex-1 py-3 rounded-xl text-sm font-bold tracking-wide transition-all">{{ 'home.source.url' | translate }}</button>
              }
              <button (click)="inputType.set('text')" [class.bg-white]="inputType() === 'text'" [class.shadow-sm]="inputType() === 'text'" [class.text-orange-600]="inputType() === 'text'" [class.dark:text-orange-400]="inputType() === 'text'" [class.dark:bg-[#1C1C1E]]="inputType() === 'text'" [class.text-gray-500]="inputType() !== 'text'" class="flex-1 py-3 rounded-xl text-sm font-bold tracking-wide transition-all">{{ 'home.source.rawText' | translate }}</button>
            </div>

            @if (inputType() === 'url') {
              <div class="space-y-4">
                <app-aria-neon-container 
                  containerClass="shadow-sm w-full bg-gray-200 dark:bg-gray-700/50 overflow-hidden" 
                  innerClass="bg-white dark:bg-[#1C1C1E] flex items-center border-[0.5px] border-white/20 dark:border-black/50 overflow-hidden">
                     <div class="pl-4 flex items-center pointer-events-none">
                        <mat-icon class="text-gray-400">link</mat-icon>
                     </div>
                     <input type="url" [(ngModel)]="sourceUrl" [placeholder]="'home.source.placeholderUrl' | translate" class="w-full pl-3 pr-4 py-4 bg-transparent focus:outline-none text-lg placeholder:text-gray-400 transition-all font-medium text-gray-900 dark:text-gray-100 rounded-none rounded-r-[14px]">
                </app-aria-neon-container>
                @if (urlError()) {
                  <p class="text-sm text-red-500 font-medium px-2">{{ urlError() }}</p>
                }
              </div>
            } @else {
              <div class="space-y-4">
                <app-aria-neon-container 
                    containerClass="shadow-sm w-full bg-gray-200 dark:bg-gray-700/50 overflow-hidden"
                    innerClass="bg-white dark:bg-[#1C1C1E] border-[0.5px] border-white/20 dark:border-black/50 overflow-hidden">
                      <textarea [(ngModel)]="sourceText" rows="6" [placeholder]="'home.source.placeholderText' | translate" class="w-full p-5 bg-transparent focus:outline-none resize-none text-lg placeholder:text-gray-400 transition-all font-medium text-gray-900 dark:text-gray-100 rounded-[14px]"></textarea>
                </app-aria-neon-container>
              </div>
            }

            <div class="pt-4">
              <button (click)="nextStep()" [disabled]="!canProceedToConfig()" class="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-lg disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all">
                {{ 'home.actions.continue' | translate }} <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Step 2: Configurer -->
      @if (currentStep() === 2) {
        <div class="space-y-10">
          <div class="space-y-1 mb-8">
            <h2 class="text-2xl font-semibold tracking-tight">{{ 'home.config.title' | translate }}</h2>
            <p class="text-base text-gray-500 dark:text-gray-400">{{ 'home.config.desc' | translate }}</p>
          </div>
          
          <div class="space-y-3">
            <div class="flex gap-4 items-center">
                <div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <mat-icon>track_changes</mat-icon>
                </div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white tracking-wide">{{ 'home.config.q1' | translate }}</h3>
            </div>
            <div class="grid grid-cols-2 gap-3 pl-14">
              @for (intent of intentions; track intent.key) {
                <button (click)="selectedIntentionKey.set(intent.key)" 
                        [disabled]="is_anonymous() && intent.key !== 'home.intentions.sum'"
                        [class.opacity-50]="is_anonymous() && intent.key !== 'home.intentions.sum'"
                        [class.cursor-not-allowed]="is_anonymous() && intent.key !== 'home.intentions.sum'"
                        [class.bg-black]="selectedIntentionKey() === intent.key" [class.dark:bg-white]="selectedIntentionKey() === intent.key" [class.text-white]="selectedIntentionKey() === intent.key" [class.dark:text-black]="selectedIntentionKey() === intent.key" [class.border-black]="selectedIntentionKey() === intent.key" [class.dark:border-white]="selectedIntentionKey() === intent.key" [class.ring-2]="selectedIntentionKey() === intent.key" [class.ring-black/10]="selectedIntentionKey() === intent.key" [class.dark:ring-white/10]="selectedIntentionKey() === intent.key"
                        [class.bg-white]="selectedIntentionKey() !== intent.key" [class.dark:bg-[#1C1C1E]]="selectedIntentionKey() !== intent.key" [class.text-gray-700]="selectedIntentionKey() !== intent.key" [class.dark:text-gray-300]="selectedIntentionKey() !== intent.key" [class.border-gray-200]="selectedIntentionKey() !== intent.key" [class.dark:border-gray-800]="selectedIntentionKey() !== intent.key"
                        class="p-4 rounded-2xl text-sm font-medium border shadow-sm hover:border-gray-300 dark:hover:border-gray-600 text-left flex justify-between items-center transition-all">
                  {{ intent.key | translate }}
                  @if (selectedIntentionKey() === intent.key) {
                     <mat-icon class="text-[18px]">check_circle</mat-icon>
                  } @else if (is_anonymous() && intent.key !== 'home.intentions.sum') {
                    <mat-icon class="text-[16px] text-gray-400">lock</mat-icon>
                  }
                </button>
              }
            </div>
          </div>

          @if (selectedIntention() !== null || is_anonymous()) {
            <div class="space-y-3 aria-reveal border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
              <div class="flex gap-4 items-center">
                  <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <mat-icon>record_voice_over</mat-icon>
                  </div>
                  <h3 class="text-base font-bold text-gray-900 dark:text-white tracking-wide">{{ 'home.config.q2' | translate }}</h3>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pl-14">
                @for (t of tones; track t.key) {
                  <button (click)="selectedToneKey.set(t.key)" 
                          [disabled]="is_anonymous() && t.key !== 'home.tones.fact'"
                          [class.opacity-50]="is_anonymous() && t.key !== 'home.tones.fact'"
                          [class.cursor-not-allowed]="is_anonymous() && t.key !== 'home.tones.fact'"
                          [class.bg-black]="selectedToneKey() === t.key" [class.dark:bg-white]="selectedToneKey() === t.key" [class.text-white]="selectedToneKey() === t.key" [class.dark:text-black]="selectedToneKey() === t.key" [class.border-black]="selectedToneKey() === t.key" [class.dark:border-white]="selectedToneKey() === t.key" [class.ring-2]="selectedToneKey() === t.key" [class.ring-black/10]="selectedToneKey() === t.key" [class.dark:ring-white/10]="selectedToneKey() === t.key"
                          [class.bg-white]="selectedToneKey() !== t.key" [class.dark:bg-[#1C1C1E]]="selectedToneKey() !== t.key" [class.text-gray-700]="selectedToneKey() !== t.key" [class.dark:text-gray-300]="selectedToneKey() !== t.key" [class.border-gray-200]="selectedToneKey() !== t.key" [class.dark:border-gray-800]="selectedToneKey() !== t.key"
                          class="p-3 rounded-2xl text-sm font-medium border shadow-sm hover:border-gray-300 dark:hover:border-gray-600 flex justify-between items-center transition-all">
                    {{ t.key | translate }}
                    @if (selectedToneKey() === t.key) {
                       <mat-icon class="text-[18px]">check_circle</mat-icon>
                    } @else if (is_anonymous() && t.key !== 'home.tones.fact') {
                      <mat-icon class="text-[14px] text-gray-400">lock</mat-icon>
                    }
                  </button>
                }
              </div>
            </div>
          }

          @if (selectedTone() !== null || is_anonymous()) {
            <div class="space-y-3 aria-reveal border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
              <div class="flex gap-4 items-center">
                  <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                      <mat-icon>balance</mat-icon>
                  </div>
                  <h3 class="text-base font-bold text-gray-900 dark:text-white tracking-wide">{{ 'home.config.q3' | translate }}</h3>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-14">
                @for (stance of stances; track stance.key) {
                  <button (click)="selectedStanceKey.set(stance.key)" 
                          [disabled]="is_anonymous() && stance.key !== 'home.stances.obj'"
                          [class.opacity-50]="is_anonymous() && stance.key !== 'home.stances.obj'"
                          [class.cursor-not-allowed]="is_anonymous() && stance.key !== 'home.stances.obj'"
                          [class.bg-black]="selectedStanceKey() === stance.key" [class.dark:bg-white]="selectedStanceKey() === stance.key" [class.text-white]="selectedStanceKey() === stance.key" [class.dark:text-black]="selectedStanceKey() === stance.key" [class.border-black]="selectedStanceKey() === stance.key" [class.dark:border-white]="selectedStanceKey() === stance.key" [class.ring-2]="selectedStanceKey() === stance.key" [class.ring-black/10]="selectedStanceKey() === stance.key" [class.dark:ring-white/10]="selectedStanceKey() === stance.key"
                          [class.bg-white]="selectedStanceKey() !== stance.key" [class.dark:bg-[#1C1C1E]]="selectedStanceKey() !== stance.key" [class.text-gray-700]="selectedStanceKey() !== stance.key" [class.dark:text-gray-300]="selectedStanceKey() !== stance.key" [class.border-gray-200]="selectedStanceKey() !== stance.key" [class.dark:border-gray-800]="selectedStanceKey() !== stance.key"
                          class="p-3 rounded-2xl text-sm font-medium border shadow-sm hover:border-gray-300 dark:hover:border-gray-600 flex justify-between items-center transition-all">
                    {{ stance.key | translate }}
                    @if (selectedStanceKey() === stance.key) {
                       <mat-icon class="text-[18px]">check_circle</mat-icon>
                    } @else if (is_anonymous() && stance.key !== 'home.stances.obj') {
                      <mat-icon class="text-[14px] text-gray-400">lock</mat-icon>
                    }
                  </button>
                }
              </div>
            </div>
          }

          @if (selectedStanceKey() !== null || is_anonymous()) {
            <div class="space-y-8 aria-reveal border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
              <div class="space-y-3">
                <div class="flex gap-4 items-center">
                    <div class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <mat-icon>schedule</mat-icon>
                    </div>
                    <label for="duration-select" class="text-base font-bold text-gray-900 dark:text-white tracking-wide">{{ 'home.config.q4' | translate }}</label>
                </div>
                <div class="aria-reveal">
                  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pl-14">
                    @for (d of durations; track d.key) {
                      <button (click)="selectedDurationKey.set(d.key)" 
                              [disabled]="is_anonymous()"
                              [class.bg-black]="selectedDurationKey() === d.key" [class.dark:bg-white]="selectedDurationKey() === d.key" [class.text-white]="selectedDurationKey() === d.key" [class.dark:text-black]="selectedDurationKey() === d.key"
                              [class.bg-white]="selectedDurationKey() !== d.key" [class.dark:bg-[#1C1C1E]]="selectedDurationKey() !== d.key" [class.text-gray-700]="selectedDurationKey() !== d.key" [class.dark:text-gray-300]="selectedDurationKey() !== d.key" [class.border-gray-200]="selectedDurationKey() !== d.key" [class.dark:border-gray-800]="selectedDurationKey() !== d.key"
                              class="p-4 rounded-2xl text-sm font-bold border shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 disabled:opacity-50">
                        <span class="text-base">{{ (d.key | translate).split(' ')[0] }}</span>
                        <span class="text-[10px] uppercase tracking-tighter opacity-70">{{ (d.key | translate).split(' ')[1] }}</span>
                      </button>
                    }
                  </div>
                </div>
              </div>

              <div class="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 pl-14">
                <button (click)="currentStep.set(1)" class="w-1/3 py-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-[#2C2C2E] shadow-sm active:scale-[0.98]">
                  {{ 'home.actions.back' | translate }}
                </button>
                <button (click)="generateScript()" [disabled]="!selectedIntention() || !selectedTone() || !selectedStance() || !selectedDuration()" class="w-2/3 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 dark:hover:bg-gray-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
                  {{ 'home.actions.generate' | translate }} <mat-icon>auto_awesome</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Step 3: Générer (Loading / Result) -->
      @if (currentStep() === 3) {
        <div class="space-y-6">
          
          <!-- Toolbar -->
          <div class="flex flex-col sm:flex-row items-center justify-center p-3 sm:p-2 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm mx-auto max-w-fit gap-4 sm:gap-8">
            <div class="flex gap-6 text-sm font-medium text-gray-600 dark:text-gray-400 px-4">
              <div class="flex items-center gap-2"><mat-icon class="text-[20px]">timer</mat-icon> {{ estimatedTime() }}</div>
              <div class="flex items-center gap-2"><mat-icon class="text-[20px]">notes</mat-icon> {{ wordCount() }} {{ 'home.meta.words' | translate }}</div>
            </div>
            <div class="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-800"></div>
            <div class="flex gap-1">
              <button (click)="copyToClipboard()" class="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C2E]" [title]="'home.actions.copy' | translate">
                <mat-icon class="text-[20px]">content_copy</mat-icon>
              </button>
              <button (click)="downloadTxt()" class="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C2E]" [title]="'home.actions.download' | translate">
                <mat-icon class="text-[20px]">download</mat-icon>
              </button>
              <button (click)="reset()" class="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C2E]" [title]="'home.actions.new' | translate">
                <mat-icon class="text-[20px]">add</mat-icon>
              </button>
            </div>
          </div>

          <!-- Editor / View Area -->
          <div class="relative">
            @if (generationError()) {
              <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-medium border border-red-100 dark:border-red-900/50 flex items-start gap-3">
                <mat-icon class="shrink-0">error_outline</mat-icon>
                <p class="pt-0.5">{{ generationError() }}</p>
              </div>
            }

            @if (!isGenerating() && generatedScript()) {
              <div class="flex justify-end mb-4">
                <button (click)="isEditing.set(!isEditing())" class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <mat-icon class="text-[18px]">{{ isEditing() ? 'visibility' : 'edit' }}</mat-icon>
                  {{ isEditing() ? ('home.actions.preview' | translate) : ('home.actions.edit' | translate) }}
                </button>
              </div>
            }

            @if (isGenerating() && !generatedScript()) {
                 <!-- ARIAOS Loading State -->
              <div class="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-[2rem] shadow-sm min-h-[400px]">
                
                 <!-- Standard Minimal Loader -->
                 <div class="relative w-16 h-16 mb-8 flex items-center justify-center">
                    <div class="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-800"></div>
                    <div class="absolute inset-0 rounded-[1rem]"
                         style="background: conic-gradient(from 0deg, transparent 0deg, transparent 90deg, #ef4444 140deg, #f97316 190deg, #eab308 240deg, #22c55e 300deg, transparent 360deg); mask-image: radial-gradient(closest-side, transparent calc(100% - 4px), black calc(100% - 4px)); -webkit-mask-image: -webkit-radial-gradient(closest-side, transparent calc(100% - 4px), black calc(100% - 4px)); animation: aria-spin 4s linear infinite;">
                    </div>
                 </div>

                <!-- custom loader omitted h3 ARIAOS -->
                <p class="text-gray-900 dark:text-white font-semibold text-[17px] text-center mb-1 aria-breathe-anim mt-4">{{ getCurrentLoadingMessage() }}</p>
                <p class="text-gray-500 dark:text-gray-400 text-center max-w-sm mt-3 text-sm">Veuillez patienter, cela peut prendre quelques secondes selon la complexité et la taille de la source.</p>
              </div>
            }

            <div [class.hidden]="isGenerating() && !generatedScript()">
              @if (isEditing() || (!generatedScript() && !isGenerating()) || isGenerating()) {
                <div class="relative">
                  <textarea [(ngModel)]="generatedScript" rows="15" class="w-full p-6 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 resize-none leading-relaxed text-lg shadow-sm placeholder:text-gray-400 font-sans" [placeholder]="'home.meta.placeholderResult' | translate"></textarea>
                  
                  @if (isGenerating()) {
                     <div class="absolute bottom-6 right-6 bg-black/90 dark:bg-white/90 backdrop-blur-md px-5 py-3 rounded-full flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(255,255,255,0.1)] pointer-events-none border border-white/10 dark:border-black/10">
                        <div class="flex gap-1.5 mr-1 pt-0.5">
                           <div class="w-2.5 h-2.5 rounded-full bg-red-500 aria-dot-1"></div>
                           <div class="w-2.5 h-2.5 rounded-full bg-orange-500 aria-dot-2"></div>
                           <div class="w-2.5 h-2.5 rounded-full bg-yellow-500 aria-dot-3"></div>
                        </div>
                        <span class="text-white dark:text-black font-bold text-[13px] uppercase tracking-widest leading-none">{{ 'home.meta.writing' | translate }}</span>
                     </div>
                  }
                </div>
              } @else {
                <div class="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-[2rem] p-6 md:p-10 shadow-xl relative overflow-hidden min-h-[400px]">
                
                <!-- Decorative watermark removed -->

                <!-- Header / Metadata -->
                <div class="border-b-2 border-gray-100 dark:border-gray-800 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
                  <div>
                    <div class="flex items-center gap-2 mb-2">
                      <span class="px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-md">Script Pro</span>
                      <span class="px-3 py-1 bg-gray-100 dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-300 text-[10px] font-bold uppercase tracking-widest rounded-md">{{ selectedIntentionKey() | translate }}</span>
                    </div>
                    <h3 class="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Format {{ selectedToneKey() | translate }}</h3>
                    @if (inputType() === 'url' && sourceUrl()) {
                      <p class="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                        <mat-icon class="text-[14px] w-[14px] h-[14px]">link</mat-icon>
                        <button (click)="viewerUrl.set(sourceUrl())" class="hover:underline truncate max-w-[250px] inline-block align-bottom text-left">{{ sourceUrl() }}</button>
                      </p>
                    } @else if (inputType() === 'text' && sourceText()) {
                      <p class="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <mat-icon class="text-[14px] w-[14px] h-[14px]">description</mat-icon>
                        {{ 'home.meta.sourceText' | translate }}
                      </p>
                    }
                  </div>
                  <div class="text-left md:text-right text-xs font-medium text-gray-500 space-y-1.5">
                    <p class="flex items-center md:justify-end gap-2"><mat-icon class="text-[14px] w-[14px] h-[14px]">person</mat-icon> {{ 'home.meta.author' | translate }}: <span class="text-black dark:text-white font-bold">{{ authService.currentUser()?.user_metadata?.['full_name'] || authService.currentUser()?.user_metadata?.['name'] || ('home.meta.anonAuthor' | translate) }}</span></p>
                    <p class="flex items-center md:justify-end gap-2"><mat-icon class="text-[14px] w-[14px] h-[14px]">schedule</mat-icon> {{ 'home.meta.generatedAt' | translate }}: <span class="text-black dark:text-white font-bold">{{ generationDate() | date:'dd/MM/yyyy' }} {{ 'home.meta.at' | translate }} {{ generationDate() | date:'HH:mm' }}</span></p>
                    <p class="flex items-center md:justify-end gap-2"><mat-icon class="text-[14px] w-[14px] h-[14px]">timer</mat-icon> {{ 'home.meta.targetDuration' | translate }}: <span class="text-black dark:text-white font-bold">{{ selectedDurationKey() | translate }}</span></p>
                    <p class="flex items-center md:justify-end gap-2"><mat-icon class="text-[14px] w-[14px] h-[14px]">bolt</mat-icon> {{ 'home.meta.thinkingTime' | translate }}: <span class="text-black dark:text-white font-bold">{{ estimatedTime() }}</span></p>
                  </div>
                </div>

                <!-- Content -->
                <div class="relative z-10" [innerHTML]="generatedScript() | scriptFormat">
                </div>
              </div>
            }
            </div>
          </div>

          @if (!isGenerating() && generatedScript()) {
            <div class="flex flex-col sm:flex-row gap-3">
              @if (!is_anonymous()) {
                <button (click)="goToStudio()" class="flex-1 py-4 rounded-2xl bg-violet-600 text-white font-semibold text-lg flex items-center justify-center gap-2 shadow-sm hover:bg-violet-700 active:scale-[0.98]">
                  {{ 'home.actions.studio' | translate }}
                  <mat-icon>videocam</mat-icon>
                </button>

                <button (click)="saveScript()" [disabled]="isSaved()" class="flex-1 py-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 text-black dark:text-white font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 dark:hover:bg-[#2C2C2E] active:scale-[0.98]">
                  {{ isSaved() ? ('home.actions.saved' | translate) : ('home.actions.save' | translate) }}
                  <mat-icon>{{ isSaved() ? 'check_circle' : 'save' }}</mat-icon>
                </button>
              }
              
              <button (click)="shareOnWhatsApp(generatedScript())" class="flex-1 py-4 rounded-2xl bg-[#25D366] text-white font-semibold text-lg flex items-center justify-center gap-2 shadow-sm hover:bg-[#20bd5a] active:scale-[0.98]">
                {{ 'home.actions.share' | translate }}
                <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
            </div>
          }
        </div>
      }

      <app-source-viewer [url]="viewerUrl()" (closeViewer)="viewerUrl.set(null)" />

      <!-- Compatible Sources Marquee (Moved to bottom) -->
      <div class="w-full overflow-hidden py-8 mt-8 relative mask-image-edges">
        <div class="flex whitespace-nowrap animate-scroll w-max items-center pointer-events-none">
          <!-- Group 1 -->
          <div class="flex items-center gap-20 px-10 text-black dark:text-white">
            <div class="flex items-center gap-2">
              <div class="w-10 h-8 bg-black dark:bg-white rounded-[0.5rem] flex items-center justify-center">
                <div class="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white dark:border-l-black border-b-[5px] border-b-transparent ml-0.5"></div>
              </div>
              <span class="font-bold tracking-tighter text-3xl">YouTube</span>
            </div>
            <span class="font-black tracking-tighter text-4xl">Cakenews</span>
            <span class="font-black tracking-tighter text-4xl">CNN</span>
            <span class="font-bold tracking-tighter text-3xl">Bloomberg</span>
            <div class="flex gap-0.5">
              <span class="bg-black dark:bg-white text-white dark:text-black w-10 h-10 flex items-center justify-center font-bold text-2xl">B</span>
              <span class="bg-black dark:bg-white text-white dark:text-black w-10 h-10 flex items-center justify-center font-bold text-2xl">B</span>
              <span class="bg-black dark:bg-white text-white dark:text-black w-10 h-10 flex items-center justify-center font-bold text-2xl">C</span>
            </div>
            <span class="font-black tracking-widest text-3xl uppercase">Reuters</span>
            <div class="flex items-center">
              <span class="font-black text-4xl tracking-tight">FRANCE</span>
              <span class="font-light text-4xl tracking-tight ml-1">24</span>
            </div>
            <span class="font-bold tracking-widest text-2xl">AL JAZEERA</span>
            <span class="font-black tracking-tight text-3xl">Saglows</span>
            <span class="font-black tracking-tight text-3xl">The New York Times</span>
            <span class="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 font-bold text-xl tracking-tight">jeune afrique</span>
            <span class="font-black tracking-tighter text-3xl uppercase">The Times of India</span>
            <span class="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 font-black tracking-tighter text-3xl">RFI</span>
            <div class="flex items-center">
              <span class="font-black text-4xl tracking-tight">GABON</span>
              <span class="font-light text-4xl tracking-tight ml-1">24</span>
            </div>
          </div>
          <!-- Group 2 (Duplicate for infinite scroll) -->
          <div class="flex items-center gap-20 px-10 text-black dark:text-white">
            <div class="flex items-center gap-2">
              <div class="w-10 h-8 bg-black dark:bg-white rounded-[0.5rem] flex items-center justify-center">
                <div class="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white dark:border-l-black border-b-[5px] border-b-transparent ml-0.5"></div>
              </div>
              <span class="font-bold tracking-tighter text-3xl">YouTube</span>
            </div>
            <span class="font-black tracking-tighter text-4xl">Cakenews</span>
            <span class="font-black tracking-tighter text-4xl">CNN</span>
            <span class="font-bold tracking-tighter text-3xl">Bloomberg</span>
            <div class="flex gap-0.5">
              <span class="bg-black dark:bg-white text-white dark:text-black w-10 h-10 flex items-center justify-center font-bold text-2xl">B</span>
              <span class="bg-black dark:bg-white text-white dark:text-black w-10 h-10 flex items-center justify-center font-bold text-2xl">B</span>
              <span class="bg-black dark:bg-white text-white dark:text-black w-10 h-10 flex items-center justify-center font-bold text-2xl">C</span>
            </div>
            <span class="font-black tracking-widest text-3xl uppercase">Reuters</span>
            <div class="flex items-center">
              <span class="font-black text-4xl tracking-tight">FRANCE</span>
              <span class="font-light text-4xl tracking-tight ml-1">24</span>
            </div>
            <span class="font-bold tracking-widest text-2xl">AL JAZEERA</span>
            <span class="font-black tracking-tight text-3xl">Saglows</span>
            <span class="font-black tracking-tight text-3xl">The New York Times</span>
            <span class="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 font-bold text-xl tracking-tight">jeune afrique</span>
            <span class="font-black tracking-tighter text-3xl uppercase">The Times of India</span>
            <span class="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 font-black tracking-tighter text-3xl">RFI</span>
            <div class="flex items-center">
              <span class="font-black text-4xl tracking-tight">GABON</span>
              <span class="font-light text-4xl tracking-tight ml-1">24</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class HomeComponent implements OnInit, OnDestroy {
  steps = [
    { id: 1, label: 'home.steps.load' },
    { id: 2, label: 'home.steps.config' },
    { id: 3, label: 'home.steps.generate' }
  ];

  currentStep = signal(1);
  inputType = signal<'url' | 'text'>('url');
  
  sourceUrl = signal('');
  sourceText = signal('');

  intentions = [
    { key: 'home.intentions.sum', val: 'Résumer' },
    { key: 'home.intentions.ana', val: 'Analyser' },
    { key: 'home.intentions.crit', val: 'Critiquer' },
    { key: 'home.intentions.expl', val: 'Expliquer' },
    { key: 'home.intentions.reph', val: 'Reformuler' },
    { key: 'home.intentions.deb', val: 'Débattre' }
  ];
  selectedIntentionKey = signal<string | null>(null);
  selectedIntention = computed(() => {
    const key = this.selectedIntentionKey();
    return this.intentions.find(i => i.key === key)?.val || null;
  });

  tones = [
    { key: 'home.tones.fact', val: 'Factuel (Neutre)' },
    { key: 'home.tones.punchy', val: 'Punchy (Dynamique)' },
    { key: 'home.tones.sat', val: 'Satyrique' },
    { key: 'home.tones.insp', val: 'Inspirant' },
    { key: 'home.tones.ana', val: 'Analytique' },
    { key: 'home.tones.drama', val: 'Dramatique' }
  ];
  selectedToneKey = signal<string | null>(null);
  selectedTone = computed(() => {
    const key = this.selectedToneKey();
    return this.tones.find(t => t.key === key)?.val || null;
  });

  stances = [
    { key: 'home.stances.obj', val: 'Objectif' },
    { key: 'home.stances.fav', val: 'Favorable (Élogieux)' },
    { key: 'home.stances.unfav', val: 'Défavorable (À charge)' }
  ];
  selectedStanceKey = signal<string | null>(null);
  selectedStance = computed(() => {
    const key = this.selectedStanceKey();
    return this.stances.find(s => s.key === key)?.val || null;
  });

  durations = [
    { key: 'home.durations.30s', val: '30 sec' },
    { key: 'home.durations.1m', val: '1 min' },
    { key: 'home.durations.2m', val: '2 min' },
    { key: 'home.durations.3m', val: '3 min' },
    { key: 'home.durations.5m', val: '5 min' }
  ];
  selectedDurationKey = signal<string | null>(null);
  selectedDuration = computed(() => {
    const key = this.selectedDurationKey();
    return this.durations.find(d => d.key === key)?.val || null;
  });

  isGenerating = signal(false);
  generatedScript = signal('');
  isSaving = signal(false);
  
  generationTimer = signal(0);
  timerInterval: ReturnType<typeof setInterval> | undefined;

  isEditing = signal(false);
  generationDate = signal<Date | null>(null);
  viewerUrl = signal<string | null>(null);

  loadingMessages = [
    "home.loading.m1",
    "home.loading.m2",
    "home.loading.m3",
    "home.loading.m4",
    "home.loading.m5",
    "home.loading.m6"
  ];
  delayedMessages = [
    "home.loading.d1",
    "home.loading.d2",
    "home.loading.d3",
    "home.loading.d4",
    "home.loading.d5"
  ];
  loadingMessageIndex = signal(0);
  loadingMessageInterval: ReturnType<typeof setInterval> | undefined;

  getCurrentLoadingMessage(): string {
    const time = this.generationTimer();
    let key = '';
    if (time > 15) {
      const index = Math.floor((time - 15) / 4) % this.delayedMessages.length;
      key = this.delayedMessages[index];
    } else {
      key = this.loadingMessages[this.loadingMessageIndex()];
    }
    return this.languageService.translate(key);
  }

  wordCount = computed(() => {
    const text = this.generatedScript().trim();
    return text ? text.split(/\s+/).length : 0;
  });

  // Ad Carousel Logic
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
  adInterval: ReturnType<typeof setInterval> | undefined;

  recordedGenerationTime = signal<number | null>(null);
  isSaved = signal(false);

  estimatedTime = computed(() => {
    const recorded = this.recordedGenerationTime();
    const time = recorded !== null ? recorded : this.generationTimer();
    const unitSec = this.languageService.translate('home.durations.sec');
    const unitMin = this.languageService.translate('home.durations.min');

    if (time < 60) return `${time} ${unitSec}`;
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins}${unitMin} ${secs}${unitSec}`;
  });

  private geminiService = inject(GeminiService);
  private scriptService = inject(ScriptService);
  private userService = inject(UserService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private languageService = inject(LanguageService);
  public router = inject(Router);

  is_anonymous = computed(() => this.authService.isAnonymous());

  generationError = signal<string>('');
  
  private unsubscribeProfile: (() => void) | undefined;

  constructor() {
    // Save preferences on select if not anonymous
    effect(() => {
       const intentKey = this.selectedIntentionKey();
       const toneKey = this.selectedToneKey();
       const stanceKey = this.selectedStanceKey();
       const durationKey = this.selectedDurationKey();
       
       if (!this.is_anonymous() && intentKey && toneKey && stanceKey && durationKey) {
          // Verify we aren't saving the same things (prevents loops)
          this.userService.saveUserPreferences({ 
            intention: intentKey, 
            tone: toneKey, 
            stance: stanceKey, 
            duration: durationKey 
          });
       }
    });

    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { scriptToEdit?: ScriptData };
    
    if (state?.scriptToEdit) {
      const script = state.scriptToEdit;
      if (script.source_url) {
        this.inputType.set('url');
        this.sourceUrl.set(script.source_url);
      } else if (script.source_text) {
        this.inputType.set('text');
        this.sourceText.set(script.source_text);
      }
      this.selectedIntentionKey.set(this.intentions.find(i => i.val === script.intention)?.key || null);
      this.selectedToneKey.set(this.tones.find(t => t.val === script.tone)?.key || null);
      if (script.stance) {
        this.selectedStanceKey.set(this.stances.find(s => s.val === script.stance)?.key || null);
      }
      this.selectedDurationKey.set(this.durations.find(d => d.val === script.duration)?.key || null);
      this.currentStep.set(2);
    }
  }

  ngOnInit() {
    this.startAdRotation();
    if (!this.is_anonymous()) {
      this.unsubscribeProfile = this.userService.getUserProfileSnapshot(profile => {
        // Only initialize state from profile if we are at the beginning
        if (profile?.preferences && this.currentStep() < 3) {
           const p = profile.preferences as any;
           
           // We expect p to contain keys (e.g. 'home.intentions.sum')
           // But older data might have values (e.g. 'Résumer')
           // We handle both for robustness
           
           if (p.intention) {
             const found = this.intentions.find(i => i.key === p.intention || i.val === p.intention);
             if (found && this.selectedIntentionKey() !== found.key) {
               this.selectedIntentionKey.set(found.key);
             }
           }
           if (p.tone) {
             const found = this.tones.find(t => t.key === p.tone || t.val === p.tone);
             if (found && this.selectedToneKey() !== found.key) {
               this.selectedToneKey.set(found.key);
             }
           }
           if (p.stance) {
             const found = this.stances.find(s => s.key === p.stance || s.val === p.stance);
             if (found && this.selectedStanceKey() !== found.key) {
               this.selectedStanceKey.set(found.key);
             }
           }
           if (p.duration) {
             const found = this.durations.find(d => d.key === p.duration || d.val === p.duration);
             if (found && this.selectedDurationKey() !== found.key) {
               this.selectedDurationKey.set(found.key);
             }
           }
        }
      });
    }
  }

  ngOnDestroy() {
    this.stopTimer();
    this.stopAdRotation();
    if (this.unsubscribeProfile) {
      this.unsubscribeProfile();
    }
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

  urlError = computed(() => {
    if (this.inputType() !== 'url') return '';
    
    const url = this.sourceUrl().trim();
    if (url.length === 0) return '';
    
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      
      // Check for unsupported video platforms
      if (hostname.includes('tiktok.com') || 
          hostname.includes('vimeo.com') || 
          hostname.includes('instagram.com') || 
          hostname.includes('dailymotion.com') ||
          hostname.includes('twitch.tv')) {
        return this.languageService.translate('home.source.errorUnsupported');
      }
      
      return '';
    } catch {
      return this.languageService.translate('home.source.errorInvalid');
    }
  });

  canProceedToConfig = computed(() => {
    if (this.inputType() === 'url') {
      const url = this.sourceUrl().trim();
      return url.length > 0 && this.urlError() === '';
    }
    return this.sourceText().trim().length > 0;
  });

  nextStep() {
    this.currentStep.set(this.currentStep() + 1);
  }

  startTimer() {
    this.generationTimer.set(0);
    this.timerInterval = setInterval(() => {
      this.generationTimer.set(this.generationTimer() + 1);
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  async generateScript() {
    this.currentStep.set(3);
    this.isGenerating.set(true);
    this.generatedScript.set('');
    this.generationError.set('');
    this.isSaved.set(false);
    this.recordedGenerationTime.set(null);
    this.startTimer();
    
    // Start Loading Messages Animation
    this.loadingMessageIndex.set(0);
    this.loadingMessageInterval = setInterval(() => {
      // Stop cycling normal messages if we passed 15 seconds (getCurrentLoadingMessage will handle it)
      if (this.generationTimer() <= 15) {
        this.loadingMessageIndex.update(i => (i + 1) % this.loadingMessages.length);
      }
    }, 2500);

    try {
      const result = await this.geminiService.analyzeAndGenerateScript(
        this.inputType() === 'url' ? this.sourceUrl() : '',
        this.inputType() === 'text' ? this.sourceText() : '',
        this.selectedIntention() ?? 'Résumer',
        this.selectedTone() ?? 'Factuel (Neutre)',
        this.selectedStance() ?? 'Objectif',
        this.selectedDuration() ?? '1 min',
        (text) => {
          // Stop timer and loading animation only on the VERY FIRST chunk received
          if (!this.generatedScript()) {
            this.recordedGenerationTime.set(this.generationTimer());
            this.stopTimer();
            if (this.loadingMessageInterval) {
              clearInterval(this.loadingMessageInterval);
              this.loadingMessageInterval = undefined;
            }
          }
          this.generatedScript.set(text);
        }
      );
      // Final result is already set via progress callback, but we can ensure it's complete
      this.generatedScript.set(result.script);
      this.generationDate.set(new Date());
    } catch (error: unknown) {
      console.error(error);
      let errorMessage = 'Une erreur inattendue est survenue lors de la génération. Veuillez réessayer.';
      
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('quota')) {
          errorMessage = 'Le quota de requêtes vers l\'intelligence artificielle a été dépassé. Veuillez patienter un moment avant de réessayer.';
        } else if (error.message.includes('400') || error.message.includes('invalid')) {
          errorMessage = 'La source fournie (URL ou texte) semble invalide ou ne peut pas être analysée. Veuillez vérifier votre entrée.';
        } else if (error.message.includes('500') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Le serveur de génération est temporairement indisponible. Veuillez réessayer plus tard.';
        }
      }
      
      this.generationError.set(errorMessage);
    } finally {
      this.isGenerating.set(false);
      this.stopTimer();
      if (this.loadingMessageInterval) {
        clearInterval(this.loadingMessageInterval);
      }
    }
  }

  async saveScript() {
    if (this.isSaved()) return;
    
    // Eagerly update UI
    this.isSaved.set(true);

    try {
      const scriptData: Omit<ScriptData, 'id' | 'user_id' | 'created_at'> = {
        source_type: 'text',
        intention: this.selectedIntention() ?? 'Résumer',
        tone: this.selectedTone() ?? 'Factuel (Neutre)',
        stance: this.selectedStance() ?? 'Objectif',
        duration: this.selectedDuration() ?? '1 min',
        content: this.generatedScript(),
        reflection_time: this.recordedGenerationTime() ?? undefined
      };
      
      if (this.inputType() === 'url') {
        scriptData.source_url = this.sourceUrl();
      } else {
        scriptData.source_text = this.sourceText();
      }

      await this.scriptService.saveScript(scriptData);
    } catch (error) {
      console.error('Save error', error);
      // Revert if failed
      this.isSaved.set(false);
      this.toastService.error('Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.generatedScript()).then(() => {
      this.toastService.success('Script copié dans le presse-papiers !');
    }).catch(() => {
      this.toastService.error('Erreur lors de la copie du script.');
    });
  }

  shareOnWhatsApp(text: string) {
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  }

  goToStudio() {
    const title = `${this.selectedIntention() ?? 'Script'} - ${this.selectedTone() ?? 'Standard'}`;
    this.router.navigate(['/studio'], { state: { scriptContent: this.generatedScript(), scriptTitle: title } });
  }

  downloadTxt() {
    const content = `=== MÉTADONNÉES ===\nIntention: ${this.selectedIntention() ?? 'Non définie'}\nTon: ${this.selectedTone() ?? 'Non défini'}\nAngle: ${this.selectedStance() ?? 'Non défini'}\nDurée cible: ${this.selectedDuration()}\nSource: ${this.inputType() === 'url' ? this.sourceUrl() : 'Texte brut'}\n\n=== SCRIPT ===\n\n${this.generatedScript()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  reset() {
    this.currentStep.set(1);
    this.generatedScript.set('');
    this.isSaved.set(false);
    this.sourceUrl.set('');
    this.sourceText.set('');
    this.generationTimer.set(0);
    this.selectedIntentionKey.set(null);
    this.selectedToneKey.set(null);
    this.selectedStanceKey.set(null);
    this.selectedDurationKey.set(null);
  }

  async loginWithGoogle() {
    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      console.error('Login error', error);
    }
  }
}
