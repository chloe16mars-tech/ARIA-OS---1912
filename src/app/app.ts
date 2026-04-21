import {ChangeDetectionStrategy, Component, effect, inject} from '@angular/core';
import {RouterOutlet, Router} from '@angular/router';
import {ThemeService} from './services/theme.service';
import {AuthService} from './services/auth.service';
import {FirestoreService} from './services/firestore.service';
import {Timestamp} from 'firebase/firestore';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private router = inject(Router);

  constructor() {
    effect(() => {
      if (this.authService.isAuthReady() && this.authService.currentUser()) {
        this.checkAccountDeletion();
      }
    });
  }

  private checkAccountDeletion() {
    const unsubscribe = this.firestoreService.getUserProfileSnapshot(async (profile) => {
      if (profile && profile['scheduledDeletionDate']) {
        const deletionDate = (profile['scheduledDeletionDate'] as Timestamp).toDate();
        if (new Date() > deletionDate) {
          try {
            await this.firestoreService.deleteUserAccount();
            this.router.navigate(['/login']);
          } catch (error) {
            console.error("Failed to delete account", error);
          }
        }
      }
      unsubscribe(); // Only need to check once on load
    });
  }
}
