import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SavedVideo } from '../../services/video.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-video-player-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 bg-gray-950/95 backdrop-blur-3xl z-[150] flex flex-col items-center justify-center p-4 sm:p-10 animate-in fade-in duration-500" 
         (click)="close.emit()" 
         (keydown.escape)="close.emit()">
      
      <!-- Close Button -->
      <button (click)="close.emit()" class="absolute top-8 right-8 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-[160] group">
        <mat-icon class="text-3xl group-rotate-90 transition-transform">close</mat-icon>
      </button>

      <div class="w-full max-w-5xl flex flex-col gap-8 animate-in zoom-in-95 duration-500" (click)="$event.stopPropagation()">
        
        <!-- Video Player -->
        <div class="relative aspect-video bg-black rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.3)] border border-white/10">
          <video [src]="video.url" controls autoplay class="w-full h-full object-contain"></video>
        </div>

        <!-- Info & Actions -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
          <div class="space-y-2">
            <h3 class="text-3xl font-black text-white uppercase tracking-tight">{{ video.title }}</h3>
            <div class="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              <span class="flex items-center gap-2"><mat-icon class="text-lg">schedule</mat-icon> {{ video.date | date:'dd MMM yyyy' }}</span>
              <span class="flex items-center gap-2"><mat-icon class="text-lg">timer</mat-icon> {{ formatDuration(video.duration) }}</span>
            </div>
          </div>

          <div class="flex gap-4 w-full md:w-auto">
            <button (click)="download(video)" class="flex-1 md:flex-none px-8 py-5 rounded-[24px] font-black bg-white text-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-200 transition-all flex items-center justify-center gap-3">
              <mat-icon>download</mat-icon> Télécharger
            </button>
            <button (click)="share.emit()" class="w-16 h-16 rounded-[24px] bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
              <mat-icon>share</mat-icon>
            </button>
          </div>
        </div>

        <!-- Script Preview -->
        @if (video.scriptContent) {
          <div class="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 space-y-6">
            <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">Script Utilisé</h4>
            <p class="text-white/60 text-sm leading-relaxed max-h-48 overflow-y-auto font-medium scrollbar-hide">
              {{ video.scriptContent }}
            </p>
          </div>
        }
      </div>
    </div>
  `
})
export class VideoPlayerModalComponent {
  @Input({ required: true }) video!: SavedVideo;
  @Output() close = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  download(video: SavedVideo) {
    const a = document.createElement('a');
    a.href = video.url;
    a.download = video.title + '.mp4';
    a.click();
  }
}
