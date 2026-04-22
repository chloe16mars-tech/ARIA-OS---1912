import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="p-4 max-w-3xl mx-auto space-y-6 text-center">
      <div class="flex items-center gap-4 mb-8 text-left">
        <button (click)="goBack()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 class="text-2xl font-bold">À propos</h2>
      </div>
      
      <div class="w-24 h-24 bg-violet-600 rounded-3xl mx-auto flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-6">
        1912
      </div>
      
      <h1 class="text-3xl font-bold mb-2">1912</h1>
      <p class="text-gray-500 dark:text-gray-400 mb-8">Version 4.0.0</p>
      
      <p class="text-lg leading-relaxed max-w-xl mx-auto mb-6">
        1912 est l'atelier de contenu média ultime, conçu pour les rédactions et les créateurs de contenu. Il permet de transformer n'importe quelle source d'information en un script calibré pour la voix-off, en quelques secondes.
      </p>

      <div class="bg-gray-50 dark:bg-[#1C1C1E] rounded-3xl p-6 max-w-xl mx-auto border border-gray-200 dark:border-gray-800 text-left mb-12">
        <h3 class="font-bold text-xl mb-3">Pourquoi 1912 ?</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          En hommage au père du script moderne : <strong>Thomas Ince</strong>. En 1912, pour produire des films à la chaîne, il impose le "Shooting Script" (découpage technique). Son innovation majeure fut l'interdiction de tourner sans un script validé. Cela permettait de calculer les coûts, de gérer les décors et de s'assurer que l'histoire tenait la route sans que le producteur soit sur le plateau. 1912 perpétue cet héritage de rigueur et d'efficacité pour la création de contenu moderne.
        </p>
      </div>
      
      <div class="bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 max-w-sm mx-auto border border-gray-200 dark:border-gray-800">
        <p class="text-sm text-gray-500 mb-2">Développé par</p>
        <p class="font-bold text-lg">Cakenews</p>
        <p class="text-xs text-gray-400 mt-4">Cakenews appartient à</p>
        <p class="font-semibold text-violet-600 dark:text-violet-400">Mmedia Universe</p>
      </div>
      
      <p class="text-xs text-gray-400 mt-12">
        &copy; 2026 Mmedia Universe
      </p>
    </div>
  `
})
export class AboutComponent {
  public location = inject(Location);
  public router = inject(Router);

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }
}
