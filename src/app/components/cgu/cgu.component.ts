import { Component, inject, signal, input, output } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-cgu',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="flex flex-col w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8"
         [style.height]="isPopup() ? '100%' : 'calc(100dvh - 13rem)'">
      <div class="shrink-0 flex items-center gap-4 mb-6">
        <button (click)="goBack()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white">
          <mat-icon>{{ isPopup() ? 'close' : 'arrow_back' }}</mat-icon>
        </button>
        <h2 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Mentions Légales & CGU</h2>
      </div>

      <!-- Tabs -->
      <div class="shrink-0 flex gap-2 p-1 bg-gray-100 dark:bg-[#1C1C1E] rounded-2xl mb-8 overflow-x-auto hide-scrollbar">
        <button (click)="activeTab.set('cgu')" 
                class="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium whitespace-nowrap"
                [class.bg-white]="activeTab() === 'cgu'"
                [class.dark:bg-[#2C2C2E]]="activeTab() === 'cgu'"
                [class.shadow-sm]="activeTab() === 'cgu'"
                [class.text-gray-900]="activeTab() === 'cgu'"
                [class.dark:text-white]="activeTab() === 'cgu'"
                [class.text-gray-500]="activeTab() !== 'cgu'">
          Conditions Générales
        </button>
        <button (click)="activeTab.set('legal')" 
                class="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium whitespace-nowrap"
                [class.bg-white]="activeTab() === 'legal'"
                [class.dark:bg-[#2C2C2E]]="activeTab() === 'legal'"
                [class.shadow-sm]="activeTab() === 'legal'"
                [class.text-gray-900]="activeTab() === 'legal'"
                [class.dark:text-white]="activeTab() === 'legal'"
                [class.text-gray-500]="activeTab() !== 'legal'">
          Mentions Légales
        </button>
        <button (click)="activeTab.set('privacy')" 
                class="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium whitespace-nowrap"
                [class.bg-white]="activeTab() === 'privacy'"
                [class.dark:bg-[#2C2C2E]]="activeTab() === 'privacy'"
                [class.shadow-sm]="activeTab() === 'privacy'"
                [class.text-gray-900]="activeTab() === 'privacy'"
                [class.dark:text-white]="activeTab() === 'privacy'"
                [class.text-gray-500]="activeTab() !== 'privacy'">
          Confidentialité & Cookies
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto prose dark:prose-invert max-w-none text-sm leading-relaxed text-gray-700 dark:text-gray-300 space-y-6 bg-white dark:bg-[#111] p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm relative">
        
        @if (activeTab() === 'cgu') {
          <div>
            <h2 class="text-2xl font-bold text-black dark:text-white mb-2">Conditions Générales d'Utilisation (CGU)</h2>
            <p class="text-gray-500 mb-8">Dernière mise à jour : 14 Avril 2026</p>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">Article 1 : Objet</h3>
            <p>Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») ont pour objet de définir les modalités et conditions dans lesquelles la société Mmedia Universe (ci-après « l'Éditeur ») met à la disposition des utilisateurs (ci-après « l'Utilisateur ») l'application 1912 (ci-après « l'Application »), ainsi que les droits et obligations des parties dans ce cadre.</p>
            <p>L'accès et l'utilisation de l'Application sont soumis à l'acceptation et au respect des présentes CGU. En créant un compte ou en utilisant l'Application, l'Utilisateur accepte expressément et sans réserve les présentes CGU.</p>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">Article 2 : Accès à l'Application</h3>
            <p>L'Application est accessible gratuitement à tout Utilisateur disposant d'un accès à internet. Tous les coûts afférents à l'accès, que ce soient les frais matériels, logiciels ou d'accès à internet sont exclusivement à la charge de l'Utilisateur.</p>
            <p>L'accès à certaines fonctionnalités nécessite la création d'un compte utilisateur via le service d'authentification Google (Google OAuth). L'Utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants de connexion.</p>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">Article 3 : Description du Service</h3>
            <p>1912 est un outil professionnel d'aide à la création de contenu éditorial. Il permet notamment :</p>
            <ul class="list-disc pl-5 space-y-2 mt-2">
              <li>L'analyse de contenus textuels ou de vidéos (via URL).</li>
              <li>La génération automatisée de scripts calibrés pour la voix-off grâce à l'Intelligence Artificielle.</li>
              <li>La sauvegarde et la gestion d'un historique de scripts.</li>
            </ul>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">Article 4 : Propriété Intellectuelle et Droits d'Auteur</h3>
            <p><strong>4.1. Droits sur l'Application :</strong> L'architecture de l'Application, les marques, logos, graphismes, logiciels, algorithmes et bases de données sont la propriété exclusive de Mmedia Universe et sont protégés par le droit de la propriété intellectuelle. La plateforme conserve tous les droits sur sa technologie, ses algorithmes et son interface.</p>
            <p><strong>4.2. Marques tierces :</strong> Les marques et logos de tiers (tels que YouTube, Reuters, etc.) affichés sur l'Application appartiennent à leurs propriétaires respectifs. Ils sont utilisés uniquement à des fins d'illustration pour indiquer la compatibilité de notre outil avec ces plateformes. Mmedia Universe ne revendique aucune affiliation ni aucun droit sur ces marques.</p>
            <p><strong>4.3. Droits sur les sources :</strong> L'Utilisateur s'engage à ne soumettre à l'Application que des URL ou des textes pour lesquels il dispose des droits nécessaires (droit d'auteur, droit de citation, domaine public). L'Éditeur décline toute responsabilité en cas d'analyse de contenus protégés soumis frauduleusement par l'Utilisateur.</p>
            <p><strong>4.4. Droits sur les contenus générés :</strong> L'Utilisateur dispose du droit d'exploiter librement, intégralement et commercialement les scripts générés par l'Application. L'Éditeur ne revendique aucun droit d'auteur sur les textes finaux produits par l'Utilisateur via l'Application.</p>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">Article 5 : Responsabilité et Limites de l'IA</h3>
            <p>L'Application s'appuie sur des modèles d'Intelligence Artificielle avancés pour analyser les sources fournies et structurer le contenu selon des formats optimisés pour la voix-off. Notre technologie combine ces modèles avec des processus d'analyse exclusifs pour garantir un rendu professionnel, sans que les détails de nos algorithmes internes ne soient publics. L'Utilisateur reconnaît que :</p>
            <ul class="list-disc pl-5 space-y-2 mt-2">
              <li>L'IA peut générer des informations inexactes, incomplètes ou obsolètes (phénomène d'hallucination).</li>
              <li>Il est de la responsabilité exclusive de l'Utilisateur (en tant que créateur de contenu ou journaliste) de vérifier, fact-checker et valider les scripts avant toute publication ou enregistrement.</li>
            </ul>
            <p>Mmedia Universe ne pourra en aucun cas être tenu responsable des dommages directs ou indirects résultant de l'utilisation des scripts générés (diffamation, fake news, préjudice commercial).</p>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">Article 6 : Disponibilité du Service</h3>
            <p>L'Éditeur s'efforce de maintenir l'Application accessible 24h/24 et 7j/7, mais n'est tenu à aucune obligation de résultat. L'Éditeur se réserve le droit de suspendre, d'interrompre ou de limiter l'accès à tout ou partie de l'Application pour des raisons de maintenance ou de mise à jour.</p>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">Article 7 : Modification des CGU</h3>
            <p>Mmedia Universe se réserve le droit de modifier les présentes CGU à tout moment. Les Utilisateurs seront informés de toute modification substantielle. L'utilisation continue de l'Application après modification vaut acceptation des nouvelles CGU.</p>
          </div>
        }

        @if (activeTab() === 'legal') {
          <div>
            <h2 class="text-2xl font-bold text-black dark:text-white mb-2">Mentions Légales</h2>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">1. Éditeur de l'Application</h3>
            <p>L'application <strong>1912</strong> est éditée et exploitée par :</p>
            <p class="mt-2">
              <strong>Cakenews</strong><br>
              Une société du groupe <strong>Mmedia Universe</strong><br>
              Mimongo, Gabon<br>
              Capital social : 2.000.000 FCFA
            </p>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">2. Directeur de la publication</h3>
            <p>Le Directeur de la publication est : <strong>Ghislain DIYOMBI</strong></p>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">3. Nous contacter</h3>
            <p>
              Téléphone : <strong>+241 66 17 10 36</strong><br>
              Email : <strong>enjoymegabon&#64;gmail.com</strong>
            </p>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">4. Hébergement</h3>
            <p>L'Application et ses bases de données sont hébergées par :</p>
            <p class="mt-2">
              <strong>Google Cloud Platform (GCP) / Firebase</strong><br>
              Google Ireland Limited<br>
              Gordon House, Barrow Street<br>
              Dublin 4, Irlande
            </p>
          </div>
        }

        @if (activeTab() === 'privacy') {
          <div>
            <h2 class="text-2xl font-bold text-black dark:text-white mb-2">Politique de Confidentialité et Cookies</h2>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">1. Collecte des Données Personnelles</h3>
            <p>Dans le cadre de l'utilisation de l'Application 1912, nous collectons les données suivantes :</p>
            <ul class="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Données d'identification :</strong> Nom, prénom, adresse email et photo de profil (fournis par Google lors de la connexion OAuth).</li>
              <li><strong>Données d'utilisation :</strong> Historique des scripts générés, URL soumises, textes analysés, paramètres de génération (ton, durée).</li>
              <li><strong>Données techniques :</strong> Identifiants de connexion (UID Firebase).</li>
            </ul>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">2. Finalité du Traitement</h3>
            <p>Vos données sont traitées pour les finalités suivantes :</p>
            <ul class="list-disc pl-5 space-y-2 mt-2">
              <li>Fournir le service de génération de scripts.</li>
              <li>Permettre la sauvegarde et la consultation de votre historique personnel.</li>
              <li>Assurer la sécurité de l'Application et prévenir les abus (limitation des quotas).</li>
              <li>Améliorer nos algorithmes de génération (de manière anonymisée).</li>
            </ul>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">3. Conservation des Données</h3>
            <p>Vos données d'identification et votre historique sont conservés tant que votre compte est actif. Vous disposez d'une fonctionnalité dans les paramètres de l'Application permettant de <strong>supprimer définitivement votre compte et l'intégralité de vos données</strong>. Une fois cette action effectuée, les données sont irrécupérables.</p>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">4. Partage des Données</h3>
            <p>Vos données ne sont <strong>jamais vendues</strong> à des tiers. Elles sont partagées uniquement avec nos sous-traitants techniques strictement nécessaires au fonctionnement du service :</p>
            <ul class="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Google Firebase :</strong> Pour l'hébergement de la base de données et l'authentification.</li>
              <li><strong>Google Gemini API :</strong> Les textes et URL que vous soumettez sont envoyés à l'API Gemini pour analyse. Ces données ne sont pas utilisées par Google pour entraîner ses modèles publics.</li>
            </ul>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">5. Politique des Cookies</h3>
            <p>L'Application 1912 utilise des cookies et technologies similaires (Local Storage, Session Storage) de manière très limitée et <strong>uniquement pour des raisons techniques strictement nécessaires</strong> :</p>
            <ul class="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Cookies d'authentification (Firebase Auth) :</strong> Permettent de maintenir votre session active sans avoir à vous reconnecter à chaque visite.</li>
              <li><strong>Préférences locales :</strong> Sauvegarde de votre thème (clair/sombre).</li>
            </ul>
            <p><strong>Aucun cookie publicitaire ou de traçage tiers (type Google Analytics ou Meta Pixel) n'est utilisé sur cette Application.</strong> Par conséquent, aucun bandeau de consentement aux cookies n'est requis au sens de la réglementation (RGPD), les cookies techniques étant exemptés de consentement préalable.</p>
            
            <h3 class="text-lg font-bold text-black dark:text-white mt-8 mb-4">6. Vos Droits</h3>
            <p>Conformément à la réglementation applicable en matière de protection des données, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits, vous pouvez utiliser les options de suppression dans l'Application ou nous contacter au numéro indiqué dans les Mentions Légales.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class CguComponent {
  public location = inject(Location);
  public router = inject(Router);
  public activeTab = signal<'cgu' | 'legal' | 'privacy'>('cgu');
  
  isPopup = input<boolean>(false);
  closePopup = output<void>();

  goBack() {
    if (this.isPopup()) {
      this.closePopup.emit();
    } else if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }
}
