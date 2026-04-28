import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface Step {
  id: number;
  label: string;
}

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex justify-center gap-12 sm:gap-16 items-center px-4 py-8 relative">
      <!-- Connection Lines -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-6 w-1/2 h-[2px] bg-gray-100 dark:bg-gray-800 hidden sm:block"></div>
      
      @for (step of steps; track step.id) {
        <div class="flex flex-col items-center gap-3 relative z-10 w-24">
          <div class="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 shadow-sm"
               [class.bg-black]="currentStep >= step.id"
               [class.dark:bg-white]="currentStep >= step.id"
               [class.text-white]="currentStep >= step.id"
               [class.dark:text-black]="currentStep >= step.id"
               [class.scale-110]="currentStep === step.id"
               [class.ring-4]="currentStep === step.id"
               [class.ring-violet-500/20]="currentStep === step.id"
               [class.bg-white]="currentStep < step.id"
               [class.dark:bg-[#1C1C1E]]="currentStep < step.id"
               [class.border-2]="currentStep < step.id"
               [class.border-gray-100]="currentStep < step.id"
               [class.dark:border-gray-800]="currentStep < step.id"
               [class.text-gray-300]="currentStep < step.id">
            
            @if (currentStep > step.id) {
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
            } @else {
              {{ step.id }}
            }
          </div>
          <span class="text-[10px] font-bold text-center"
                [class.text-black]="currentStep >= step.id"
                [class.dark:text-white]="currentStep >= step.id"
                [class.text-gray-400]="currentStep < step.id">
            {{ step.label | translate }}
          </span>
        </div>
      }
    </div>
  `
})
export class StepIndicatorComponent {
  @Input() steps: Step[] = [
    { id: 1, label: 'home.steps.load' },
    { id: 2, label: 'home.steps.config' },
    { id: 3, label: 'home.steps.generate' }
  ];
  @Input() currentStep = 1;
}
