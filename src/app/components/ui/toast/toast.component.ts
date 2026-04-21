import { Component, inject } from '@angular/core';
import { ToastService } from '../../../services/toast.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300 mx-auto w-max max-w-full">
          <mat-icon class="text-[20px] w-[20px] h-[20px] shrink-0" 
                    [class.text-green-400]="toast.type === 'success'"
                    [class.text-red-400]="toast.type === 'error'"
                    [class.text-blue-400]="toast.type === 'info'">
            {{ toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info' }}
          </mat-icon>
          <span class="text-sm font-medium truncate">{{ toast.message }}</span>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
