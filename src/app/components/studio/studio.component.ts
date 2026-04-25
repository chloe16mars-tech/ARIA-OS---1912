import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal, computed, effect, inject, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';

import { VideoService } from '../../services/video.service';
import { ToastService } from '../../services/toast.service';
import { ScriptService, ScriptData } from '../../services/script.service';
import { HapticService } from '../../services/haptic.service';

import { CameraPreviewComponent } from './camera-preview.component';
import { TeleprompterComponent } from './teleprompter.component';
import { RecordingControlsComponent } from './recording-controls.component';
import { ScriptSelectorComponent } from './script-selector.component';
import { StudioSettingsComponent } from './studio-settings.component';

@Component({
  selector: 'app-studio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule, 
    TranslatePipe, 
    CommonModule,
    CameraPreviewComponent,
    TeleprompterComponent,
    RecordingControlsComponent,
    ScriptSelectorComponent,
    StudioSettingsComponent
  ],
  template: `
    <div class="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
      
      <!-- Header Overlay -->
      <div class="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-[50] bg-gradient-to-b from-black/80 to-transparent">
        <button (click)="goBack()" class="px-4 py-2 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-all border border-white/10 gap-2 font-bold text-xs uppercase tracking-wider active:scale-95">
          <mat-icon class="text-[18px]">close</mat-icon> {{ 'studio.actions.quit' | translate }}
        </button>
        
        @if (!isRecording() && !recordedVideoUrl()) {
          <button (click)="isScriptSelectorOpen.set(true)" class="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/5 transition-all flex items-center gap-3 group active:scale-95">
            <div class="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]"></div>
            <span class="text-white/90 font-bold text-xs uppercase tracking-widest truncate max-w-[150px]">{{ scriptTitle() || ('studio.actions.selectScript' | translate) }}</span>
            <mat-icon class="text-[16px] text-white/50 group-hover:text-white transition-colors">expand_more</mat-icon>
          </button>
        }

        <div class="w-10"></div>
      </div>

      <!-- Main Studio View -->
      <div class="relative flex-1 flex items-center justify-center overflow-hidden">
        
        <!-- 1. Camera / Audio Preview -->
        <app-camera-preview 
          [mode]="recordingMode()" 
          [stream]="stream" 
          [hasPermission]="hasCameraPermission()"
          [isRecording]="isRecording()"
          (onRequestPermission)="requestPermissions()"
        />

        <!-- 2. Dark Mask for better text reading -->
        @if (!recordedVideoUrl()) {
          <div class="absolute inset-0 bg-black pointer-events-none z-[5] transition-opacity duration-500" [style.opacity]="maskOpacity()"></div>
        }

        <!-- 3. Teleprompter -->
        @if (!recordedVideoUrl() && scriptContent()) {
          <app-teleprompter 
            [content]="scriptContent()"
            [scrollingSpeed]="scrollSpeed()"
            [autoScroll]="isRecording()"
            [fontSize]="fontSize()"
            [opacity]="0.9"
            (scrollEnded)="onRecordingAutoStop()"
          />
        }

        <!-- 4. Playback for recorded media -->
        @if (recordedVideoUrl()) {
          <div class="absolute inset-0 z-[60] bg-black flex flex-col">
            <video [src]="recordedVideoUrl()" class="w-full h-full object-cover" controls playsinline autoplay></video>
            
            <!-- Post-recording Actions -->
            <div class="absolute bottom-12 left-0 right-0 px-6 flex gap-4 max-w-md mx-auto z-[70]">
              <button (click)="retake()" class="flex-1 py-4 rounded-3xl font-black uppercase tracking-widest text-[11px] bg-white/10 text-white border border-white/10 backdrop-blur-xl hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50" [disabled]="isSaving()">
                {{ 'studio.actions.retake' | translate }}
              </button>
              <button (click)="saveVideoToLibrary()" class="flex-1 py-4 rounded-3xl font-black uppercase tracking-widest text-[11px] bg-violet-600 text-white shadow-xl shadow-violet-500/20 hover:bg-violet-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2" [disabled]="isSaving()">
                @if (isSaving()) {
                  <mat-icon class="animate-spin text-sm">sync</mat-icon> {{ 'studio.actions.saving' | translate }}
                } @else {
                  <mat-icon class="text-sm">check_circle</mat-icon> {{ 'studio.actions.save' | translate }}
                }
              </button>
            </div>
          </div>
        }
      </div>

      <!-- 5. Controls Overlay -->
      @if (!recordedVideoUrl()) {
        <app-recording-controls 
          [isRecording]="isRecording()"
          [formattedTime]="formatTime(recordingTime())"
          [currentMode]="recordingMode()"
          (startRecording)="startRecording()"
          (stopRecording)="stopRecording()"
          (switchMode)="cycleRecordingMode()"
          (toggleSettings)="isSettingsOpen.set(true)"
        />
      }

      <!-- 6. Modals -->
      @if (isScriptSelectorOpen()) {
        <app-script-selector 
          [scripts]="availableScripts()"
          [isLoading]="isLoadingScripts()"
          (select)="onScriptSelected($event)"
          (close)="isScriptSelectorOpen.set(false)"
        />
      }

      @if (isSettingsOpen()) {
        <app-studio-settings 
          [fontSize]="fontSize()"
          [scrollingSpeed]="scrollSpeed()"
          [maskOpacity]="maskOpacity()"
          [textShadow]="textShadowEnabled()"
          (changeFontSize)="adjustFontSize($event)"
          (changeSpeed)="adjustSpeed($event)"
          (changeMask)="adjustMaskOpacity($event)"
          (toggleShadow)="textShadowEnabled.set(!textShadowEnabled())"
          (close)="isSettingsOpen.set(false)"
        />
      }

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
  `]
})
export class StudioComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  
  private router = inject(Router);
  private location = inject(Location);
  private videoService = inject(VideoService);
  private toastService = inject(ToastService);
  private scriptService = inject(ScriptService);
  private hapticService = inject(HapticService);
  private ngZone = inject(NgZone);

  // UI State
  isSettingsOpen = signal(false);
  isScriptSelectorOpen = signal(false);
  isLoadingScripts = signal(false);
  availableScripts = signal<ScriptData[]>([]);

  // Teleprompter State
  scriptContent = signal('');
  scriptTitle = signal('');
  fontSize = signal(28);
  scrollSpeed = signal(1.0);
  maskOpacity = signal(0.5);
  textShadowEnabled = signal(true);

  onRecordingAutoStop() {
    if (this.isRecording()) {
      this.stopRecording();
      this.hapticService.mediumImpact();
    }
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
      // Permission API not fully supported or throws (e.g. Safari)
    }
  }

  ngOnDestroy() {
    this.stopCamera();
    this.stopRecording();
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
    this.hapticService.lightImpact();
    this.location.back();
  }

  openScriptSelector() {
    this.isScriptSelectorOpen.set(true);
    this.isLoadingScripts.set(true);
    this.unsubscribeScripts = this.scriptService.getScriptsSnapshot(scripts => {
      this.availableScripts.set(scripts || []);
      this.isLoadingScripts.set(false);
    });
  }

  onScriptSelected(script: ScriptData) {
    this.hapticService.lightImpact();
    this.fullScriptContent.set(script.content);
    this.scriptContent.set(this.extractVoiceoverText(script.content));
    this.scriptTitle.set("Script - " + script.intention);
    this.isScriptSelectorOpen.set(false);
  }

  async requestPermissions() {
    await this.initCamera();
    if (this.mediaStream) {
      this.hasCameraPermission.set(true);
      this.hapticService.success();
    }
  }

  async initCamera() {
    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
      }

      const mode = this.recordingMode();
      const constraints: MediaStreamConstraints = {
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      };

      if (mode === 'video-front') {
        constraints.video = { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } };
      } else if (mode === 'video-rear') {
        constraints.video = { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } };
      } else {
        constraints.video = false;
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.error("Error accessing camera:", err);
      this.toastService.error("Impossible d'accéder à la caméra ou au microphone.");
      this.hapticService.error();
    }
  }

  cycleRecordingMode() {
    if (this.isRecording()) return;
    this.hapticService.lightImpact();
    const modes: ('video-front' | 'video-rear' | 'audio')[] = ['video-front', 'video-rear', 'audio'];
    const nextIndex = (modes.indexOf(this.recordingMode()) + 1) % modes.length;
    this.recordingMode.set(modes[nextIndex]);
    this.initCamera();
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  async startRecording() {
    if (!this.mediaStream) return;
    await this.hapticService.mediumImpact();
    
    this.recordedChunks = [];
    try {
      const options: MediaRecorderOptions = {
        videoBitsPerSecond: 60000000,
        audioBitsPerSecond: 320000,
      };
      const types = ['video/mp4', 'video/webm;codecs=h264', 'video/webm'];
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          options.mimeType = type;
          break;
        }
      }
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
    } catch (e) {
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
    }

    this.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) this.recordedChunks.push(e.data); };
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: this.recordingMode() === 'audio' ? 'audio/webm' : 'video/webm' });
      this.recordedVideoUrl.set(URL.createObjectURL(blob));
    };

    this.mediaRecorder.start();
    this.isRecording.set(true);
    this.recordingTime.set(0);
    this.timerInterval = setInterval(() => this.recordingTime.update(t => t + 1), 1000);
  }

  async stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording.set(false);
    if (this.timerInterval) clearInterval(this.timerInterval);
    await this.hapticService.mediumImpact();
  }

  retake() {
    this.hapticService.lightImpact();
    if (this.recordedVideoUrl()) {
      URL.revokeObjectURL(this.recordedVideoUrl()!);
      this.recordedVideoUrl.set(null);
    }
  }

  async saveVideoToLibrary() {
    if (!this.recordedChunks.length || this.isSaving()) return;
    this.isSaving.set(true);
    try {
      const blob = new Blob(this.recordedChunks, { type: this.recordingMode() === 'audio' ? 'audio/webm' : 'video/webm' });
      const duration = this.recordingTime();
      const title = this.scriptTitle() !== 'Vidéo sans titre' ? this.scriptTitle() : 'Vidéo du ' + new Date().toLocaleDateString('fr-FR');
      
      await this.videoService.saveVideo(blob, duration, title, this.fullScriptContent(), this.recordingMode() === 'audio' ? 'audio' : 'video');
      await this.hapticService.success();
      this.toastService.success('Média enregistré avec succès');
      this.router.navigate(['/videos']);
    } catch (error) {
      this.hapticService.error();
      this.toastService.error('Erreur lors de la sauvegarde');
    } finally {
      this.isSaving.set(false);
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  adjustFontSize(delta: number) {
    this.hapticService.lightImpact();
    this.fontSize.update(s => Math.max(16, Math.min(72, s + delta)));
  }

  adjustSpeed(delta: number) {
    this.hapticService.lightImpact();
    this.scrollSpeed.update(s => Math.max(0.1, Math.min(5, s + delta * 0.2)));
  }

  adjustMaskOpacity(delta: number) {
    this.hapticService.lightImpact();
    this.maskOpacity.update(o => Math.max(0, Math.min(1, o + delta)));
  }
}
