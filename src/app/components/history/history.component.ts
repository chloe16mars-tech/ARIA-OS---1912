import { Component, OnInit, OnDestroy, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { ScriptService, ScriptData } from '../../services/script.service';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ScriptFormatPipe } from '../../pipes/script-format.pipe';
import { SourceViewerComponent } from '../source-viewer/source-viewer.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DatePipe, ScriptFormatPipe, SourceViewerComponent, FormsModule],
  templateUrl: './history.component.html'
})
export class HistoryComponent implements OnInit, OnDestroy {
  private scriptService = inject(ScriptService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  activeScripts = signal<ScriptData[]>([]);
  trashedScripts = signal<ScriptData[]>([]);
  loading = signal(true);
  
  currentTab = signal<'active' | 'trash'>('active');
  searchQuery = signal('');
  sortBy = signal<'dateDesc' | 'dateAsc' | 'titleAsc' | 'titleDesc'>('dateDesc');

  selectedScript = signal<ScriptData | null>(null);
  scriptToDelete = signal<string | null>(null);
  scriptToHardDelete = signal<string | null>(null);
  viewerUrl = signal<string | null>(null);
  editingTitleId = signal<string | null>(null);
  unsubscribeActive?: () => void;
  unsubscribeTrash?: () => void;

  filteredAndSortedScripts = computed(() => {
    let list = this.currentTab() === 'active' ? this.activeScripts() : this.trashedScripts();
    
    // Sort
    list.sort((a, b) => {
      // Pinned on top
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      const timeA = a.createdAt?.toMillis() || 0;
      const timeB = b.createdAt?.toMillis() || 0;
      const titleA = (a.title || a.intention + ' ' + a.tone).toLowerCase();
      const titleB = (b.title || b.intention + ' ' + b.tone).toLowerCase();

      switch (this.sortBy()) {
        case 'dateAsc': return timeA - timeB;
        case 'titleAsc': return titleA.localeCompare(titleB);
        case 'titleDesc': return titleB.localeCompare(titleA);
        case 'dateDesc':
        default: return timeB - timeA;
      }
    });

    // Search
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter(s => 
        (s.title && s.title.toLowerCase().includes(query)) ||
        s.intention.toLowerCase().includes(query) || 
        s.tone.toLowerCase().includes(query) || 
        s.content.toLowerCase().includes(query)
      );
    }
    
    return list;
  });

  ngOnInit() {
    this.unsubscribeActive = this.scriptService.getScriptsSnapshot((data) => {
      this.activeScripts.set(data);
      this.loading.set(false);
    });
    this.unsubscribeTrash = this.scriptService.getTrashedScriptsSnapshot((data) => {
      this.trashedScripts.set(data);
    });
  }

  ngOnDestroy() {
    if (this.unsubscribeActive) {
      this.unsubscribeActive();
    }
    if (this.unsubscribeTrash) {
      this.unsubscribeTrash();
    }
  }

  async togglePin(script: ScriptData, event: Event) {
    event.stopPropagation();
    if (!script.id) return;
    try {
      const newPinnedStatus = !script.pinned;
      await this.scriptService.updateScript(script.id, { pinned: newPinnedStatus });
      this.toastService.success(newPinnedStatus ? 'Script épinglé' : 'Script désépinglé');
    } catch (error) {
      console.error('Error pinning script', error);
      this.toastService.error('Erreur lors de l\'épinglage');
    }
  }

  startEditingTitle(id: string | undefined, event: Event) {
    event.stopPropagation();
    if (id) {
       this.editingTitleId.set(id);
    }
  }

  async saveTitle(id: string | undefined, newTitle: string) {
    if (!id) return;
    
    if (!newTitle.trim()) {
      this.editingTitleId.set(null);
      return;
    }
    
    try {
      await this.scriptService.updateScript(id, { title: newTitle.trim() });
      this.editingTitleId.set(null);
      this.toastService.success('Titre modifié');
    } catch (error) {
      console.error('Error updating title', error);
      this.toastService.error('Erreur lors du renommage');
    }
  }

  openScript(script: ScriptData) {
    this.selectedScript.set(script);
  }

  closeScript() {
    this.selectedScript.set(null);
  }

  editScript(script: ScriptData) {
    this.router.navigate(['/'], { state: { scriptToEdit: script } });
  }

  goToStudio(script: ScriptData) {
    const title = `${script.intention} - ${script.tone}`;
    this.router.navigate(['/studio'], { state: { scriptContent: script.content, scriptTitle: title } });
  }

  confirmDelete(id: string, event: Event) {
    event.stopPropagation();
    this.scriptToDelete.set(id);
  }

  cancelDelete() {
    this.scriptToDelete.set(null);
  }

  async executeDelete() {
    const id = this.scriptToDelete();
    if (!id) return;
    
    try {
      await this.scriptService.moveToTrash(id);
      if (this.selectedScript()?.id === id) {
        this.closeScript();
      }
      this.scriptToDelete.set(null);
    } catch (error) {
      console.error('Error deleting script', error);
    }
  }

  confirmHardDelete(id: string, event: Event) {
    event.stopPropagation();
    this.scriptToHardDelete.set(id);
  }

  cancelHardDelete() {
    this.scriptToHardDelete.set(null);
  }

  async executeHardDelete() {
    const id = this.scriptToHardDelete();
    if (!id) return;
    
    try {
      await this.scriptService.deleteScript(id);
      if (this.selectedScript()?.id === id) {
        this.closeScript();
      }
      this.scriptToHardDelete.set(null);
    } catch (error) {
      console.error('Error hard deleting script', error);
    }
  }

  async restoreScript(id: string, event: Event) {
    event.stopPropagation();
    try {
      await this.scriptService.restoreScript(id);
      this.toastService.success('Script restauré.');
    } catch (error) {
      console.error('Error restoring script', error);
    }
  }

  copy(content: string, event: Event) {
    event.stopPropagation();
    navigator.clipboard.writeText(content).then(() => {
      this.toastService.success('Script copié dans le presse-papiers !');
    }).catch(() => {
      this.toastService.error('Erreur lors de la copie du script.');
    });
  }

  shareOnWhatsApp(content: string, event: Event) {
    event.stopPropagation();
    const encodedText = encodeURIComponent(content);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  }
}
