import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-recording-controls',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col items-center gap-6 z-40">
      
      <!-- Secondary Actions Row -->
      <div class="flex items-center gap-8 mb-2">
        <button (click)="toggleSettings.emit()" 
                class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition-all active:scale-90">
          <mat-icon>settings</mat-icon>
        </button>

        <button (click)="switchMode.emit()" 
                [disabled]="isRecording"
                class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none">
          <mat-icon>{{ modeIcon }}</mat-icon>
        </button>
      </div>

      <!-- Main Record Button & Timer -->
      <div class="flex flex-col items-center gap-4">
        <div class="relative flex items-center justify-center">
          <!-- Ripple Effect when recording -->
          @if (isRecording) {
            <div class="absolute inset-0 rounded-full bg-red-500/30 animate-ping"></div>
          }
          
          <button (click)="isRecording ? stopRecording.emit() : startRecording.emit()"
                  class="relative w-20 h-20 rounded-full flex items-center justify-center border-4 border-white transition-all duration-300 active:scale-95"
                  [class.bg-red-500]="isRecording"
                  [class.bg-white]="!isRecording">
            @if (isRecording) {
              <div class="w-8 h-8 bg-white rounded-md"></div>
            } @else {
              <div class="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                 <div class="w-6 h-6 rounded-full bg-white/20"></div>
              </div>
            }
          </button>
        </div>

        @if (isRecording) {
           <span class="text-white font-mono font-black text-xl tracking-tighter drop-shadow-md">{{ formattedTime }}</span>
        } @else {
           <span class="text-white/60 font-bold text-xs uppercase tracking-[0.2em]">{{ 'studio.actions.ready' | translate }}</span>
        }
      </div>
    </div>
  `
})
export class RecordingControlsComponent {
  @Input() isRecording = false;
  @Input() formattedTime = '00:00';
  @Input() currentMode: 'video-front' | 'video-back' | 'audio' = 'video-front';

  @Output() startRecording = new EventEmitter<void>();
  @Output() stopRecording = new EventEmitter<void>();
  @Output() switchMode = new EventEmitter<void>();
  @Output() toggleSettings = new EventEmitter<void>();

  get modeIcon(): string {
    switch (this.currentMode) {
      case 'video-front': return 'cameraswitch';
      case 'video-back': return 'videocam';
      case 'audio': return 'mic';
      default: return 'videocam';
    }
  }
}
