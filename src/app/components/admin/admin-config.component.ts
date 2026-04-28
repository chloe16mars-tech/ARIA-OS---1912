import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AppConfig } from '../../services/admin.service';
import { Language } from '../../services/language.service';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <!-- Section Languages -->
      <section class="space-y-6">
        <div>
          <h2 class="text-2xl font-bold">Langues Actives</h2>
          <p class="text-gray-500 text-sm">Activez ou désactivez les langues disponibles pour les utilisateurs.</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          @for (lang of availableLangs; track lang) {
            <label 
              class="relative flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 cursor-pointer transition-all"
              [class.border-violet-600]="config?.languages?.[lang]"
              [class.bg-violet-50]="config?.languages?.[lang]"
              [class.dark:bg-violet-900/10]="config?.languages?.[lang]"
              [class.border-gray-100]="!config?.languages?.[lang]"
              [class.dark:border-gray-800]="!config?.languages?.[lang]"
            >
              <input 
                type="checkbox" 
                class="hidden" 
                [(ngModel)]="config.languages[lang]"
                (change)="saveLanguages()"
              >
              <div class="w-12 h-12 rounded-full overflow-hidden mb-3 shadow-md">
                <img [src]="'assets/flags/' + lang + '.png'" class="w-full h-full object-cover" [alt]="lang" (error)="onFlagError($event)">
              </div>
              <span class="font-bold uppercase tracking-widest text-xs">{{ lang }}</span>
              
              @if (config?.languages?.[lang]) {
                <div class="absolute top-3 right-3 text-violet-600 animate-in zoom-in duration-300">
                  <span class="material-icons">check_circle</span>
                </div>
              }
            </label>
          }
        </div>
      </section>

      <!-- Section Special Popup -->
      <section class="space-y-6 bg-white dark:bg-gray-900 p-8 md:p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
        <div class="flex justify-between items-start relative z-10">
          <div>
            <h2 class="text-2xl font-bold">Popup Spécial</h2>
            <p class="text-gray-500 text-sm italic">S'affiche en superposition pour attirer l'attention.</p>
          </div>
          <div class="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-2xl">
            <span class="text-xs font-bold uppercase tracking-widest text-gray-400">Statut:</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" [(ngModel)]="config.special_popup.enabled" class="sr-only peer" (change)="savePopup()">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
          <div class="space-y-6">
            <div>
              <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">Titre du Popup</label>
              <input [(ngModel)]="config.special_popup.title" type="text" class="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-4 border-none outline-none focus:ring-2 focus:ring-violet-500" placeholder="Offre Exceptionnelle !">
            </div>
            <div>
              <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">Texte de description</label>
              <textarea [(ngModel)]="config.special_popup.text" rows="4" class="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-4 border-none outline-none focus:ring-2 focus:ring-violet-500 resize-none" placeholder="Décrivez votre offre ici..."></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">Texte du Bouton</label>
                <input [(ngModel)]="config.special_popup.button_text" type="text" class="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-4 border-none outline-none focus:ring-2 focus:ring-violet-500" placeholder="En savoir plus">
              </div>
              <div>
                <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">Lien du Bouton</label>
                <input [(ngModel)]="config.special_popup.button_link" type="text" class="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-4 border-none outline-none focus:ring-2 focus:ring-violet-500" placeholder="https://...">
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div>
              <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">URL de l'image (Optionnel)</label>
              <input [(ngModel)]="config.special_popup.image_url" type="text" class="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-4 border-none outline-none focus:ring-2 focus:ring-violet-500" placeholder="https://...">
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">Couleur de fond</label>
                <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <input type="color" [(ngModel)]="config.special_popup.bg_color" class="w-12 h-12 rounded-xl border-none bg-transparent cursor-pointer overflow-hidden">
                  <input type="text" [(ngModel)]="config.special_popup.bg_color" class="flex-1 bg-transparent border-none outline-none text-sm font-mono uppercase" maxlength="7">
                </div>
              </div>
              <div>
                <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">Opacité (0.1 - 1.0)</label>
                <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <input type="range" [(ngModel)]="config.special_popup.overlay_opacity" min="0.1" max="1.0" step="0.1" class="flex-1 accent-violet-600">
                  <span class="text-sm font-bold w-8 text-center">{{ config.special_popup.overlay_opacity }}</span>
                </div>
              </div>
            </div>

            <div class="p-6 rounded-3xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/50">
              <h4 class="text-xs font-bold uppercase text-violet-600 dark:text-violet-400 mb-3 flex items-center gap-2">
                <span class="material-icons text-sm">visibility</span>
                Aperçu Rapide
              </h4>
              <div 
                [style.background-color]="config.special_popup.bg_color" 
                class="aspect-video rounded-2xl shadow-inner flex flex-col items-center justify-center p-4 text-center text-white"
              >
                <h5 class="font-bold text-sm leading-tight mb-1">{{ config.special_popup.title || 'Titre' }}</h5>
                <p class="text-[10px] opacity-80 mb-2 line-clamp-2">{{ config.special_popup.text || 'Texte descriptif...' }}</p>
                <div class="px-4 py-1.5 rounded-full bg-white/20 text-[10px] font-bold border border-white/30">
                  {{ config.special_popup.button_text || 'Bouton' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-6 flex justify-end relative z-10">
          <button 
            (click)="savePopup()"
            class="bg-violet-600 hover:bg-violet-700 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-violet-500/30 transition-all flex items-center gap-3"
          >
            <span class="material-icons">save</span>
            Enregistrer la configuration
          </button>
        </div>

        <!-- Decorative elements -->
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full"></div>
        <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
    input[type="color"]::-webkit-color-swatch { border: none; border-radius: 12px; }
  `]
})
export class AdminConfigComponent implements OnInit {
  private adminService = inject(AdminService);
  
  availableLangs: Language[] = ['fr', 'en', 'zh', 'ar', 'es', 'pt'];
  
  config: AppConfig = {
    languages: { fr: true, en: true, zh: false, ar: false, es: false, pt: false },
    special_popup: {
      enabled: false,
      title: '',
      text: '',
      image_url: '',
      button_text: '',
      button_link: '#',
      bg_color: '#7c3aed',
      overlay_opacity: 0.8
    }
  };

  ngOnInit() {
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const langs = await this.adminService.getConfig<Record<Language, boolean>>('languages');
      const popup = await this.adminService.getConfig<AppConfig['special_popup']>('special_popup');
      if (langs) this.config.languages = langs;
      if (popup) this.config.special_popup = popup;
    } catch (e) {
      console.error(e);
    }
  }

  async saveLanguages() {
    try {
      await this.adminService.saveConfig('languages', this.config.languages);
    } catch (e) {
      alert("Erreur: " + (e as any).message);
    }
  }

  async savePopup() {
    try {
      await this.adminService.saveConfig('special_popup', this.config.special_popup);
      alert("Configuration enregistrée !");
    } catch (e) {
      alert("Erreur: " + (e as any).message);
    }
  }

  onFlagError(event: any) {
    event.target.src = 'https://via.placeholder.com/64?text=?';
  }
}
