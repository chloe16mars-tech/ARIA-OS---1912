import { Component, ElementRef, OnDestroy, OnInit, ViewChild, signal, computed, inject, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Location } from '@angular/common';
import { VideoService } from '../../services/video.service';
import { ToastService } from '../../services/toast.service';
import { ScriptService, ScriptData } from '../../services/script.service';

@Component({
  selector: 'app-studio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="fixed inset-0 bg-black z-50 flex flex-col">
      <!-- Header -->
      <div class="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-40 bg-gradient-to-b from-black/80 to-transparent">
        <button (click)="goBack()" class="px-4 py-2 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors border border-white/10 gap-2 font-medium text-sm">
          <mat-icon class="text-[18px]">close</mat-icon> Quitter
        </button>
        
        @if (isRecording()) {
          <div class="px-4 py-1.5 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/50 flex items-center gap-2">
            <div class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
            <span class="text-red-500 font-mono font-bold text-sm">{{ formatTime(recordingTime()) }}</span>
          </div>
        } @else {
          <button (click)="openScriptSelector()" class="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/5 transition-colors flex items-center gap-2 group">
            <span class="text-white/90 font-medium text-sm truncate max-w-[200px]">{{ scriptContent() ? 'Studio : ' + scriptTitle() : 'Sélectionner un script' }}</span>
            <mat-icon class="text-[16px] text-white/50 group-hover:text-white/90 transition-colors">arrow_drop_down</mat-icon>
          </button>
        }
        
        <div class="w-[100px]"></div> <!-- Spacer for centering -->
      </div>

      <!-- Main View Area -->
      <div class="relative flex-1 bg-black overflow-hidden flex items-center justify-center">

        <!-- Permission Overlay -->
        @if (!hasCameraPermission()) {
          <div class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black">
            <div class="bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-white/10 flex flex-col items-center max-w-sm text-center shadow-2xl">
              <div class="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mb-6 text-violet-400">
                <mat-icon class="text-4xl text-violet-300">videocam</mat-icon>
              </div>
              <h3 class="text-2xl font-bold text-white mb-3">Autorisation requise</h3>
              <p class="text-white/60 text-[15px] leading-relaxed mb-8">Pour filmer ou enregistrer votre voix, vous devez autoriser l'accès à votre caméra et votre microphone.</p>
              <button (click)="requestPermissions()" class="w-full py-4 rounded-2xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 text-[15px]">
                <mat-icon>power_settings_new</mat-icon> Activer la caméra
              </button>
            </div>
          </div>
        }
        
        <!-- Video Preview (Camera) -->
        @if (recordingMode() !== 'audio') {
          <video #videoElement 
                 class="absolute inset-0 w-full h-full object-cover" 
                 [class.transform]="recordingMode() === 'video-front'"
                 [class.scale-x-[-1]]="recordingMode() === 'video-front'"
                 autoplay 
                 playsinline 
                 [muted]="true">
          </video>
        } @else {
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
            <div class="w-32 h-32 rounded-full bg-violet-500/20 flex items-center justify-center mb-6" [class.animate-pulse]="isRecording()">
              <div class="w-24 h-24 rounded-full bg-violet-500/40 flex items-center justify-center">
                <mat-icon class="text-white text-5xl">mic</mat-icon>
              </div>
            </div>
            <p class="text-white/50 font-medium tracking-widest uppercase text-sm">Mode Audio Uniquement</p>
          </div>
        }

        <!-- Overlay Mask -->
        <div class="absolute inset-0 bg-black pointer-events-none z-[5]" [style.opacity]="maskOpacity()"></div>

        <!-- Recorded Video Playback -->
        @if (recordedVideoUrl()) {
          <video [src]="recordedVideoUrl()" 
                 class="absolute inset-0 w-full h-full object-cover z-10" 
                 controls 
                 playsinline>
          </video>
        }

        <!-- Teleprompter Overlay -->
        @if (!recordedVideoUrl() && scriptContent()) {
          <div class="absolute inset-x-0 top-20 bottom-32 z-10 flex justify-center pointer-events-none">
            <div class="w-full max-w-2xl px-6 relative">
              <!-- Reading Guide Line -->
              <div class="absolute top-1/3 left-4 right-4 h-0.5 bg-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.5)] z-20"></div>
              
              <div #prompterContainer class="w-full h-full overflow-hidden mask-image-fade pointer-events-auto will-change-scroll" (touchstart)="onPrompterScroll()" (wheel)="onPrompterScroll()">
                <div #prompterTextContainer style="transform: translate3d(0, 0, 0); will-change: transform;" class="pt-[30vh] pb-[50vh]">
                  <p class="text-white font-bold leading-relaxed whitespace-pre-wrap text-center"
                     [style.textShadow]="textShadowEnabled() ? '0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)' : 'none'"
                     [style.fontSize.px]="fontSize()">
                    {{ scriptContent() }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Controls Footer -->
      <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
        
        @if (recordedVideoUrl()) {
          <!-- Post-Recording Controls -->
          <div class="flex items-center justify-center gap-4 max-w-md mx-auto">
            <button (click)="retake()" class="flex-1 py-3.5 rounded-2xl font-semibold bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-colors disabled:opacity-50" [disabled]="isSaving()">
              Recommencer
            </button>
            <button (click)="saveVideoToLibrary()" class="flex-1 py-3.5 rounded-2xl font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors text-center flex items-center justify-center gap-2 disabled:opacity-50" [disabled]="isSaving()">
              @if (isSaving()) {
                <mat-icon class="animate-spin">sync</mat-icon> Sauvegarde...
              } @else {
                <mat-icon>save</mat-icon> Enregistrer
              }
            </button>
          </div>
        } @else {
          <!-- Teleprompter & Recording Controls -->
          <div class="max-w-md mx-auto space-y-6">
            
            <!-- Teleprompter Settings -->
            @if (scriptContent()) {
              <div class="flex flex-col gap-2 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <button (click)="adjustFontSize(-2)" class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors">
                      <mat-icon class="text-[18px]">text_decrease</mat-icon>
                    </button>
                    <div class="flex flex-col items-center justify-center w-12">
                      <span class="text-white/50 text-[10px] uppercase font-bold tracking-wider">Taille</span>
                      <span class="text-white font-mono text-sm font-bold">{{ fontSize() }}</span>
                    </div>
                    <button (click)="adjustFontSize(2)" class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors">
                      <mat-icon class="text-[18px]">text_increase</mat-icon>
                    </button>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <button (click)="adjustSpeed(-0.5)" class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors">
                      <mat-icon class="text-[18px]">remove</mat-icon>
                    </button>
                    <div class="flex flex-col items-center justify-center w-12">
                      <span class="text-white/50 text-[10px] uppercase font-bold tracking-wider">Vitesse</span>
                      <span class="text-white font-mono text-sm font-bold">x{{ scrollSpeed() }}</span>
                    </div>
                    <button (click)="adjustSpeed(0.5)" class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors">
                      <mat-icon class="text-[18px]">add</mat-icon>
                    </button>
                  </div>
                </div>
                
                <div class="flex items-center justify-between pt-2 border-t border-white/10">
                  <div class="flex items-center gap-2">
                    <button (click)="adjustMaskOpacity(-0.1)" class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors">
                      <mat-icon class="text-[18px]">brightness_low</mat-icon>
                    </button>
                    <div class="flex flex-col items-center justify-center w-12">
                      <span class="text-white/50 text-[10px] uppercase font-bold tracking-wider">Masque</span>
                      <span class="text-white font-mono text-sm font-bold">{{ (maskOpacity() * 100).toFixed(0) }}%</span>
                    </div>
                    <button (click)="adjustMaskOpacity(0.1)" class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors">
                      <mat-icon class="text-[18px]">brightness_high</mat-icon>
                    </button>
                  </div>

                  <button (click)="textShadowEnabled.set(!textShadowEnabled())" 
                          class="px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
                          [class.bg-white]="textShadowEnabled()" [class.text-black]="textShadowEnabled()"
                          [class.bg-white/5]="!textShadowEnabled()" [class.text-white]="!textShadowEnabled()">
                    <mat-icon class="text-[18px]">{{ textShadowEnabled() ? 'format_color_text' : 'format_color_reset' }}</mat-icon>
                    Ombre
                  </button>
                </div>
              </div>
            }

            <!-- Main Actions -->
            <div class="flex items-center justify-center gap-6">
              @if (!isRecording()) {
                <div class="absolute left-6 flex gap-2">
                  <button (click)="setRecordingMode('video-front')" [class.bg-white]="recordingMode() === 'video-front'" [class.text-black]="recordingMode() === 'video-front'" [class.bg-white/10]="recordingMode() !== 'video-front'" [class.text-white]="recordingMode() !== 'video-front'" class="w-10 h-10 rounded-full hover:bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10" title="Caméra Frontale">
                    <mat-icon class="text-[20px]">camera_front</mat-icon>
                  </button>
                  <button (click)="setRecordingMode('video-rear')" [class.bg-white]="recordingMode() === 'video-rear'" [class.text-black]="recordingMode() === 'video-rear'" [class.bg-white/10]="recordingMode() !== 'video-rear'" [class.text-white]="recordingMode() !== 'video-rear'" class="w-10 h-10 rounded-full hover:bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10" title="Caméra Arrière">
                    <mat-icon class="text-[20px]">camera_rear</mat-icon>
                  </button>
                  <button (click)="setRecordingMode('audio')" [class.bg-white]="recordingMode() === 'audio'" [class.text-black]="recordingMode() === 'audio'" [class.bg-white/10]="recordingMode() !== 'audio'" [class.text-white]="recordingMode() !== 'audio'" class="w-10 h-10 rounded-full hover:bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10" title="Audio Uniquement">
                    <mat-icon class="text-[20px]">mic</mat-icon>
                  </button>
                </div>
              }

              @if (scriptContent()) {
                <button (click)="togglePrompter()" class="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors border border-white/10">
                  <mat-icon>{{ isPrompterPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
                </button>
              }
              
              <button (click)="toggleRecording()" 
                      class="w-20 h-20 rounded-full border-4 flex items-center justify-center"
                      [class.border-white]="!isRecording()"
                      [class.border-red-500]="isRecording()">
                <div class="bg-red-500"
                     [class.w-14]="!isRecording()"
                     [class.h-14]="!isRecording()"
                     [class.rounded-full]="!isRecording()"
                     [class.w-8]="isRecording()"
                     [class.h-8]="isRecording()"
                     [class.rounded-lg]="isRecording()">
                </div>
              </button>
              
              @if (scriptContent()) {
                <button (click)="resetPrompter()" class="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                  <mat-icon>restart_alt</mat-icon>
                </button>
              }
            </div>
          </div>
        }
        @if (!recordedVideoUrl() && !scriptContent() && !showScriptSelector()) {
          <div class="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-auto">
             <div class="bg-black/60 backdrop-blur-lg p-8 rounded-[32px] border border-white/10 flex flex-col items-center max-w-sm text-center shadow-2xl">
               <div class="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mb-6 text-violet-400">
                  <mat-icon class="text-4xl text-violet-300">article</mat-icon>
               </div>
               <h3 class="text-2xl font-bold text-white mb-3">Aucun script actif</h3>
               <p class="text-white/60 text-[15px] leading-relaxed mb-8">Ajoutez un script généré au prompteur pour faciliter votre enregistrement et améliorer votre élocution.</p>
               <button (click)="openScriptSelector()" class="w-full py-4 rounded-2xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 text-[15px]">
                 <mat-icon>format_list_bulleted</mat-icon> Parcourir mes scripts
               </button>
             </div>
          </div>
        }
      </div>

      <!-- Script Selector Overlay -->
      @if (showScriptSelector()) {
        <div class="absolute inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex flex-col pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <div class="p-6 flex items-center justify-between border-b border-white/10 shrink-0">
            <h2 class="text-xl md:text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
              <mat-icon class="text-violet-400">text_snippet</mat-icon>
              Sélectionner un script
            </h2>
            <button (click)="closeScriptSelector()" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-colors">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3">
            @if (isLoadingScripts()) {
               <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 @for (i of [1,2,3,4,5,6]; track i) {
                   <div class="h-32 rounded-2xl bg-white/5 animate-pulse border border-white/5"></div>
                 }
               </div>
            } @else if (scripts().length === 0) {
               <div class="flex flex-col items-center justify-center h-full text-center">
                  <div class="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <mat-icon class="text-5xl text-white/20">note_add</mat-icon>
                  </div>
                  <h3 class="text-xl font-bold text-white mb-2">Aucun script disponible</h3>
                  <p class="text-white/50 text-sm mb-8 max-w-sm">Vous n'avez pas encore généré de script.</p>
                  <button (click)="goToHome()" class="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2">
                    <mat-icon>auto_awesome</mat-icon> Créer un script
                  </button>
               </div>
            } @else {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (script of paginatedScripts(); track script.id) {
                  <button (click)="selectScript(script)" class="text-left w-full p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/50 transition-all group relative overflow-hidden flex flex-col h-[140px]">
                    <div class="flex items-center gap-3 text-white/50 text-[11px] font-semibold tracking-wider uppercase mb-3 shrink-0">
                      <span class="flex items-center gap-1.5"><mat-icon class="text-[14px]">psychology</mat-icon><span class="truncate">{{ script.intention }}</span></span>
                      <span class="w-1 h-1 rounded-full bg-white/20 shrink-0"></span>
                      <span class="flex items-center gap-1.5"><mat-icon class="text-[14px]">timer</mat-icon>{{ script.duration }}</span>
                    </div>
                    <p class="text-white/90 text-[13px] line-clamp-3 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity whitespace-pre-wrap">
                      {{ getScriptPreview(script) }}
                    </p>
                  </button>
                }
              </div>
              
              @if (hasMoreScripts()) {
                <div class="flex justify-center mt-6 mb-2">
                  <button (click)="loadMoreScripts()" class="px-6 py-2.5 bg-white/10 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors shadow-sm text-white">
                    Charger plus de scripts
                  </button>
                </div>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .mask-image-fade {
      mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
      -webkit-mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
    }
    .will-change-scroll {
      will-change: scroll-position;
    }
  `]
})
export class StudioComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('prompterContainer') prompterContainer!: ElementRef<HTMLDivElement>;

  @ViewChild('prompterTextContainer') prompterTextContainer!: ElementRef<HTMLDivElement>;

  private router = inject(Router);
  private location = inject(Location);
  private ngZone = inject(NgZone);
  private videoService = inject(VideoService);
  private toastService = inject(ToastService);
  private scriptService = inject(ScriptService);

  showScriptSelector = signal(false);
  scripts = signal<ScriptData[]>([]);
  paginatedScripts = computed(() => this.scripts().slice(0, this.visibleScriptsLimit()));
  hasMoreScripts = computed(() => this.visibleScriptsLimit() < this.scripts().length);
  visibleScriptsLimit = signal(10);
  isLoadingScripts = signal(false);
  private unsubscribeScripts: (() => void) | undefined;

  scriptContent = signal<string>('');
  fullScriptContent = signal<string>('');
  scriptTitle = signal<string>('Vidéo sans titre');
  
  // Camera & Recording
  hasCameraPermission = signal<boolean>(false);
  recordingMode = signal<'video-front' | 'video-rear' | 'audio'>('video-front');
  mediaStream: MediaStream | null = null;
  mediaRecorder: MediaRecorder | null = null;
  recordedChunks: Blob[] = [];
  recordedVideoUrl = signal<string | null>(null);
  isRecording = signal(false);
  recordingTime = signal(0);
  isSaving = signal(false);
  private timerInterval: ReturnType<typeof setInterval> | undefined;

  // Teleprompter
  fontSize = signal(32);
  scrollSpeed = signal(1); // pixels per frame
  isPrompterPlaying = signal(false);
  maskOpacity = signal(0.5);
  textShadowEnabled = signal(true);
  private animationFrameId: number | null = null;
  private offsetScroll = 0;

  constructor() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      if (nav.extras.state['scriptContent']) {
        this.fullScriptContent.set(nav.extras.state['scriptContent']);
        this.scriptContent.set(this.extractVoiceoverText(nav.extras.state['scriptContent']));
      }
      if (nav.extras.state['scriptTitle']) {
        this.scriptTitle.set(nav.extras.state['scriptTitle']);
      }
    }
  }

  extractVoiceoverText(script: string): string {
    if (!script) return '';
    
    // 1. Structured output extraction for <script_pro>
    const match = script.match(/<script_pro>([\s\S]*?)<\/script_pro>/i);
    if (match && match[1]) {
      let text = match[1].trim();
      text = text.replace(/([.?!])\s+(?=[A-ZÀ-Ÿ"«])/g, '$1\n\n');
      return text;
    }
    
    let text = script;

    // 1. Isolate the script part (between "SCRIPT VOIX OFF" and "Conseils" or "***")
    const scriptStartRegex = /###\s*🎙️\s*SCRIPT VOIX OFF.*?\n/i;
    const scriptStartMatch = text.match(scriptStartRegex);
    if (scriptStartMatch) {
      text = text.substring(scriptStartMatch.index! + scriptStartMatch[0].length);
    }

    // Find the end of the script (either the *** separator or the Conseils section)
    const tipsRegex = /\*\*\*[\s\n]*\*\*💡\s*Conseils/i;
    const tipsMatch = text.match(tipsRegex) || text.match(/\*\*💡\s*Conseils/i) || text.match(/\*\*\*/);
    if (tipsMatch) {
      text = text.substring(0, tipsMatch.index);
    }

    // 2. Remove stage directions: lines starting with *( or containing *(...)*
    text = text.replace(/^\s*\*\([^)]+\)\*\s*$/gm, ''); // full line stage directions
    text = text.replace(/\*\([^)]+\)\*/g, ''); // inline stage directions

    // 3. Remove section headers like **1. Accroche (Hook)**
    text = text.replace(/^\s*\*\*\d+\..*?\*\*\s*$/gm, '');

    // 4. Remove guillemets « and » and "
    text = text.replace(/[«»"]/g, '');

    // 5. Remove markdown bold/italic
    text = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');

    // 6. Clean up empty lines and trim
    text = text.trim().replace(/\s+/g, ' ');

    // 7. Split into sentences and add double spacing for better readability
    // Matches punctuation (. ? !) followed by space and a capital letter or quote
    text = text.replace(/([.?!])\s+(?=[A-ZÀ-Ÿ"«])/g, '$1\n\n');

    return text;
  }

  async ngOnInit() {
    try {
      const cameraStatus = await navigator.permissions.query({ name: 'camera' as any });
      const micStatus = await navigator.permissions.query({ name: 'microphone' as any });
      if (cameraStatus.state === 'granted' && micStatus.state === 'granted') {
        this.hasCameraPermission.set(true);
        this.initCamera();
      }
    } catch(e) {
      // Permission API not fully supported or throws (e.g. Safari), 
      // do nothing and let user click the button.
    }
  }

  ngOnDestroy() {
    this.stopCamera();
    this.stopRecording();
    this.stopPrompter();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.recordedVideoUrl()) {
      URL.revokeObjectURL(this.recordedVideoUrl()!);
    }
    if (this.unsubscribeScripts) {
      this.unsubscribeScripts();
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  openScriptSelector() {
    this.showScriptSelector.set(true);
    this.isLoadingScripts.set(true);
    this.visibleScriptsLimit.set(10);
    this.unsubscribeScripts = this.scriptService.getScriptsSnapshot(scripts => {
      this.scripts.set(scripts || []);
      this.isLoadingScripts.set(false);
    });
  }

  loadMoreScripts() {
    this.visibleScriptsLimit.update(v => v + 10);
  }

  closeScriptSelector() {
    this.showScriptSelector.set(false);
    if (this.unsubscribeScripts) {
      this.unsubscribeScripts();
      this.unsubscribeScripts = undefined;
    }
  }

  selectScript(script: ScriptData) {
    this.fullScriptContent.set(script.content);
    this.scriptContent.set(this.extractVoiceoverText(script.content));
    this.scriptTitle.set("Script - " + script.intention);
    this.closeScriptSelector();
    this.resetPrompter();
  }

  getScriptPreview(script: ScriptData): string {
    const text = this.extractVoiceoverText(script.content);
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  goToHome() {
    this.closeScriptSelector();
    this.router.navigate(['/']);
  }

  async requestPermissions() {
    await this.initCamera();
    if (this.mediaStream) {
      this.hasCameraPermission.set(true);
    }
  }

  async initCamera() {
    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
      }

      const mode = this.recordingMode();
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      };

      if (mode === 'video-front') {
        constraints.video = { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } };
      } else if (mode === 'video-rear') {
        constraints.video = { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } };
      } else {
        constraints.video = false;
      }

      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        // Fallback if environment/front camera or resolution fails (common on desktops)
        if (mode !== 'audio') {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: constraints.audio });
          this.toastService.info("Caméra spécifique introuvable, basculement sur la caméra par défaut.");
        } else {
          throw e;
        }
      }
      
      if (this.videoElement && this.videoElement.nativeElement && mode !== 'audio') {
        // Force le mute programmatiquement pour éviter tout retour audio (Larsen)
        this.videoElement.nativeElement.muted = true;
        this.videoElement.nativeElement.volume = 0;
        this.videoElement.nativeElement.srcObject = this.mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      this.toastService.error("Impossible d'accéder à la caméra ou au microphone.");
    }
  }

  setRecordingMode(mode: 'video-front' | 'video-rear' | 'audio') {
    if (this.isRecording()) return;
    this.recordingMode.set(mode);
    this.initCamera();
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  toggleRecording() {
    if (this.isRecording()) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    if (!this.mediaStream) return;
    
    this.recordedChunks = [];
    
    try {
      const options: MediaRecorderOptions = {
        videoBitsPerSecond: 60000000, // 60 Mbps
        audioBitsPerSecond: 320000,   // 320 kbps (High quality audio)
      };

      // Try to find the best supported codec
      const types = [
        'video/mp4',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];

      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          options.mimeType = type;
          break;
        }
      }
        
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
    } catch (e) {
      console.warn("Failed to initialize MediaRecorder with high quality options, falling back to default", e);
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: this.recordingMode() === 'audio' ? 'audio/webm' : 'video/webm' });
      const url = URL.createObjectURL(blob);
      this.recordedVideoUrl.set(url);
    };

    this.mediaRecorder.start();
    this.isRecording.set(true);
    this.recordingTime.set(0);
    
    this.timerInterval = setInterval(() => {
      this.recordingTime.update(t => t + 1);
    }, 1000);

    // Auto-start prompter when recording starts
    if (this.scriptContent() && !this.isPrompterPlaying()) {
      this.togglePrompter();
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording.set(false);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.stopPrompter();
  }

  retake() {
    if (this.recordedVideoUrl()) {
      URL.revokeObjectURL(this.recordedVideoUrl()!);
      this.recordedVideoUrl.set(null);
    }
    this.resetPrompter();
  }

  async saveVideoToLibrary() {
    if (!this.recordedChunks.length || this.isSaving()) return;
    
    this.isSaving.set(true);
    try {
      const blob = new Blob(this.recordedChunks, { type: this.recordingMode() === 'audio' ? 'audio/webm' : 'video/webm' });
      const duration = this.recordingTime();
      const title = this.scriptTitle() !== 'Vidéo sans titre' ? this.scriptTitle() : 'Vidéo du ' + new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      
      await this.videoService.saveVideo(blob, duration, title, this.fullScriptContent(), this.recordingMode() === 'audio' ? 'audio' : 'video');
      this.toastService.success('Vidéo enregistrée dans "Mes Vidéos"');
      this.router.navigate(['/videos']);
    } catch (error) {
      console.error('Error saving video:', error);
      this.toastService.error('Erreur lors de la sauvegarde de la vidéo');
    } finally {
      this.isSaving.set(false);
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Teleprompter Logic
  togglePrompter() {
    this.isPrompterPlaying.update(v => !v);
    if (this.isPrompterPlaying()) {
      this.scrollPrompter();
    } else {
      this.stopPrompter();
    }
  }

  stopPrompter() {
    this.isPrompterPlaying.set(false);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  scrollPrompter() {
    if (!this.isPrompterPlaying() || !this.prompterContainer || !this.prompterTextContainer) return;
    
    this.ngZone.runOutsideAngular(() => {
      const step = () => {
        if (!this.isPrompterPlaying()) return;
        
        const containerHeight = this.prompterContainer.nativeElement.clientHeight;
        const textHeight = this.prompterTextContainer.nativeElement.scrollHeight;
        const maxScroll = textHeight - containerHeight;

        this.offsetScroll += this.scrollSpeed();
        
        // Stop if reached bottom
        if (this.offsetScroll >= maxScroll - 10) {
          this.offsetScroll = maxScroll;
          this.prompterTextContainer.nativeElement.style.transform = `translate3d(0, -${this.offsetScroll}px, 0)`;
          this.ngZone.run(() => {
            this.stopPrompter();
          });
          return;
        }

        // Apply fast GPU translation
        this.prompterTextContainer.nativeElement.style.transform = `translate3d(0, -${this.offsetScroll}px, 0)`;

        this.animationFrameId = requestAnimationFrame(step);
      };
      this.animationFrameId = requestAnimationFrame(step);
    });
  }

  resetPrompter() {
    this.stopPrompter();
    this.offsetScroll = 0;
    if (this.prompterTextContainer) {
      this.prompterTextContainer.nativeElement.style.transform = `translate3d(0, 0, 0)`;
    }
  }

  adjustFontSize(delta: number) {
    this.fontSize.update(s => Math.max(16, Math.min(72, s + delta)));
  }

  adjustSpeed(delta: number) {
    this.scrollSpeed.update(s => Math.max(0.5, Math.min(5, s + delta * 0.5)));
  }

  adjustMaskOpacity(delta: number) {
    this.maskOpacity.update(o => Math.max(0, Math.min(1, o + delta)));
  }

  onPrompterScroll() {
    // If user manually scrolls, pause auto-scroll
    // This is a bit tricky to implement perfectly without interfering with auto-scroll,
    // so we'll keep it simple for now.
  }
}
