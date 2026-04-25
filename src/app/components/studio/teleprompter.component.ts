import { Component, ElementRef, Input, ViewChild, signal, effect, OnDestroy, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teleprompter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="absolute inset-x-0 top-20 bottom-32 z-10 flex justify-center pointer-events-none">
      <div class="w-full max-w-2xl px-6 relative">
        <!-- Reading Guide Line -->
        <div class="absolute top-1/3 left-4 right-4 h-0.5 bg-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.6)] z-20"></div>
        
        <div #prompterContainer 
             class="w-full h-full overflow-hidden mask-image-fade pointer-events-auto will-change-scroll" 
             (touchstart)="onUserScroll()" 
             (wheel)="onUserScroll()">
          <div #prompterTextContainer 
               style="transform: translate3d(0, 0, 0); will-change: transform;" 
               class="pt-[30vh] pb-[60vh]">
            <p class="text-white font-bold leading-relaxed whitespace-pre-wrap text-center transition-all duration-300"
               [style.fontSize.px]="fontSize"
               [style.opacity]="opacity"
               [style.textShadow]="'0 2px 8px rgba(0,0,0,0.9)'">
              {{ content }}
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mask-image-fade {
      mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
      -webkit-mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
    }
  `]
})
export class TeleprompterComponent implements OnDestroy, AfterViewInit {
  @ViewChild('prompterContainer') prompterContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('prompterTextContainer') prompterTextContainer?: ElementRef<HTMLDivElement>;

  @Input() content = '';
  @Input() scrollingSpeed = 1; // 0 to 2
  @Input() autoScroll = false;
  @Input() fontSize = 28;
  @Input() opacity = 0.9;

  @Output() scrollEnded = new EventEmitter<void>();

  private scrollPos = 0;
  private animationFrame?: number;

  constructor() {
    effect(() => {
      if (this.autoScroll) {
        this.startScrolling();
      } else {
        this.stopScrolling();
      }
    });
  }

  ngAfterViewInit() {
    if (this.autoScroll) this.startScrolling();
  }

  onUserScroll() {
    this.stopScrolling();
    // Logic to resume or update position could be here
  }

  private startScrolling() {
    if (this.animationFrame) return;

    const animate = () => {
      if (!this.autoScroll || !this.prompterContainer || !this.prompterTextContainer) {
        this.stopScrolling();
        return;
      }

      const containerHeight = this.prompterContainer.nativeElement.clientHeight;
      const textHeight = this.prompterTextContainer.nativeElement.scrollHeight;
      
      // Speed factor: 1.5 pixels per frame at speed 1
      const pixelsPerFrame = 0.5 + (this.scrollingSpeed * 2);
      this.scrollPos += pixelsPerFrame;

      this.prompterContainer.nativeElement.scrollTop = this.scrollPos;

      if (this.scrollPos > textHeight + containerHeight) {
        this.scrollEnded.emit();
        this.stopScrolling();
        return;
      }

      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private stopScrolling() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
  }

  reset() {
    this.scrollPos = 0;
    if (this.prompterContainer) {
      this.prompterContainer.nativeElement.scrollTop = 0;
    }
    this.stopScrolling();
  }

  ngOnDestroy() {
    this.stopScrolling();
  }
}
