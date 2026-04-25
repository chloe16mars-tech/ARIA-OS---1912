import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SavedVideo } from '../../services/video.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-video-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div (click)="play.emit()" 
         class="bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-violet-500/30 shadow-sm group animate-in fade-in zoom-in-95 duration-500 flex flex-col relative transition-all active:scale-[0.98] cursor-pointer">
      
      <!-- Video Preview / Placeholder -->
      <div class="relative aspect-video bg-gray-900 overflow-hidden">
        <div class="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-900 to-black">
          <mat-icon class="text-4xl text-white/20">videocam</mat-icon>
          <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">ARIA Media</span>
        </div>
        
        <!-- Play Overlay -->
        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
          <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 scale-75 group-hover:scale-100 transition-transform duration-500">
            <mat-icon class="text-3xl ml-1">play_arrow</mat-icon>
          </div>
        </div>

        <!-- Duration Badge -->
        <div class="absolute bottom-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-black rounded-lg border border-white/10">
          {{ formatDuration(video.duration) }}
        </div>
      </div>

      <!-- Info Section -->
      <div class="p-6 space-y-4">
        <div class="flex justify-between items-start gap-4">
          <div class="flex-1 min-w-0">
            <h4 class="font-black text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-violet-600 transition-colors tracking-tight">
              {{ video.title }}
            </h4>
            <div class="flex items-center gap-2 mt-1 opacity-60">
              <span class="text-[10px] font-black uppercase tracking-widest text-gray-500">
                {{ video.date | date:'dd MMM yyyy' }}
              </span>
            </div>
          </div>
          
          @if (!isTrashed) {
            <button (click)="onPin($event)" 
                    class="p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-violet-600 transition-all"
                    [class.text-violet-600]="video.pinned">
              <mat-icon class="text-[20px]">{{ video.pinned ? 'push_pin' : 'push_pin_outline' }}</mat-icon>
            </button>
          }
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-white/5">
          <div class="flex items-center gap-1">
            @if (!isTrashed) {
              <button (click)="onDelete($event)" class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-red-600 hover:bg-red-500/10 flex items-center justify-center transition-all">
                <mat-icon class="text-[18px]">delete_outline</mat-icon>
              </button>
              <button (click)="onStudio($event)" class="px-4 py-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-violet-500/20 transition-all">
                <mat-icon class="text-[16px]">auto_awesome</mat-icon> Studio
              </button>
            } @else {
              <button (click)="onRestore($event)" class="px-4 py-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-green-500/20 transition-all">
                <mat-icon class="text-[16px]">restore</mat-icon> Restaurer
              </button>
              <button (click)="onHardDelete($event)" class="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-all">
                <mat-icon class="text-[18px]">delete_forever</mat-icon>
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .group-rotate-90:hover { transform: rotate(90deg); }
  `]
})
export class VideoCardComponent {
  @Input({ required: true }) video!: SavedVideo;
  @Input() isTrashed = false;

  @Output() pin = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() restore = new EventEmitter<void>();
  @Output() hardDelete = new EventEmitter<void>();
  @Output() play = new EventEmitter<void>();
  @Output() studio = new EventEmitter<void>();

  onPin(e: Event) { e.stopPropagation(); this.pin.emit(); }
  onDelete(e: Event) { e.stopPropagation(); this.delete.emit(); }
  onRestore(e: Event) { e.stopPropagation(); this.restore.emit(); }
  onHardDelete(e: Event) { e.stopPropagation(); this.hardDelete.emit(); }
  onStudio(e: Event) { e.stopPropagation(); this.studio.emit(); }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
