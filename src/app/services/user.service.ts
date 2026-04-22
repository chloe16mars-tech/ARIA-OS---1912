import { Injectable, inject } from '@angular/core';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { doc, setDoc, deleteDoc, getDocs, query, collection, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { AuthService } from './auth.service';

export interface UserPreferences {
  intention?: string;
  tone?: string;
  stance?: string;
  duration?: string;
}

export interface UserProfile {
  email?: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  generationCount?: number;
  anonymousGenerationCount?: number;
  lastGenerationDate?: Timestamp;
  scheduledDeletionDate?: Timestamp;
  deletedNotifications?: string[];
  readNotifications?: string[];
  preferences?: UserPreferences;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private authService = inject(AuthService);

  getUserProfileSnapshot(callback: (data: UserProfile | null) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    const userRef = doc(db, 'users', user.uid);
    return onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as UserProfile);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });
  }

  async saveUserPreferences(preferences: UserPreferences) {
    const user = this.authService.currentUser();
    if (!user || user.isAnonymous) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userRef, { preferences }, { merge: true });
    } catch (error: unknown) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  }

  async scheduleAccountDeletion() {
    const user = this.authService.currentUser();
    if (!user) return;
    
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 3); // +3 days
    
    const userRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userRef, {
        scheduledDeletionDate: Timestamp.fromDate(deletionDate)
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  }

  async cancelAccountDeletion() {
    const user = this.authService.currentUser();
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userRef, {
        scheduledDeletionDate: null
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  }

  async deleteUserAccount() {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/account', {
          method: 'DELETE',
          headers: {
              'Authorization': `Bearer ${token}`
          }
      });

      if (!response.ok) {
          throw new Error("Erreur serveur lors de la suppression.");
      }

      await this.authService.logout();
    } catch (error) {
      console.error("Error deleting user account:", error);
      throw error;
    }
  }
}
