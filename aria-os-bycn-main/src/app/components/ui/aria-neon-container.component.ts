import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-aria-neon-container',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    @keyframes aria-spin {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
    .aria-input-glow-container {
      position: relative;
      border-radius: 1rem;
      padding: 2px;
      z-index: 1;
    }
    .aria-input-glow-container::before {
      content: "";
      position: absolute;
      top: 50%; left: 50%;
      width: 300%;
      aspect-ratio: 1;
      transform: translate(-50%, -50%);
      background: conic-gradient(
        from 0deg, 
        transparent 0deg, 
        transparent 90deg, 
        #ef4444 140deg, /* Red */
        #f97316 190deg, /* Orange */
        #eab308 240deg, /* Yellow */
        #22c55e 300deg, /* Green */
        transparent 360deg
      );
      animation: aria-spin 4s linear infinite;
      will-change: transform;
      z-index: -1;
    }
    .aria-input-glow-container::after {
      content: "";
      position: absolute;
      top: 50%; left: 50%;
      width: 300%;
      aspect-ratio: 1;
      transform: translate(-50%, -50%);
      background: conic-gradient(
        from 0deg, 
        transparent 0deg, 
        transparent 90deg, 
        #ef4444 140deg,
        #f97316 190deg,
        #eab308 240deg,
        #22c55e 300deg,
        transparent 360deg
      );
      animation: aria-spin 4s linear infinite;
      will-change: transform;
      filter: blur(12px);
      z-index: -2;
      opacity: 0.8;
    }
    .aria-input-inner {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: calc(1rem - 2px);
      z-index: 10;
    }
  `],
  template: `
    <div class="aria-input-glow-container" [ngClass]="containerClass">
      <div class="aria-input-inner" [ngClass]="innerClass">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class AriaNeonContainerComponent {
  @Input() containerClass = '';
  @Input() innerClass = '';
}
