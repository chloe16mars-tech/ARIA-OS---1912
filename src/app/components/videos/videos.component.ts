import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { VideoService, SavedVideo } from '../../services/video.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { HapticService } from '../../services/haptic.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

import { VideoCardComponent } from './video-card.component';
import { VideoPlayerModalComponent } from './video-player-modal.component';

@Component({
  selector: 'app-videos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    MatIconModule, 
    TranslatePipe, 
    RouterModule, 
    FormsModule,
    VideoCardComponent,
    VideoPlayerModalComponent
  ],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mt-4">
        <div class="space-y-3">
          <h2 class="text-5xl font-black tracking-tighter text-gray-900 dark:text-white uppercase">{{ 'videos.title' | translate }}</h2>
          <p class="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em]">{{ 'videos.desc' | translate }}</p>
        </div>

        <div class="flex bg-gray-100 dark:bg-black/40 p-1.5 rounded-[20px] border border-gray-100 dark:border-white/5 shadow-inner shrink-0">
          <button (click)="setTab('active')" 
                  class="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300"
                  [class.bg-white]="currentTab() === 'active'"
                  [class.dark:bg-white/10]="currentTab() === 'active'"
                  [class.shadow-xl]="currentTab() === 'active'"
                  [class.text-violet-600]="currentTab() === 'active'"
                  [class.text-gray-400]="currentTab() !== 'active'">
            Galerie ({{ activeVideos().length }})
          </button>
          <button (click)="setTab('trash')" 
                  class="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300"
                  [class.bg-white]="currentTab() === 'trash'"
                  [class.dark:bg-white/10]="currentTab() === 'trash'"
                  [class.shadow-xl]="currentTab() === 'trash'"
                  [class.text-red-500]="currentTab() === 'trash'"
                  [class.text-gray-400]="currentTab() !== 'trash'">
            Corbeille ({{ trashedVideos().length }})
          </button>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1 group">
          <mat-icon class="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors">search</mat-icon>
          <input 
            type="text" 
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            [placeholder]="'videos.search' | translate" 
            class="w-full pl-16 pr-8 py-5 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold text-gray-900 dark:text-white"
          >
        </div>
        <div class="relative group">
          <select 
            [ngModel]="sortBy()"
            (ngModelChange)="sortBy.set($event)"
            class="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5 rounded-3xl text-xs font-black uppercase tracking-widest pl-6 pr-14 py-5 outline-none focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none h-full text-gray-900 dark:text-white min-w-[220px]"
          >
            <option value="dateDesc">{{ 'history.sort.recent' | translate }}</option>
            <option value="dateAsc">{{ 'history.sort.old' | translate }}</option>
            <option value="titleAsc">{{ 'history.sort.az' | translate }}</option>
            <option value="titleDesc">{{ 'history.sort.za' | translate }}</option>
          </select>
          <mat-icon class="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</mat-icon>
        </div>
      </div>

      <!-- Grid -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="h-80 rounded-[3rem] bg-gray-100 dark:bg-white/5 animate-pulse border border-gray-100 dark:border-white/5"></div>
          }
        </div>
      } @else if (filteredAndSortedVideos().length === 0) {
        <div class="bg-white dark:bg-[#1C1C1E] rounded-[4rem] p-32 text-center border border-gray-100 dark:border-white/5 shadow-2xl animate-in fade-in zoom-in-95 duration-700">
          <div class="w-28 h-28 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-10">
            <mat-icon class="text-6xl text-violet-500">video_library</mat-icon>
          </div>
          <h3 class="text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tighter">{{ 'videos.empty' | translate }}</h3>
          <p class="text-sm font-bold text-gray-400 uppercase tracking-[0.3em] max-w-sm mx-auto">{{ 'videos.emptyDesc' | translate }}</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (video of filteredAndSortedVideos(); track video.id) {
            <app-video-card 
              [video]="video"
              [isTrashed]="currentTab() === 'trash'"
              (play)="playVideo(video)"
              (pin)="togglePin(video)"
              (delete)="moveToTrash(video)"
              (restore)="restoreVideo(video)"
              (hardDelete)="permanentlyDelete(video)"
              (studio)="openInStudio(video)"
            />
          }
        </div>
      }

      <!-- Empty Trash Button -->
      @if (currentTab() === 'trash' && trashedVideos().length > 0) {
        <div class="flex justify-center pt-8">
          <button (click)="emptyTrash()" class="px-10 py-5 rounded-[24px] bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-red-500/30 hover:bg-red-700 active:scale-95 transition-all">
            {{ 'videos.emptyTrash' | translate }}
          </button>
        </div>
      }

    </div>

    <!-- Video Player -->
    @if (videoPlayerModal()) {
      <app-video-player-modal 
        [video]="videoPlayerModal()!"
        (close)="videoPlayerModal.set(null)"
        (share)="shareVideo(videoPlayerModal()!)"
      />
    }
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: transparent; }
  `]
})
export class VideosComponent implements OnInit {
  private videoService = inject(VideoService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private hapticService = inject(HapticService);
  private router = inject(Router);

  videos = signal<SavedVideo[]>([]);
  isLoading = signal(true);
  currentTab = signal<'active' | 'trash'>('active');
  
  searchQuery = signal('');
  sortBy = signal<'dateDesc' | 'dateAsc' | 'titleAsc' | 'titleDesc'>('dateDesc');
  
  videoPlayerModal = signal<SavedVideo | null>(null);

  activeVideos = computed(() => this.videos().filter(v => !v.isDeleted));
  trashedVideos = computed(() => this.videos().filter(v => v.isDeleted));

  filteredAndSortedVideos = computed(() => {
    let list = this.currentTab() === 'active' ? [...this.activeVideos()] : [...this.trashedVideos()];
    
    // Search
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(v => v.title.toLowerCase().includes(q) || (v.scriptContent && v.scriptContent.toLowerCase().includes(q)));
    }

    // Sort
    list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      switch(this.sortBy()) {
        case 'dateAsc': return a.date.getTime() - b.date.getTime();
        case 'titleAsc': return a.title.localeCompare(b.title);
        case 'titleDesc': return b.title.localeCompare(a.title);
        case 'dateDesc':
        default: return b.date.getTime() - a.date.getTime();
      }
    });

    return list;
  });

  async ngOnInit() {
    // Wait for auth session to be fully loaded
    await this.authService.waitForAuthReady();
    await this.loadVideos();
  }

  async loadVideos() {
    this.isLoading.set(true);
    try {
      const vids = await this.videoService.getVideos();
      this.videos.set(vids);
    } finally {
      this.isLoading.set(false);
    }
  }

  setTab(tab: 'active' | 'trash') {
    this.hapticService.lightImpact();
    this.currentTab.set(tab);
  }

  playVideo(video: SavedVideo) {
    this.hapticService.mediumImpact();
    this.videoPlayerModal.set(video);
  }

  async togglePin(video: SavedVideo) {
    this.hapticService.mediumImpact();
    try {
      const status = !video.pinned;
      await this.videoService.updateVideo(video.id, { pinned: status });
      this.videos.update(vids => vids.map(v => v.id === video.id ? { ...v, pinned: status } : v));
      this.toastService.success(status ? 'Vidéo épinglée' : 'Vidéo désépinglée');
    } catch (e) {
      this.hapticService.error();
    }
  }

  async moveToTrash(video: SavedVideo) {
    this.hapticService.mediumImpact();
    try {
      await this.videoService.moveToTrash(video.id);
      this.videos.update(vids => vids.map(v => v.id === video.id ? { ...v, isDeleted: true, deletedAt: new Date() } : v));
      this.toastService.success('Vidéo déplacée dans la corbeille');
      this.hapticService.success();
    } catch (e) {
      this.hapticService.error();
    }
  }

  async restoreVideo(video: SavedVideo) {
    this.hapticService.mediumImpact();
    try {
      await this.videoService.restoreVideo(video.id);
      this.videos.update(vids => vids.map(v => v.id === video.id ? { ...v, isDeleted: false, deletedAt: undefined } : v));
      this.toastService.success('Vidéo restaurée');
      this.hapticService.success();
    } catch (e) {
      this.hapticService.error();
    }
  }

  async permanentlyDelete(video: SavedVideo) {
    this.hapticService.mediumImpact();
    if (confirm('Supprimer définitivement cette vidéo ?')) {
      try {
        await this.videoService.permanentlyDeleteVideo(video.id);
        this.videos.update(vids => vids.filter(v => v.id !== video.id));
        this.hapticService.success();
      } catch (e) {
        this.hapticService.error();
      }
    }
  }

  async emptyTrash() {
    this.hapticService.mediumImpact();
    if (confirm('Vider la corbeille ?')) {
      try {
        await this.videoService.emptyTrash();
        this.videos.update(vids => vids.filter(v => !v.isDeleted));
        this.hapticService.success();
      } catch (e) {
        this.hapticService.error();
      }
    }
  }

  openInStudio(video: SavedVideo) {
    this.hapticService.mediumImpact();
    this.router.navigate(['/studio'], {
      state: {
        scriptContent: video.scriptContent,
        scriptTitle: video.title
      }
    });
  }

  shareVideo(_video: SavedVideo) {
    this.hapticService.lightImpact();
    const text = encodeURIComponent(`Regarde ma vidéo enregistrée sur ARIA-OS !`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }
}
