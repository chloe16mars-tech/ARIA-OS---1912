import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Ad } from '../../services/admin.service';

@Component({
  selector: 'app-admin-ads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold">Bannières Publicitaires</h1>
          <p class="text-gray-500">Gérez les campagnes affichées dans le carrousel d'accueil.</p>
        </div>
        <button 
          (click)="openAddModal()"
          class="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-violet-500/30 transition-all flex items-center gap-2"
        >
          <span class="material-icons-outlined">add</span>
          Ajouter une pub
        </button>
      </div>

      <!-- Ads List -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        @for (ad of ads(); track ad.id) {
          <div class="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div class="flex gap-6">
              <div class="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                <img [src]="ad.image_url" class="w-full h-full object-cover" alt="">
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-bold uppercase tracking-wider">
                    {{ ad.badge_key }}
                  </span>
                  <span class="text-xs text-gray-400">Ordre: {{ ad.order }}</span>
                </div>
                <h3 class="font-bold text-lg leading-tight mb-1">{{ ad.title_key }}</h3>
                <p class="text-xs text-gray-500 line-clamp-2">{{ ad.description_key }}</p>
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                (click)="editAd(ad)"
                class="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
              >
                <span class="material-icons-outlined">edit</span>
              </button>
              <button 
                (click)="deleteAd(ad.id)"
                class="p-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-600 hover:text-white transition-all"
              >
                <span class="material-icons-outlined">delete</span>
              </button>
            </div>

            @if (!ad.is_active) {
              <div class="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                <span class="bg-gray-800 text-white px-4 py-1 rounded-full text-xs font-bold uppercase">Inactif</span>
              </div>
            }
          </div>
        } @empty {
          <div class="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <span class="material-icons-outlined text-6xl text-gray-300 mb-4">no_photography</span>
            <p class="text-gray-500">Aucune publicité configurée.</p>
          </div>
        }
      </div>

      <!-- Modal Add/Edit -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
            <div class="p-8 space-y-6">
              <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold">{{ editingAd() ? 'Modifier' : 'Ajouter' }} une publicité</h2>
                <button (click)="closeModal()" class="text-gray-400 hover:text-white transition-colors">
                  <span class="material-icons-outlined">close</span>
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <div>
                    <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">URL de l'image</label>
                    <input [(ngModel)]="formAd.image_url" type="text" class="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-3 border-none focus:ring-2 focus:ring-violet-500 outline-none" placeholder="https://...">
                  </div>
                  <div>
                    <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">Badge (Clé translation)</label>
                    <input [(ngModel)]="formAd.badge_key" type="text" class="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-3 border-none focus:ring-2 focus:ring-violet-500 outline-none" placeholder="home.ad1.badge">
                  </div>
                  <div>
                    <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">Lien de redirection</label>
                    <input [(ngModel)]="formAd.link_url" type="text" class="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-3 border-none focus:ring-2 focus:ring-violet-500 outline-none" placeholder="https://...">
                  </div>
                </div>

                <div class="space-y-4">
                  <div>
                    <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">Titre (Clé translation)</label>
                    <input [(ngModel)]="formAd.title_key" type="text" class="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-3 border-none focus:ring-2 focus:ring-violet-500 outline-none" placeholder="home.ad1.title">
                  </div>
                  <div>
                    <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">Description (Clé translation)</label>
                    <textarea [(ngModel)]="formAd.description_key" rows="3" class="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-3 border-none focus:ring-2 focus:ring-violet-500 outline-none resize-none" placeholder="home.ad1.desc"></textarea>
                  </div>
                  <div class="flex gap-4">
                    <div class="flex-1">
                      <label class="text-xs font-bold uppercase text-gray-500 ml-4 mb-2 block">Ordre</label>
                      <input [(ngModel)]="formAd.order" type="number" class="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-3 border-none focus:ring-2 focus:ring-violet-500 outline-none">
                    </div>
                    <div class="flex items-end pb-2">
                      <label class="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" [(ngModel)]="formAd.is_active" class="w-5 h-5 rounded-lg border-none bg-gray-100 dark:bg-gray-800 text-violet-600 focus:ring-0">
                        <span class="text-sm font-bold">Actif</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="pt-4 flex gap-4">
                <button 
                  (click)="closeModal()"
                  class="flex-1 px-6 py-4 rounded-2xl font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  Annuler
                </button>
                <button 
                  (click)="saveAd()"
                  class="flex-[2] px-6 py-4 rounded-2xl font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/20 transition-all"
                >
                  {{ editingAd() ? 'Sauvegarder les modifications' : 'Créer la publicité' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminAdsComponent implements OnInit {
  private adminService = inject(AdminService);
  ads = signal<Ad[]>([]);
  showModal = signal(false);
  editingAd = signal<Ad | null>(null);

  formAd: Partial<Ad> = this.getEmptyAd();

  ngOnInit() {
    this.loadAds();
  }

  async loadAds() {
    try {
      const data = await this.adminService.getAds();
      this.ads.set(data);
    } catch (e) {
      console.error(e);
    }
  }

  getEmptyAd(): Partial<Ad> {
    return {
      image_url: '',
      badge_key: '',
      title_key: '',
      description_key: '',
      link_url: '#',
      is_active: true,
      order: 0
    };
  }

  openAddModal() {
    this.editingAd.set(null);
    this.formAd = this.getEmptyAd();
    this.showModal.set(true);
  }

  editAd(ad: Ad) {
    this.editingAd.set(ad);
    this.formAd = { ...ad };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async saveAd() {
    try {
      await this.adminService.saveAd(this.formAd);
      await this.loadAds();
      this.closeModal();
    } catch (e) {
      alert("Erreur lors de la sauvegarde : " + (e as any).message);
    }
  }

  async deleteAd(id: string) {
    if (!confirm("Supprimer cette publicité ?")) return;
    try {
      await this.adminService.deleteAd(id);
      await this.loadAds();
    } catch (e) {
      alert("Erreur lors de la suppression : " + (e as any).message);
    }
  }
}
