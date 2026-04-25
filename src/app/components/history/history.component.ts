import { Component, OnInit, OnDestroy, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { ScriptService, ScriptData } from '../../services/script.service';
import { ToastService } from '../../services/toast.service';
import { HapticService } from '../../services/haptic.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

import { ScriptCardComponent } from './script-card.component';
import { ScriptDetailsModalComponent } from './script-details-modal.component';
import { SourceViewerComponent } from '../source-viewer/source-viewer.component';

@Component({
  selector: 'app-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    TranslatePipe,
    ScriptCardComponent,
    ScriptDetailsModalComponent,
    SourceViewerComponent
  ],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
      
      <!-- Header Area -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mt-4">
        <div class="space-y-3">
          <h2 class="text-4xl font-black tracking-tighter text-gray-900 dark:text-white uppercase">{{ 'history.title' | translate }}</h2>
          <p class="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">{{ 'history.desc' | translate }}</p>
        </div>

        <!-- Tabs Switcher -->
        <div class="flex bg-gray-100 dark:bg-black/40 p-1.5 rounded-[20px] border border-gray-100 dark:border-white/5 shadow-inner">
          <button (click)="setTab('active')" 
                  class="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300"
                  [class.bg-white]="currentTab() === 'active'"
                  [class.dark:bg-white/10]="currentTab() === 'active'"
                  [class.shadow-xl]="currentTab() === 'active'"
                  [class.text-violet-600]="currentTab() === 'active'"
                  [class.text-gray-400]="currentTab() !== 'active'">
            Active ({{ activeScripts().length }})
          </button>
          <button (click)="setTab('trash')" 
                  class="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2"
                  [class.bg-white]="currentTab() === 'trash'"
                  [class.dark:bg-white/10]="currentTab() === 'trash'"
                  [class.shadow-xl]="currentTab() === 'trash'"
                  [class.text-red-500]="currentTab() === 'trash'"
                  [class.text-gray-400]="currentTab() !== 'trash'">
            Corbeille ({{ trashedScripts().length }})
          </button>
        </div>
      </div>

      <!-- Search & Sort Bar -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1 group">
          <mat-icon class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors">search</mat-icon>
          <input 
            type="text" 
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            [placeholder]="'history.search' | translate" 
            class="w-full pl-14 pr-6 py-4 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold text-gray-900 dark:text-white"
          >
        </div>
        <div class="relative group">
          <select 
            [ngModel]="sortBy()"
            (ngModelChange)="sortBy.set($event)"
            class="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest pl-5 pr-12 py-4 outline-none focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none h-full text-gray-900 dark:text-white min-w-[180px]"
          >
            <option value="dateDesc">{{ 'history.sort.recent' | translate }}</option>
            <option value="dateAsc">{{ 'history.sort.old' | translate }}</option>
            <option value="titleAsc">{{ 'history.sort.az' | translate }}</option>
            <option value="titleDesc">{{ 'history.sort.za' | translate }}</option>
          </select>
          <mat-icon class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</mat-icon>
        </div>
      </div>

      <!-- Scripts Grid -->
      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="h-64 rounded-[2.5rem] bg-gray-100 dark:bg-white/5 animate-pulse border border-gray-100 dark:border-white/5"></div>
          }
        </div>
      } @else if (filteredAndSortedScripts().length === 0) {
        <div class="bg-white dark:bg-[#1C1C1E] rounded-[3rem] p-20 text-center border border-gray-100 dark:border-white/5 shadow-2xl mt-8 animate-in fade-in zoom-in-95 duration-500">
          <div class="w-24 h-24 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <mat-icon class="text-5xl text-violet-500">{{ currentTab() === 'trash' ? 'delete_sweep' : 'history' }}</mat-icon>
          </div>
          <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-3 uppercase tracking-tight">
            {{ (searchQuery() ? 'history.noResults' : 'history.empty') | translate }}
          </h3>
          <p class="text-sm font-bold text-gray-400 uppercase tracking-widest max-w-sm mx-auto">
            {{ (searchQuery() ? 'history.searchEmptyDesc' : 'history.emptyDesc') | translate }}
          </p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          @for (script of filteredAndSortedScripts(); track script.id) {
            <app-script-card 
              [script]="script"
              [isTrashed]="currentTab() === 'trash'"
              (select)="openScript(script)"
              (pin)="togglePin(script)"
              (copy)="copyScript(script)"
              (delete)="confirmDelete(script)"
              (restore)="restoreScript(script)"
              (hardDelete)="confirmHardDelete(script)"
            />
          }
        </div>
      }
    </div>

    <!-- Modals -->
    @if (selectedScript()) {
      <app-script-details-modal 
        [script]="selectedScript()!"
        (close)="closeScript()"
        (edit)="editScript(selectedScript()!)"
        (goToStudio)="goToStudio(selectedScript()!)"
      />
    }

    <!-- Soft Delete Confirm -->
    @if (scriptToDelete()) {
      <div class="fixed inset-0 bg-gray-950/80 backdrop-blur-xl z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300" (click)="scriptToDelete.set(null)">
        <div class="bg-white dark:bg-[#111] rounded-[3rem] p-10 text-center space-y-8 max-w-md border border-white/5 shadow-2xl animate-in zoom-in-95 duration-300" (click)="$event.stopPropagation()">
          <div class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <mat-icon class="text-4xl">delete_outline</mat-icon>
          </div>
          <div class="space-y-2">
            <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ 'history.trash.confirmTitle' | translate }}</h3>
            <p class="text-sm font-bold text-gray-400 uppercase tracking-widest">{{ 'history.trash.confirmDesc' | translate }}</p>
          </div>
          <div class="flex gap-4">
            <button (click)="scriptToDelete.set(null)" class="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-gray-100 dark:bg-white/5 text-gray-500">{{ 'common.cancel' | translate }}</button>
            <button (click)="executeDelete()" class="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-red-600 text-white shadow-xl shadow-red-500/20">{{ 'common.confirm' | translate }}</button>
          </div>
        </div>
      </div>
    }

    <!-- Hard Delete Confirm -->
    @if (scriptToHardDelete()) {
      <div class="fixed inset-0 bg-gray-950/90 backdrop-blur-2xl z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300" (click)="scriptToHardDelete.set(null)">
        <div class="bg-white dark:bg-[#111] rounded-[3rem] p-10 text-center space-y-8 max-w-md border border-red-500/20 shadow-2xl animate-in zoom-in-95 duration-300" (click)="$event.stopPropagation()">
          <div class="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center mx-auto text-red-600">
            <mat-icon class="text-5xl">delete_forever</mat-icon>
          </div>
          <div class="space-y-2">
            <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ 'history.trash.hardConfirmTitle' | translate }}</h3>
            <p class="text-sm font-bold text-gray-400 uppercase tracking-widest">{{ 'history.trash.hardConfirmDesc' | translate }}</p>
          </div>
          <div class="flex gap-4">
            <button (click)="scriptToHardDelete.set(null)" class="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-gray-100 dark:bg-white/5 text-gray-500">{{ 'common.cancel' | translate }}</button>
            <button (click)="executeHardDelete()" class="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-red-600 text-white shadow-xl shadow-red-500/40">{{ 'history.actions.delete' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: transparent; }
  `]
})
export class HistoryComponent implements OnInit, OnDestroy {
  private scriptService = inject(ScriptService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private hapticService = inject(HapticService);
  public languageService = inject(LanguageService);

  activeScripts = signal<ScriptData[]>([]);
  trashedScripts = signal<ScriptData[]>([]);
  loading = signal(true);
  
  currentTab = signal<'active' | 'trash'>('active');
  searchQuery = signal('');
  sortBy = signal<'dateDesc' | 'dateAsc' | 'titleAsc' | 'titleDesc'>('dateDesc');

  selectedScript = signal<ScriptData | null>(null);
  scriptToDelete = signal<ScriptData | null>(null);
  scriptToHardDelete = signal<ScriptData | null>(null);
  
  private unsubscribeActive?: () => void;
  private unsubscribeTrash?: () => void;

  filteredAndSortedScripts = computed(() => {
    let list = this.currentTab() === 'active' ? [...this.activeScripts()] : [...this.trashedScripts()];
    
    // Sort
    list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
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
    this.unsubscribeActive?.();
    this.unsubscribeTrash?.();
  }

  setTab(tab: 'active' | 'trash') {
    this.hapticService.lightImpact();
    this.currentTab.set(tab);
  }

  async togglePin(script: ScriptData) {
    if (!script.id) return;
    this.hapticService.mediumImpact();
    try {
      await this.scriptService.updateScript(script.id, { pinned: !script.pinned });
      this.toastService.success(script.pinned ? 'Script désépinglé' : 'Script épinglé');
    } catch (e) {
      this.hapticService.error();
    }
  }

  openScript(script: ScriptData) {
    this.hapticService.lightImpact();
    this.selectedScript.set(script);
  }

  closeScript() {
    this.selectedScript.set(null);
  }

  copyScript(script: ScriptData) {
    navigator.clipboard.writeText(script.content).then(() => {
      this.hapticService.success();
      this.toastService.success('Copié !');
    });
  }

  confirmDelete(script: ScriptData) {
    this.hapticService.mediumImpact();
    this.scriptToDelete.set(script);
  }

  async executeDelete() {
    const script = this.scriptToDelete();
    if (!script?.id) return;
    try {
      await this.scriptService.moveToTrash(script.id);
      this.scriptToDelete.set(null);
      this.hapticService.success();
    } catch (e) {
      this.hapticService.error();
    }
  }

  async restoreScript(script: ScriptData) {
    if (!script.id) return;
    this.hapticService.mediumImpact();
    try {
      await this.scriptService.restoreScript(script.id);
      this.toastService.success('Script restauré');
      this.hapticService.success();
    } catch (e) {
      this.hapticService.error();
    }
  }

  confirmHardDelete(script: ScriptData) {
    this.hapticService.mediumImpact();
    this.scriptToHardDelete.set(script);
  }

  async executeHardDelete() {
    const script = this.scriptToHardDelete();
    if (!script?.id) return;
    try {
      await this.scriptService.deleteScript(script.id);
      this.scriptToHardDelete.set(null);
      this.hapticService.success();
    } catch (e) {
      this.hapticService.error();
    }
  }

  editScript(script: ScriptData) {
    this.hapticService.mediumImpact();
    this.router.navigate(['/'], { state: { scriptToEdit: script } });
  }

  goToStudio(script: ScriptData) {
    this.hapticService.mediumImpact();
    const title = (script.title || `${script.intention} - ${script.tone}`);
    this.router.navigate(['/studio'], { state: { scriptContent: script.content, scriptTitle: title } });
  }
}
