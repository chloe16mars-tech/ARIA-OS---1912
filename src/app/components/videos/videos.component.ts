import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VideoService, SavedVideo } from '../../services/video.service';
import { ToastService } from '../../services/toast.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ScriptFormatPipe } from '../../pipes/script-format.pipe';

@Component({
  selector: 'app-videos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, ScriptFormatPipe, TranslatePipe, RouterModule, FormsModule],
  templateUrl: './videos.component.html'
})
export class VideosComponent implements OnInit {
  private videoService = inject(VideoService);
  private toastService = inject(ToastService);
  private languageService = inject(LanguageService);
  private router = inject(Router);

  videos = signal<SavedVideo[]>([]);
  isLoading = signal(true);
  currentTab = signal<'active' | 'trash'>('active');
  selectedScriptContent = signal<string | null>(null);
  
  // Search, Sort and Pagination
  searchQuery = signal('');
  sortBy = signal<'dateDesc' | 'dateAsc' | 'titleAsc' | 'titleDesc'>('dateDesc');
  visibleActiveLimit = signal(5);
  
  // Editing and Playing
  editingTitleId = signal<string | null>(null);
  videoPlayerModal = signal<SavedVideo | null>(null);

  activeVideos = computed(() => this.videos().filter(v => !v.isDeleted));
  trashedVideos = computed(() => this.videos().filter(v => v.isDeleted));

  filteredAndSortedActiveVideos = computed(() => {
    let list = this.activeVideos();
    
    // Search
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(v => 
        v.title.toLowerCase().includes(q) || 
        (v.scriptContent && v.scriptContent.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      // Pinned videos always on top
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      switch(this.sortBy()) {
        case 'dateAsc': return a.date.getTime() - b.date.getTime();
        case 'titleAsc': return a.title.localeCompare(b.title);
        case 'titleDesc': return b.title.localeCompare(a.title);
        case 'dateDesc':
        default:
          return b.date.getTime() - a.date.getTime();
      }
    });

    return list;
  });

  paginatedActiveVideos = computed(() => {
    return this.filteredAndSortedActiveVideos().slice(0, this.visibleActiveLimit());
  });

  hasMoreActiveVideos = computed(() => {
    return this.visibleActiveLimit() < this.filteredAndSortedActiveVideos().length;
  });

  loadMoreActive() {
    this.visibleActiveLimit.update(v => v + 5);
  }

  async ngOnInit() {
    // Avoid double load if already executing
    this.videos.set(await this.videoService.getVideos());
    this.isLoading.set(false);
  }

  async loadVideos() {
    try {
      const vids = await this.videoService.getVideos();
      this.videos.set(vids);
      // Reset limits
      this.visibleActiveLimit.set(5);
    } catch (error) {
      console.error('Error loading videos', error);
      this.toastService.error('Erreur lors du chargement des vidéos');
    } finally {
      this.isLoading.set(false);
    }
  }

  async togglePin(video: SavedVideo) {
    try {
      const newPinnedStatus = !video.pinned;
      await this.videoService.updateVideo(video.id, { pinned: newPinnedStatus });
      this.videos.update(vids => vids.map(v => v.id === video.id ? { ...v, pinned: newPinnedStatus } : v));
      this.toastService.success(newPinnedStatus ? 'Vidéo épinglée' : 'Vidéo désépinglée');
    } catch (error) {
      console.error('Error pinning video', error);
      this.toastService.error('Erreur lors de l\'épinglage');
    }
  }

  startEditingTitle(id: string, event: Event) {
    event.stopPropagation();
    this.editingTitleId.set(id);
  }

  async saveTitle(id: string, newTitle: string) {
    if (!newTitle.trim()) {
      this.editingTitleId.set(null);
      return;
    }
    
    try {
      await this.videoService.updateVideo(id, { title: newTitle.trim() });
      this.videos.update(vids => vids.map(v => v.id === id ? { ...v, title: newTitle.trim() } : v));
      this.editingTitleId.set(null);
      this.toastService.success('Titre modifié');
    } catch (error) {
      console.error('Error updating title', error);
      this.toastService.error('Erreur lors du renommage');
    }
  }

  playVideo(video: SavedVideo) {
    this.videoPlayerModal.set(video);
  }

  closePlayer() {
    this.videoPlayerModal.set(null);
  }

  showScript(content: string) {
    this.selectedScriptContent.set(content);
  }

  closeScript() {
    this.selectedScriptContent.set(null);
  }

  restartStudio(content: string, title: string) {
    this.router.navigate(['/studio'], { state: { scriptContent: content, scriptTitle: title } });
  }

  async moveToTrash(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Voulez-vous déplacer cette vidéo dans la corbeille ?')) {
      try {
        await this.videoService.moveToTrash(id);
        this.videos.update(vids => vids.map(v => v.id === id ? { ...v, isDeleted: true, deletedAt: new Date() } : v));
        this.toastService.success('Vidéo déplacée dans la corbeille');
      } catch (error) {
        console.error('Error moving to trash', error);
        this.toastService.error('Erreur lors de la suppression');
      }
    }
  }

  async restoreVideo(id: string, event: Event) {
    event.stopPropagation();
    try {
      await this.videoService.restoreVideo(id);
      this.videos.update(vids => vids.map(v => v.id === id ? { ...v, isDeleted: false, deletedAt: undefined } : v));
      this.toastService.success('Vidéo restaurée');
    } catch (error) {
      console.error('Error restoring video', error);
      this.toastService.error('Erreur lors de la restauration');
    }
  }

  async permanentlyDeleteVideo(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement cette vidéo ? Cette action est irréversible.')) {
      try {
        await this.videoService.permanentlyDeleteVideo(id);
        this.videos.update(vids => vids.filter(v => v.id !== id));
        this.toastService.success('Vidéo supprimée définitivement');
      } catch (error) {
        console.error('Error permanently deleting video', error);
        this.toastService.error('Erreur lors de la suppression');
      }
    }
  }

  async emptyTrash() {
    if (confirm('Êtes-vous sûr de vouloir vider la corbeille ? Toutes les vidéos seront supprimées définitivement.')) {
      try {
        await this.videoService.emptyTrash();
        this.videos.update(vids => vids.filter(v => !v.isDeleted));
        this.toastService.success('Corbeille vidée');
      } catch (error) {
        console.error('Error emptying trash', error);
        this.toastService.error('Erreur lors du vidage de la corbeille');
      }
    }
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  shareOnWhatsApp() {
    const text = encodeURIComponent(`Regarde la vidéo que j'ai enregistrée avec 1912 !`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    this.toastService.success('Téléchargez la vidéo pour l\'envoyer sur WhatsApp');
  }

  newRecording() {
    this.router.navigate(['/studio']);
  }

  openInStudio(video: SavedVideo) {
    if (video.scriptContent) {
      this.router.navigate(['/studio'], {
        state: {
          scriptContent: video.scriptContent,
          scriptTitle: video.title
        }
      });
    } else {
      this.router.navigate(['/studio']);
    }
  }
}
