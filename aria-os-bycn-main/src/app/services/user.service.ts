import { Injectable, inject } from '@angular/core';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, deleteDoc, Timestamp } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { UserProfile, UserPreferences } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private authService = inject(AuthService);

  async checkAnonymousQuota(): Promise<boolean> {
    const user = this.authService.currentUser();
    if (!user || !user.isAnonymous) return true;

    const userRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const lastGen = data['lastGenerationDate'] as Timestamp | undefined;
        const count = data['anonymousGenerationCount'] || 0;

        if (lastGen) {
          const now = new Date();
          const lastGenDate = lastGen.toDate();
          const diffHours = (now.getTime() - lastGenDate.getTime()) / (1000 * 60 * 60);

          if (diffHours >= 24) {
            return true;
          } else if (count >= 2) {
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      return false;
    }
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
      // 1. Delete all user scripts
      const q = query(collection(db, 'scripts'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // 2. Delete user profile
      await deleteDoc(doc(db, 'users', user.uid));

      // 3. Delete auth user
      await user.delete();
    } catch (error) {
      console.error("Error deleting user account:", error);
      throw error;
    }
  }
}
