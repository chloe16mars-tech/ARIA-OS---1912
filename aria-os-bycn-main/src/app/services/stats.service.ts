import { Injectable, inject } from '@angular/core';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private authService = inject(AuthService);

  getGlobalStatsSnapshot(callback: (total: number) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    const statsRef = doc(db, 'stats', 'global');
    return onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data()['totalGenerations'] || 0);
      } else {
        callback(0);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'stats/global');
    });
  }
}
