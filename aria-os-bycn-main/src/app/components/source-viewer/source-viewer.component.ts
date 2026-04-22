import { Component, input, output, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
  selector: 'app-source-viewer',
  standalone: true,
  imports: [MatIconModule, SafeUrlPipe],
  template: `
    @if (url()) {
      <div class="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col transition-all duration-200 animate-in fade-in zoom-in-95">
        <!-- Header -->
          <div class="flex items-center justify-between p-4 bg-black text-white border-b border-white/10">
            <div class="flex items-center gap-4 overflow-hidden">
              <span class="font-black tracking-tighter text-2xl">1912</span>
              <div class="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
                <mat-icon class="text-[16px]">{{ isYouTube() ? 'play_circle' : 'article' }}</mat-icon>
                <span class="text-xs font-medium">{{ isYouTube() ? 'Lecteur Vidéo' : 'Navigateur Interne' }}</span>
              </div>
              <p class="text-xs text-gray-400 truncate max-w-[150px] sm:max-w-md ml-2">{{ url() }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <a [href]="url()" target="_blank" class="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center" title="Ouvrir dans un nouvel onglet">
                <mat-icon>open_in_new</mat-icon>
              </a>
              <button (click)="closeViewer.emit()" class="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
          
          <!-- Content -->
          <div class="flex-1 w-full bg-[#0A0A0C] relative">
            @if (embedUrl()) {
              <iframe 
                [src]="embedUrl()! | safeUrl" 
                class="absolute inset-0 w-full h-full border-0"
                title="1912 Source Viewer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen>
              </iframe>
            }
          </div>
        </div>
    }
  `
})
export class SourceViewerComponent {
  url = input<string | null>(null);
  closeViewer = output<void>();

  isYouTube = computed(() => {
    const currentUrl = this.url();
    if (!currentUrl) return false;
    return currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be');
  });

  embedUrl = computed(() => {
    const currentUrl = this.url();
    if (!currentUrl) return null;

    if (this.isYouTube()) {
      const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = currentUrl.match(regExp);
      const id = (match && match[2].length === 11) ? match[2] : null;
      if (id) {
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      }
    }
    return currentUrl;
  });
}
