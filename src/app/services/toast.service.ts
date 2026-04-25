import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  private idCounter = 0;

  show(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) {
    const id = this.idCounter++;
    this.toasts.update(t => [...t, { id, message, type }]);
    
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(message: string) {
    this.show(message, 'success', 3000);
  }

  error(message: string) {
    this.show(message, 'error', 6000); // Les erreurs restent plus longtemps
  }

  info(message: string) {
    this.show(message, 'info', 4000);
  }

  remove(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
