import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-legal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-bold">Légal & CGU</h1>
          <p class="text-gray-500">Modifiez les textes légaux, mentions et politiques de confidentialité.</p>
        </div>
      </div>

      <div class="flex gap-4 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
        @for (tab of tabs; track tab.id) {
          <button 
            (click)="selectTab(tab.id)"
            [class.bg-white]="activeTab() === tab.id"
            [class.dark:bg-gray-700]="activeTab() === tab.id"
            [class.shadow-md]="activeTab() === tab.id"
            class="px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
        <div class="p-8 space-y-6">
          <div class="flex gap-6 items-center">
            <div class="flex-1">
              <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">Titre (Clé translation)</label>
              <input [(ngModel)]="content.title_key" type="text" class="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-4 border-none outline-none focus:ring-2 focus:ring-violet-500" placeholder="legal.tabs.cgu">
            </div>
            <div class="text-right">
              <p class="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Dernière mise à jour</p>
              <p class="text-sm font-medium">{{ content.last_updated | date:'medium' }}</p>
            </div>
          </div>

          <div>
            <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">Contenu HTML</label>
            <div class="relative group">
              <textarea 
                [(ngModel)]="content.content_html" 
                rows="20" 
                class="w-full bg-gray-50 dark:bg-gray-800 rounded-3xl px-8 py-8 border-none outline-none focus:ring-2 focus:ring-violet-500 font-mono text-sm leading-relaxed transition-all"
                placeholder="<h1>...</h1>"
              ></textarea>
              
              <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="px-3 py-1 rounded-full bg-violet-600 text-[10px] text-white font-bold uppercase tracking-wider">Mode HTML</span>
              </div>
            </div>
          </div>

          <div class="pt-4 flex justify-end gap-4">
            <button 
              (click)="resetToDefault()"
              class="px-8 py-4 rounded-2xl font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm"
            >
              Annuler les modifs
            </button>
            <button 
              (click)="saveContent()"
              class="px-10 py-4 rounded-2xl font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/30 transition-all flex items-center gap-3"
            >
              <span class="material-icons">save</span>
              Publier les changements
            </button>
          </div>
        </div>
      </div>

      <div class="p-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-[2rem] flex gap-6 items-start">
        <span class="material-icons text-amber-500 text-3xl">warning</span>
        <div class="space-y-1">
          <h4 class="font-bold text-amber-700 dark:text-amber-400 uppercase text-xs tracking-widest">Attention</h4>
          <p class="text-sm text-amber-800 dark:text-amber-500/80 leading-relaxed">
            Les changements effectués ici seront visibles immédiatement par tous les utilisateurs de l'application. 
            Veillez à respecter les balises HTML pour conserver une mise en forme correcte.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    textarea::-webkit-scrollbar { width: 8px; }
    textarea::-webkit-scrollbar-track { background: transparent; }
    textarea::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
    .dark textarea::-webkit-scrollbar-thumb { background: #374151; }
  `]
})
export class AdminLegalComponent implements OnInit {
  private adminService = inject(AdminService);
  
  tabs = [
    { id: 'cgu', label: 'CGU' },
    { id: 'mentions', label: 'Mentions Légales' },
    { id: 'privacy', label: 'Confidentialité' }
  ];
  
  activeTab = signal('cgu');
  
  content = {
    id: 'cgu',
    title_key: '',
    content_html: '',
    last_updated: ''
  };

  ngOnInit() {
    this.loadContent();
  }

  selectTab(id: string) {
    this.activeTab.set(id);
    this.loadContent();
  }

  async loadContent() {
    try {
      const data = await this.adminService.getLegalContent(this.activeTab());
      if (data) {
        this.content = data;
      }
    } catch (e) {
      console.error(e);
    }
  }

  async saveContent() {
    try {
      await this.adminService.saveLegalContent(
        this.content.id, 
        this.content.title_key, 
        this.content.content_html
      );
      alert("Contenu publié avec succès !");
      await this.loadContent();
    } catch (e) {
      alert("Erreur: " + (e as any).message);
    }
  }

  resetToDefault() {
    if (confirm("Réinitialiser les changements non enregistrés ?")) {
      this.loadContent();
    }
  }
}
