import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ScriptData } from '../../services/script.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-script-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div (click)="onCardClick()" 
         class="bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-7 hover:shadow-2xl hover:border-violet-500/30 shadow-sm group animate-in fade-in zoom-in-95 duration-500 flex flex-col relative transition-all active:scale-[0.98]"
         [class.cursor-pointer]="isSelectable">
      
      <!-- Pinned Badge -->
      @if (script.pinned && !isTrashed) {
        <div class="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg z-10 animate-bounce">
          <mat-icon class="text-[16px]">push_pin</mat-icon>
        </div>
      }

      <div class="flex flex-col gap-4 mb-6">
        <div class="flex justify-between items-start gap-4">
          <div class="flex-1 min-w-0">
            <h4 class="font-black text-xl text-gray-900 dark:text-white line-clamp-1 group-hover:text-violet-600 transition-colors tracking-tight">
              {{ script.title || (script.intention + ' - ' + script.tone) }}
            </h4>
            <div class="flex items-center gap-2 mt-2 opacity-60">
              <mat-icon class="text-[14px]">schedule</mat-icon>
              <span class="text-[10px] font-black uppercase tracking-widest">
                {{ (isTrashed ? script.deletedAt : script.createdAt) | date:'dd MMM yyyy' }}
              </span>
            </div>
          </div>
          
          @if (!isTrashed) {
            <button (click)="onPin($event)" 
                    class="p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-violet-600 transition-all"
                    [class.text-violet-600]="script.pinned">
              <mat-icon class="text-[20px]">{{ script.pinned ? 'push_pin' : 'push_pin_outline' }}</mat-icon>
            </button>
          }
        </div>

        <div class="flex flex-wrap gap-2">
          <span class="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-[9px] font-black uppercase tracking-[0.15em] rounded-lg shadow-sm">
            {{ script.intention }}
          </span>
          <span class="px-3 py-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[9px] font-black uppercase tracking-[0.15em] rounded-lg border border-violet-500/20">
            {{ script.tone }}
          </span>
          <span class="px-3 py-1.5 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[9px] font-black uppercase tracking-[0.15em] rounded-lg border border-gray-100 dark:border-white/5 flex items-center gap-1.5">
            <mat-icon class="text-[12px] w-3 h-3">timer</mat-icon> {{ script.duration }}
          </span>
        </div>
      </div>
        
      <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-8 leading-relaxed flex-1 font-medium">
        {{ script.content }}
      </p>
        
      <div class="flex justify-between items-center pt-6 border-t border-gray-50 dark:border-white/5">
        <div class="flex items-center gap-1">
          @if (!isTrashed) {
            <button (click)="onCopy($event)" class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-violet-600 hover:bg-violet-500/10 flex items-center justify-center transition-all">
              <mat-icon class="text-[18px]">content_copy</mat-icon>
            </button>
            <button (click)="onDelete($event)" class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-red-600 hover:bg-red-500/10 flex items-center justify-center transition-all">
              <mat-icon class="text-[18px]">delete_outline</mat-icon>
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
        
        @if (!isTrashed) {
          <div class="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:bg-violet-500 group-hover:text-white transition-all">
            <mat-icon class="text-[16px]">arrow_forward</mat-icon>
          </div>
        }
      </div>
    </div>
  `
})
export class ScriptCardComponent {
  @Input({ required: true }) script!: ScriptData;
  @Input() isTrashed = false;
  @Input() isSelectable = true;

  @Output() pin = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() restore = new EventEmitter<void>();
  @Output() hardDelete = new EventEmitter<void>();
  @Output() select = new EventEmitter<void>();

  onCardClick() {
    if (this.isSelectable && !this.isTrashed) {
      this.select.emit();
    }
  }

  onPin(e: Event) {
    e.stopPropagation();
    this.pin.emit();
  }

  onCopy(e: Event) {
    e.stopPropagation();
    this.copy.emit();
  }

  onDelete(e: Event) {
    e.stopPropagation();
    this.delete.emit();
  }

  onRestore(e: Event) {
    e.stopPropagation();
    this.restore.emit();
  }

  onHardDelete(e: Event) {
    e.stopPropagation();
    this.hardDelete.emit();
  }
}
