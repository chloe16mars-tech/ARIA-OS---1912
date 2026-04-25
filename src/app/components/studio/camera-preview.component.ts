import { Component, ElementRef, Input, ViewChild, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-camera-preview',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
      <!-- Camera View -->
      @if (mode !== 'audio') {
        <video #videoElement 
               class="absolute inset-0 w-full h-full object-cover transition-all duration-700" 
               [class.transform]="mode === 'video-front'"
               [class.scale-x-[-1]]="mode === 'video-front'"
               autoplay 
               playsinline 
               [muted]="true">
        </video>
      } @else {
        <!-- Audio Mode Visualizer -->
        <div class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
          <div class="w-32 h-32 rounded-full bg-violet-500/20 flex items-center justify-center mb-6" [class.animate-pulse]="isRecording">
            <div class="w-24 h-24 rounded-full bg-violet-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.3)]">
              <mat-icon class="text-white text-5xl">mic</mat-icon>
            </div>
          </div>
          <p class="text-white/50 font-medium tracking-widest uppercase text-xs">{{ 'studio.mode.audio' | translate }}</p>
        </div>
      }

      <!-- Permission Overlay -->
      @if (!hasPermission) {
        <div class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-6">
          <div class="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 flex flex-col items-center max-w-sm text-center shadow-2xl">
            <div class="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mb-6 text-violet-400">
              <mat-icon class="text-4xl text-violet-300">videocam_off</mat-icon>
            </div>
            <h3 class="text-2xl font-bold text-white mb-3">{{ 'studio.permission.title' | translate }}</h3>
            <p class="text-white/60 text-[15px] leading-relaxed mb-8">{{ 'studio.permission.desc' | translate }}</p>
            <button (click)="onRequestPermission()" class="w-full py-4 rounded-2xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-all active:scale-95 flex items-center justify-center gap-2 text-[15px]">
              <mat-icon>sensors</mat-icon> {{ 'studio.permission.activate' | translate }}
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class CameraPreviewComponent implements OnDestroy {
  @ViewChild('videoElement') set videoElement(el: ElementRef<HTMLVideoElement> | undefined) {
    if (el && this.stream) {
      el.nativeElement.srcObject = this.stream;
    }
  }

  @Input() mode: 'video-front' | 'video-back' | 'audio' = 'video-front';
  @Input() stream: MediaStream | null = null;
  @Input() hasPermission = true;
  @Input() isRecording = false;

  onRequestPermission() {
    // This will be emitted to the parent
  }

  ngOnDestroy() {
    // Cleanup is usually handled by parent who owns the stream, 
    // but we ensure video element is cleared
  }
}
