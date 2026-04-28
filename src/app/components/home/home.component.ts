import { Component, signal, computed, OnInit, OnDestroy, inject, effect, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { GeminiService } from '../../services/gemini.service';
import { ScriptService, ScriptData } from '../../services/script.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { HapticService } from '../../services/haptic.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

import { AdCarouselComponent } from '../ui/ad-carousel.component';
import { SourceMarqueeComponent } from '../ui/source-marquee.component';
import { StepIndicatorComponent } from './step-indicator.component';
import { SourceInputComponent } from './source-input.component';
import { ScriptConfigComponent } from './script-config.component';
import { GenerationViewComponent } from './generation-view.component';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    TranslatePipe,
    AdCarouselComponent,
    SourceMarqueeComponent,
    StepIndicatorComponent,
    SourceInputComponent,
    ScriptConfigComponent,
    GenerationViewComponent
  ],
  template: `
    <div class="p-4 max-w-3xl mx-auto space-y-12 pb-32">
      
      <!-- Ad Carousel -->
      <app-ad-carousel></app-ad-carousel>

      <!-- Step Indicator -->
      <app-step-indicator [currentStep]="currentStep()"></app-step-indicator>

      <!-- Step 1: Input -->
      @if (currentStep() === 1) {
        <app-source-input 
          [url]="sourceUrl()"
          [text]="sourceText()"
          [activeType]="activeSourceType()"
          [error]="urlError()"
          [isAnonymous]="isAnonymousUser()"
          (urlChange)="sourceUrl.set($event)"
          (textChange)="sourceText.set($event)"
          (activeTypeChange)="activeSourceType.set($event)"
          (continue)="nextStep()"
        ></app-source-input>
      }

      <!-- Step 2: Config -->
      @if (currentStep() === 2) {
        <app-script-config 
          [intentions]="intentions"
          [tones]="tones"
          [stances]="stances"
          [durations]="durations"
          [selectedIntention]="selectedIntentionKey()"
          [selectedTone]="selectedToneKey()"
          [selectedStance]="selectedStanceKey()"
          [selectedDuration]="selectedDurationKey()"
          [isAnonymous]="isAnonymousUser()"
          (intentionChange)="selectedIntentionKey.set($event)"
          (toneChange)="selectedToneKey.set($event)"
          (stanceChange)="selectedStanceKey.set($event)"
          (durationChange)="selectedDurationKey.set($event)"
          (generate)="generateScript()"
        ></app-script-config>
      }

      <!-- Step 3: Generation & Result -->
      @if (currentStep() === 3) {
        <app-generation-view 
          [isGenerating]="isGenerating()"
          [scriptContent]="scriptResult()"
          (goToStudio)="openInStudio()"
          (reset)="resetAll()"
        ></app-generation-view>
      }

      <!-- Bottom Marquee (Only on step 1) -->
      @if (currentStep() === 1) {
        <app-source-marquee></app-source-marquee>
      }

    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: transparent; }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  private geminiService = inject(GeminiService);
  private scriptService = inject(ScriptService);
  private userService = inject(UserService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private hapticService = inject(HapticService);
  private languageService = inject(LanguageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Core State
  currentStep = signal(1);
  activeSourceType = signal<'url' | 'text'>('url');
  sourceUrl = signal('');
  sourceText = signal('');
  isGenerating = signal(false);
  scriptResult = signal('');
  
  // Config Options
  intentions = [
    { key: 'home.intentions.sum', val: 'Résumer' },
    { key: 'home.intentions.ana', val: 'Analyser' },
    { key: 'home.intentions.crit', val: 'Critiquer' },
    { key: 'home.intentions.expl', val: 'Expliquer' },
    { key: 'home.intentions.reph', val: 'Reformuler' },
    { key: 'home.intentions.deb', val: 'Débattre' }
  ];
  tones = [
    { key: 'home.tones.fact', val: 'Factuel (Neutre)' },
    { key: 'home.tones.punchy', val: 'Punchy (Dynamique)' },
    { key: 'home.tones.sat', val: 'Satyrique' },
    { key: 'home.tones.insp', val: 'Inspirant' },
    { key: 'home.tones.ana', val: 'Analytique' },
    { key: 'home.tones.drama', val: 'Dramatique' }
  ];
  stances = [
    { key: 'home.stances.obj', val: 'Objectif' },
    { key: 'home.stances.fav', val: 'Favorable (Élogieux)' },
    { key: 'home.stances.unfav', val: 'Défavorable (À charge)' }
  ];
  durations = [
    { key: 'home.durations.30s', val: '30 sec' },
    { key: 'home.durations.1m', val: '1 min' },
    { key: 'home.durations.2m', val: '2 min' },
    { key: 'home.durations.3m', val: '3 min' },
    { key: 'home.durations.5m', val: '5 min' }
  ];

  // Config Selections
  selectedIntentionKey = signal<string | null>('home.intentions.sum');
  selectedToneKey = signal<string | null>('home.tones.fact');
  selectedStanceKey = signal<string | null>('home.stances.obj');
  selectedDurationKey = signal<string | null>('home.durations.1m');

  isAnonymousUser = computed(() => this.authService.isAnonymous());

  urlError = computed(() => {
    if (this.activeSourceType() !== 'url') return '';
    const url = this.sourceUrl().trim();
    if (!url) return '';
    try {
      new URL(url);
      const forbidden = ['tiktok.com', 'vimeo.com', 'instagram.com', 'dailymotion.com', 'twitch.tv'];
      if (forbidden.some(d => url.includes(d))) {
        return this.languageService.translate('home.source.errorUnsupported');
      }
      return '';
    } catch {
      return this.languageService.translate('home.source.errorInvalid');
    }
  });

  private unsubscribeProfile?: () => void;

  constructor() {
    // Save preferences effect
    effect(() => {
       const intent = this.selectedIntentionKey();
       const tone = this.selectedToneKey();
       const stance = this.selectedStanceKey();
       const duration = this.selectedDurationKey();
       
       if (!this.isAnonymousUser() && intent && tone && stance && duration) {
          this.userService.saveUserPreferences({ intention: intent, tone, stance, duration });
       }
    });

    // Handle navigation state (edit script)
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras.state as { scriptToEdit?: ScriptData };
    if (state?.scriptToEdit) {
      this.loadScriptToEdit(state.scriptToEdit);
    }
  }

  async ngOnInit() {
    if (!this.isAnonymousUser()) {
      this.unsubscribeProfile = this.userService.getUserProfileSnapshot(profile => {
        if (profile?.preferences && this.currentStep() < 3) {
           const p = profile.preferences;
           if (p.intention) this.selectedIntentionKey.set(p.intention);
           if (p.tone) this.selectedToneKey.set(p.tone);
           if (p.stance) this.selectedStanceKey.set(p.stance);
           if (p.duration) this.selectedDurationKey.set(p.duration);
        }
      });
    }
  }

  ngOnDestroy() {
    this.unsubscribeProfile?.();
  }

  private loadScriptToEdit(script: ScriptData) {
    if (script.sourceUrl) {
      this.sourceUrl.set(script.sourceUrl);
      this.activeSourceType.set('url');
    }
    if (script.sourceText) {
      this.sourceText.set(script.sourceText);
      if (!script.sourceUrl) this.activeSourceType.set('text');
    }
    this.selectedIntentionKey.set(this.intentions.find(i => i.val === script.intention)?.key || null);
    this.selectedToneKey.set(this.tones.find(t => t.val === script.tone)?.key || null);
    this.selectedStanceKey.set(this.stances.find(s => s.val === script.stance)?.key || null);
    this.selectedDurationKey.set(this.durations.find(d => d.val === script.duration)?.key || null);
    this.currentStep.set(2);
  }

  nextStep() {
    this.hapticService.mediumImpact();
    this.currentStep.update(s => s + 1);
    this.cdr.detectChanges();
  }

  async generateScript() {
    this.hapticService.mediumImpact();
    this.currentStep.set(3);
    this.isGenerating.set(true);
    this.scriptResult.set('');
    this.cdr.detectChanges();

    try {
      const intent = this.intentions.find(i => i.key === this.selectedIntentionKey())?.val || 'Résumer';
      const tone = this.tones.find(t => t.key === this.selectedToneKey())?.val || 'Factuel (Neutre)';
      const stance = this.stances.find(s => s.key === this.selectedStanceKey())?.val || 'Objectif';
      const duration = this.durations.find(d => d.key === this.selectedDurationKey())?.val || '1 min';

      const isUrl = this.activeSourceType() === 'url';
      await this.geminiService.analyzeAndGenerateScript(
        isUrl ? this.sourceUrl() : undefined,
        !isUrl ? this.sourceText() : undefined,
        intent,
        tone,
        stance,
        duration,
        (chunk) => {
          if (!this.scriptResult()) this.hapticService.lightImpact();
          this.scriptResult.set(chunk);
          this.cdr.detectChanges();
        }
      );
      this.hapticService.success();
      this.cdr.detectChanges();
    } catch (e: any) {
      this.hapticService.error();
      const msg = e?.message || "Erreur lors de la génération. Veuillez réessayer.";
      this.toastService.show(msg, "error");
      this.currentStep.set(2);
      this.cdr.detectChanges();
    } finally {
      this.isGenerating.set(false);
      this.cdr.detectChanges();
    }
  }

  openInStudio() {
    this.hapticService.mediumImpact();
    const title = (this.selectedIntentionKey() ? this.languageService.translate(this.selectedIntentionKey()!) : 'Script') + ' Aria';
    this.router.navigate(['/studio'], { 
      state: { 
        scriptContent: this.scriptResult(), 
        scriptTitle: title 
      } 
    });
  }

  resetAll() {
    this.hapticService.lightImpact();
    this.currentStep.set(1);
    this.scriptResult.set('');
    this.sourceUrl.set('');
    this.sourceText.set('');
  }
}
