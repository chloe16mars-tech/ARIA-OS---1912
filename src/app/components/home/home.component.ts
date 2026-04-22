import { Component, signal, computed, OnInit, OnDestroy, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GeminiService } from '../../services/gemini.service';
import { ScriptService, ScriptData } from '../../services/script.service';
import { UserService, UserProfile } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ScriptFormatPipe } from '../../pipes/script-format.pipe';
import { SourceViewerComponent } from '../source-viewer/source-viewer.component';
import { ToastService } from '../../services/toast.service';
import { AriaNeonContainerComponent } from '../ui/aria-neon-container.component';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule, CommonModule, ScriptFormatPipe, SourceViewerComponent, AriaNeonContainerComponent],
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
                  <span class="inline-block px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white bg-white/10 backdrop-blur-md rounded-md border border-white/20 shadow-sm">{{ad.badge}}</span>
                </div>
                <h3 class="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-md">{{ad.title}}</h3>
                <p class="text-gray-300 text-sm sm:text-base font-medium line-clamp-2 drop-shadow-sm">{{ad.description}}</p>
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
                      [attr.aria-label]="'Aller à la slide ' + (i + 1)">
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
              {{ step.label }}
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
              <h2 class="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Source du contenu</h2>
              <p class="text-base font-medium text-gray-500 dark:text-gray-400">Collez une URL (YouTube, Article, Blog...) ou du texte brut.</p>
            </div>
            
            <div class="flex gap-2 p-1.5 bg-gray-50 dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800">
              @if (!isAnonymous()) {
                <button (click)="inputType.set('url')" [class.bg-white]="inputType() === 'url'" [class.shadow-sm]="inputType() === 'url'" [class.text-orange-600]="inputType() === 'url'" [class.dark:text-orange-400]="inputType() === 'url'" [class.dark:bg-[#1C1C1E]]="inputType() === 'url'" [class.text-gray-500]="inputType() !== 'url'" class="flex-1 py-3 rounded-xl text-sm font-bold tracking-wide transition-all">URL</button>
              }
              <button (click)="inputType.set('text')" [class.bg-white]="inputType() === 'text'" [class.shadow-sm]="inputType() === 'text'" [class.text-orange-600]="inputType() === 'text'" [class.dark:text-orange-400]="inputType() === 'text'" [class.dark:bg-[#1C1C1E]]="inputType() === 'text'" [class.text-gray-500]="inputType() !== 'text'" class="flex-1 py-3 rounded-xl text-sm font-bold tracking-wide transition-all">Texte Brut</button>
            </div>

            @if (inputType() === 'url') {
              <div class="space-y-4">
                <app-aria-neon-container 
                  containerClass="shadow-sm w-full bg-gray-200 dark:bg-gray-700/50 overflow-hidden" 
                  innerClass="bg-white dark:bg-[#1C1C1E] flex items-center border-[0.5px] border-white/20 dark:border-black/50 overflow-hidden">
                     <div class="pl-4 flex items-center pointer-events-none">
                        <mat-icon class="text-gray-400">link</mat-icon>
                     </div>
                     <input type="url" [(ngModel)]="sourceUrl" placeholder="https://..." class="w-full pl-3 pr-4 py-4 bg-transparent focus:outline-none text-lg placeholder:text-gray-400 transition-all font-medium text-gray-900 dark:text-gray-100 rounded-none rounded-r-[14px]">
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
                      <textarea [(ngModel)]="sourceText" rows="6" placeholder="Collez votre texte ici..." class="w-full p-5 bg-transparent focus:outline-none resize-none text-lg placeholder:text-gray-400 transition-all font-medium text-gray-900 dark:text-gray-100 rounded-[14px]"></textarea>
                </app-aria-neon-container>
              </div>
            }

            <div class="pt-4">
              <button (click)="nextStep()" [disabled]="!canProceedToConfig()" class="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-lg disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all">
                Continuer <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Step 2: Configurer -->
      @if (currentStep() === 2) {
        <div class="space-y-10">
          <div class="space-y-1 mb-8">
            <h2 class="text-2xl font-semibold tracking-tight">L'Assistant de Configuration</h2>
            <p class="text-base text-gray-500 dark:text-gray-400">Laissez-vous guider pas à pas pour paramétrer la requête parfaite.</p>
          </div>
          
          <div class="space-y-3">
            <div class="flex gap-4 items-center">
                <div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <mat-icon>track_changes</mat-icon>
                </div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white tracking-wide">1. Quel est l'objectif de ce script ?</h3>
            </div>
            <div class="grid grid-cols-2 gap-3 pl-14">
              @for (intent of intentions; track intent) {
                <button (click)="selectedIntention.set(intent)" 
                        [disabled]="isAnonymous() && intent !== 'Résumer'"
                        [class.opacity-50]="isAnonymous() && intent !== 'Résumer'"
                        [class.cursor-not-allowed]="isAnonymous() && intent !== 'Résumer'"
                        [class.bg-black]="selectedIntention() === intent" [class.dark:bg-white]="selectedIntention() === intent" [class.text-white]="selectedIntention() === intent" [class.dark:text-black]="selectedIntention() === intent" [class.border-black]="selectedIntention() === intent" [class.dark:border-white]="selectedIntention() === intent" [class.ring-2]="selectedIntention() === intent" [class.ring-black/10]="selectedIntention() === intent" [class.dark:ring-white/10]="selectedIntention() === intent"
                        [class.bg-white]="selectedIntention() !== intent" [class.dark:bg-[#1C1C1E]]="selectedIntention() !== intent" [class.text-gray-700]="selectedIntention() !== intent" [class.dark:text-gray-300]="selectedIntention() !== intent" [class.border-gray-200]="selectedIntention() !== intent" [class.dark:border-gray-800]="selectedIntention() !== intent"
                        class="p-4 rounded-2xl text-sm font-medium border shadow-sm hover:border-gray-300 dark:hover:border-gray-600 text-left flex justify-between items-center transition-all">
                  {{ intent }}
                  @if (selectedIntention() === intent) {
                     <mat-icon class="text-[18px]">check_circle</mat-icon>
                  } @else if (isAnonymous() && intent !== 'Résumer') {
                    <mat-icon class="text-[16px] text-gray-400">lock</mat-icon>
                  }
                </button>
              }
            </div>
          </div>

          @if (selectedIntention() !== null || isAnonymous()) {
            <div class="space-y-3 aria-reveal border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
              <div class="flex gap-4 items-center">
                  <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <mat-icon>record_voice_over</mat-icon>
                  </div>
                  <h3 class="text-base font-bold text-gray-900 dark:text-white tracking-wide">2. Quel ton éditorial l'IA doit-elle adopter ?</h3>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pl-14">
                @for (t of tones; track t) {
                  <button (click)="selectedTone.set(t)" 
                          [disabled]="isAnonymous() && t !== 'Factuel (Neutre)'"
                          [class.opacity-50]="isAnonymous() && t !== 'Factuel (Neutre)'"
                          [class.cursor-not-allowed]="isAnonymous() && t !== 'Factuel (Neutre)'"
                          [class.bg-black]="selectedTone() === t" [class.dark:bg-white]="selectedTone() === t" [class.text-white]="selectedTone() === t" [class.dark:text-black]="selectedTone() === t" [class.border-black]="selectedTone() === t" [class.dark:border-white]="selectedTone() === t" [class.ring-2]="selectedTone() === t" [class.ring-black/10]="selectedTone() === t" [class.dark:ring-white/10]="selectedTone() === t"
                          [class.bg-white]="selectedTone() !== t" [class.dark:bg-[#1C1C1E]]="selectedTone() !== t" [class.text-gray-700]="selectedTone() !== t" [class.dark:text-gray-300]="selectedTone() !== t" [class.border-gray-200]="selectedTone() !== t" [class.dark:border-gray-800]="selectedTone() !== t"
                          class="p-3 rounded-2xl text-sm font-medium border shadow-sm hover:border-gray-300 dark:hover:border-gray-600 flex justify-between items-center transition-all">
                    {{ t }}
                    @if (selectedTone() === t) {
                       <mat-icon class="text-[18px]">check_circle</mat-icon>
                    } @else if (isAnonymous() && t !== 'Factuel (Neutre)') {
                      <mat-icon class="text-[14px] text-gray-400">lock</mat-icon>
                    }
                  </button>
                }
              </div>
            </div>
          }

          @if (selectedTone() !== null || isAnonymous()) {
            <div class="space-y-3 aria-reveal border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
              <div class="flex gap-4 items-center">
                  <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                      <mat-icon>balance</mat-icon>
                  </div>
                  <h3 class="text-base font-bold text-gray-900 dark:text-white tracking-wide">3. Quel doit être mon parti pris sur le sujet ?</h3>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-14">
                @for (stance of stances; track stance) {
                  <button (click)="selectedStance.set(stance)" 
                          [disabled]="isAnonymous() && stance !== 'Objectif'"
                          [class.opacity-50]="isAnonymous() && stance !== 'Objectif'"
                          [class.cursor-not-allowed]="isAnonymous() && stance !== 'Objectif'"
                          [class.bg-black]="selectedStance() === stance" [class.dark:bg-white]="selectedStance() === stance" [class.text-white]="selectedStance() === stance" [class.dark:text-black]="selectedStance() === stance" [class.border-black]="selectedStance() === stance" [class.dark:border-white]="selectedStance() === stance" [class.ring-2]="selectedStance() === stance" [class.ring-black/10]="selectedStance() === stance" [class.dark:ring-white/10]="selectedStance() === stance"
                          [class.bg-white]="selectedStance() !== stance" [class.dark:bg-[#1C1C1E]]="selectedStance() !== stance" [class.text-gray-700]="selectedStance() !== stance" [class.dark:text-gray-300]="selectedStance() !== stance" [class.border-gray-200]="selectedStance() !== stance" [class.dark:border-gray-800]="selectedStance() !== stance"
                          class="p-3 rounded-2xl text-sm font-medium border shadow-sm hover:border-gray-300 dark:hover:border-gray-600 flex justify-between items-center transition-all">
                    {{ stance }}
                    @if (selectedStance() === stance) {
                       <mat-icon class="text-[18px]">check_circle</mat-icon>
                    } @else if (isAnonymous() && stance !== 'Objectif') {
                      <mat-icon class="text-[14px] text-gray-400">lock</mat-icon>
                    }
                  </button>
                }
              </div>
            </div>
          }

          @if (selectedStance() !== null || isAnonymous()) {
            <div class="space-y-8 aria-reveal border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
              <div class="space-y-3">
                <div class="flex gap-4 items-center">
                    <div class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <mat-icon>schedule</mat-icon>
                    </div>
                    <label for="duration-select" class="text-base font-bold text-gray-900 dark:text-white tracking-wide">4. Quelle est la durée cible de l'audio ?</label>
                </div>
                <div class="relative pl-14">
                  <select id="duration-select" [(ngModel)]="selectedDuration" [disabled]="isAnonymous()" class="w-full p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 font-medium shadow-sm appearance-none text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                    <option [ngValue]="null" disabled selected>Choisissez une durée...</option>
                    @for (d of durations; track d) {
                      <option [value]="d">{{ d }}</option>
                    }
                  </select>
                  <mat-icon class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</mat-icon>
                </div>
              </div>

              <div class="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 pl-14">
                <button (click)="currentStep.set(1)" class="w-1/3 py-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-[#2C2C2E] shadow-sm active:scale-[0.98]">
                  Retour
                </button>
                <button (click)="generateScript()" [disabled]="!selectedIntention() || !selectedTone() || !selectedStance() || !selectedDuration()" class="w-2/3 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 dark:hover:bg-gray-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
                  Générer <mat-icon>auto_awesome</mat-icon>
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
              <div class="flex items-center gap-2"><mat-icon class="text-[20px]">notes</mat-icon> {{ wordCount() }} mots</div>
            </div>
            <div class="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-800"></div>
            <div class="flex gap-1">
              <button (click)="copyToClipboard()" class="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C2E]" title="Copier">
                <mat-icon class="text-[20px]">content_copy</mat-icon>
              </button>
              <button (click)="downloadTxt()" class="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C2E]" title="Télécharger">
                <mat-icon class="text-[20px]">download</mat-icon>
              </button>
              <button (click)="reset()" class="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C2E]" title="Nouveau">
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
                  {{ isEditing() ? 'Aperçu Pro' : 'Modifier le texte' }}
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
                  <textarea [(ngModel)]="generatedScript" rows="15" class="w-full p-6 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-black dark:focus:border-white focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 resize-none leading-relaxed text-lg shadow-sm placeholder:text-gray-400 font-sans" placeholder="Votre script apparaîtra ici..."></textarea>
                  
                  @if (isGenerating()) {
                     <div class="absolute bottom-6 right-6 bg-black/90 dark:bg-white/90 backdrop-blur-md px-5 py-3 rounded-full flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(255,255,255,0.1)] pointer-events-none border border-white/10 dark:border-black/10">
                        <div class="flex gap-1.5 mr-1 pt-0.5">
                           <div class="w-2.5 h-2.5 rounded-full bg-red-500 aria-dot-1"></div>
                           <div class="w-2.5 h-2.5 rounded-full bg-orange-500 aria-dot-2"></div>
                           <div class="w-2.5 h-2.5 rounded-full bg-yellow-500 aria-dot-3"></div>
                        </div>
                        <span class="text-white dark:text-black font-bold text-[13px] uppercase tracking-widest leading-none">En cours de rédaction...</span>
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
                      <span class="px-3 py-1 bg-gray-100 dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-300 text-[10px] font-bold uppercase tracking-widest rounded-md">{{ selectedIntention() }}</span>
                    </div>
                    <h3 class="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Format {{ selectedTone() }}</h3>
                    @if (inputType() === 'url' && sourceUrl()) {
                      <p class="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                        <mat-icon class="text-[14px] w-[14px] h-[14px]">link</mat-icon>
                        <button (click)="viewerUrl.set(sourceUrl())" class="hover:underline truncate max-w-[250px] inline-block align-bottom text-left">{{ sourceUrl() }}</button>
                      </p>
                    } @else if (inputType() === 'text' && sourceText()) {
                      <p class="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <mat-icon class="text-[14px] w-[14px] h-[14px]">description</mat-icon>
                        Source textuelle
                      </p>
                    }
                  </div>
                  <div class="text-left md:text-right text-xs font-medium text-gray-500 space-y-1.5">
                    <p class="flex items-center md:justify-end gap-2"><mat-icon class="text-[14px] w-[14px] h-[14px]">person</mat-icon> Auteur: <span class="text-black dark:text-white font-bold">{{ authService.currentUser()?.displayName || 'Auteur Anonyme' }}</span></p>
                    <p class="flex items-center md:justify-end gap-2"><mat-icon class="text-[14px] w-[14px] h-[14px]">schedule</mat-icon> Généré le: <span class="text-black dark:text-white font-bold">{{ generationDate() | date:'dd/MM/yyyy à HH:mm' }}</span></p>
                    <p class="flex items-center md:justify-end gap-2"><mat-icon class="text-[14px] w-[14px] h-[14px]">timer</mat-icon> Durée cible: <span class="text-black dark:text-white font-bold">{{ selectedDuration() }}</span></p>
                    <p class="flex items-center md:justify-end gap-2"><mat-icon class="text-[14px] w-[14px] h-[14px]">bolt</mat-icon> Temps de réflexion: <span class="text-black dark:text-white font-bold">{{ estimatedTime() }}</span></p>
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
              @if (!isAnonymous()) {
                <button (click)="goToStudio()" class="flex-1 py-4 rounded-2xl bg-violet-600 text-white font-semibold text-lg flex items-center justify-center gap-2 shadow-sm hover:bg-violet-700 active:scale-[0.98]">
                  Studio
                  <mat-icon>videocam</mat-icon>
                </button>

                <button (click)="saveScript()" [disabled]="isSaved()" class="flex-1 py-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 text-black dark:text-white font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 dark:hover:bg-[#2C2C2E] active:scale-[0.98]">
                  {{ isSaved() ? 'Sauvegardé' : 'Sauvegarder' }}
                  <mat-icon>{{ isSaved() ? 'check_circle' : 'save' }}</mat-icon>
                </button>
              }
              
              <button (click)="shareOnWhatsApp(generatedScript())" class="flex-1 py-4 rounded-2xl bg-[#25D366] text-white font-semibold text-lg flex items-center justify-center gap-2 shadow-sm hover:bg-[#20bd5a] active:scale-[0.98]">
                Partager
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
    { id: 1, label: 'Charger' },
    { id: 2, label: 'Configurer' },
    { id: 3, label: 'Générer' }
  ];

  currentStep = signal(1);
  inputType = signal<'url' | 'text'>('url');
  
  sourceUrl = signal('');
  sourceText = signal('');

  intentions = ['Résumer', 'Analyser', 'Critiquer', 'Expliquer', 'Reformuler', 'Débattre'];
  selectedIntention = signal<string | null>(null);

  tones = ['Factuel (Neutre)', 'Punchy (Dynamique)', 'Satyrique', 'Inspirant', 'Analytique', 'Dramatique'];
  selectedTone = signal<string | null>(null);

  stances = ['Objectif', 'Favorable (Élogieux)', 'Défavorable (À charge)'];
  selectedStance = signal<string | null>(null);

  durations = ['30 sec', '1 min', '2 min', '3 min', '5 min'];
  selectedDuration = signal<string | null>(null);

  isGenerating = signal(false);
  generatedScript = signal('');
  isSaving = signal(false);
  
  generationTimer = signal(0);
  timerInterval: ReturnType<typeof setInterval> | undefined;

  isEditing = signal(false);
  generationDate = signal<Date | null>(null);
  viewerUrl = signal<string | null>(null);

  loadingMessages = [
    "Analyse de la source de vos données...",
    "Extraction de l'essence du contenu...",
    "Structuration de la narration du script...",
    "Ajustement du ton professionnel...",
    "Peaufinage du style journalistique...",
    "Finalisation de la rédaction..."
  ];
  delayedMessages = [
    "La génération prend un peu plus de temps que prévu...",
    "Analyses complexes en cours de traitement...",
    "La source est dense, nous redoublons d'efforts...",
    "Votre connexion internet semble peut-être ralentie...",
    "Ne quittez pas, les données sont en cours d'assemblage final..."
  ];
  loadingMessageIndex = signal(0);
  loadingMessageInterval: ReturnType<typeof setInterval> | undefined;

  getCurrentLoadingMessage(): string {
    const time = this.generationTimer();
    if (time > 15) {
      // After 15 seconds, switch to delayed messages, cycling slowly
      const index = Math.floor((time - 15) / 4) % this.delayedMessages.length;
      return this.delayedMessages[index];
    }
    return this.loadingMessages[this.loadingMessageIndex()];
  }

  wordCount = computed(() => {
    const text = this.generatedScript().trim();
    return text ? text.split(/\s+/).length : 0;
  });

  // Ad Carousel Logic
  ads = [
    {
      image: 'https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=1200&auto=format&fit=crop',
      badge: 'Bêta Test',
      title: 'Monétisez votre contenu.',
      description: 'Découvrez notre programme partenariat exclusif pour créateurs ARIAOS.',
      link: '#'
    },
    {
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200&auto=format&fit=crop',
      badge: 'Nouveauté',
      title: 'Export Multi-Formats',
      description: 'Téléchargez vos scripts en PDF, Word, et format Prompteur interactif.',
      link: '#'
    },
    {
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
      badge: 'Analyse',
      title: 'Comprenez l\'audience.',
      description: 'De nouvelles métriques d\'impact disponibles sur vos derniers projets.',
      link: '#'
    }
  ];
  currentAdIndex = signal(0);
  adInterval: ReturnType<typeof setInterval> | undefined;

  recordedGenerationTime = signal<number | null>(null);
  isSaved = signal(false);

  estimatedTime = computed(() => {
    const recorded = this.recordedGenerationTime();
    if (recorded !== null) {
      if (recorded < 60) return `${recorded} sec`;
      const mins = Math.floor(recorded / 60);
      const secs = recorded % 60;
      return `${mins}m ${secs}s`;
    }
    const current = this.generationTimer();
    if (current < 60) return `${current} sec`;
    const mins = Math.floor(current / 60);
    const secs = current % 60;
    return `${mins}m ${secs}s`;
  });

  private geminiService = inject(GeminiService);
  private scriptService = inject(ScriptService);
  private userService = inject(UserService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  public router = inject(Router);

  isAnonymous = computed(() => this.authService.currentUser()?.isAnonymous ?? false);

  generationError = signal<string>('');
  
  private unsubscribeProfile: (() => void) | undefined;

  constructor() {
    // Save preferences on select if not anonymous
    effect(() => {
       const intent = this.selectedIntention();
       const tone = this.selectedTone();
       const stance = this.selectedStance();
       const duration = this.selectedDuration();
       if (!this.isAnonymous() && intent && tone && stance && duration) {
          this.userService.saveUserPreferences({ intention: intent, tone, stance, duration });
       }
    });

    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { scriptToEdit?: ScriptData };
    
    if (state?.scriptToEdit) {
      const script = state.scriptToEdit;
      if (script.sourceUrl) {
        this.inputType.set('url');
        this.sourceUrl.set(script.sourceUrl);
      } else if (script.sourceText) {
        this.inputType.set('text');
        this.sourceText.set(script.sourceText);
      }
      this.selectedIntention.set(script.intention);
      this.selectedTone.set(script.tone);
      if (script.stance) {
        this.selectedStance.set(script.stance);
      }
      this.selectedDuration.set(script.duration);
      this.currentStep.set(2);
    }
  }

  ngOnInit() {
    this.startAdRotation();
    if (!this.isAnonymous()) {
      this.unsubscribeProfile = this.userService.getUserProfileSnapshot(profile => {
        if (profile?.preferences && this.currentStep() < 3) {
           if (profile.preferences.intention) this.selectedIntention.set(profile.preferences.intention);
           if (profile.preferences.tone) this.selectedTone.set(profile.preferences.tone);
           if (profile.preferences.duration) this.selectedDuration.set(profile.preferences.duration);
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
        return 'Cette plateforme vidéo n\'est pas prise en charge. Seul YouTube est compatible.';
      }
      
      return '';
    } catch {
      return 'Veuillez entrer une URL valide (ex: https://...).';
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
      const scriptData: Omit<ScriptData, 'id' | 'userId' | 'createdAt'> = {
        sourceType: 'text',
        intention: this.selectedIntention() ?? 'Résumer',
        tone: this.selectedTone() ?? 'Factuel (Neutre)',
        stance: this.selectedStance() ?? 'Objectif',
        duration: this.selectedDuration() ?? '1 min',
        content: this.generatedScript(),
        reflectionTime: this.recordedGenerationTime() ?? undefined
      };
      
      if (this.inputType() === 'url') {
        scriptData.sourceUrl = this.sourceUrl();
      } else {
        scriptData.sourceText = this.sourceText();
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
    this.selectedIntention.set(null);
    this.selectedTone.set(null);
    this.selectedStance.set(null);
    this.selectedDuration.set(null);
  }

  async loginWithGoogle() {
    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      console.error('Login error', error);
    }
  }
}
