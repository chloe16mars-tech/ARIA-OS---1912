import { Injectable, inject } from '@angular/core';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, deleteDoc, Timestamp, increment } from 'firebase/firestore';
import { AuthService } from './auth.service';

export interface ScriptData {
  id?: string;
  userId: string;
  sourceUrl?: string;
  sourceText?: string;
  sourceType: 'video' | 'article' | 'social' | 'text';
  intention: string;
  tone: string;
  stance?: string;
  duration: string;
  content: string;
  reflectionTime?: number;
  createdAt: Timestamp;
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  title?: string;
  pinned?: boolean;
}

export interface AppNotification {
  id?: string;
  title: string;
  message: string;
  type: 'update' | 'info' | 'alert';
  createdAt: Timestamp;
}

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
export class FirestoreService {
  private authService = inject(AuthService);

  async saveScript(script: Omit<ScriptData, 'id' | 'userId' | 'createdAt'>) {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    const scriptRef = doc(collection(db, 'scripts'));
    const scriptData: ScriptData = {
      ...script,
      userId: user.uid,
      createdAt: Timestamp.now()
    };

    try {
      await setDoc(scriptRef, scriptData);
      return scriptRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scripts');
      throw error;
    }
  }

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

  async incrementGlobalCounter() {
    const user = this.authService.currentUser();
    if (!user) return;

    const statsRef = doc(db, 'stats', 'global');
    const userRef = doc(db, 'users', user.uid);
    try {
      // Increment global
      await setDoc(statsRef, {
        totalGenerations: increment(1)
      }, { merge: true });
      
      // Handle personal stats
      if (user.isAnonymous) {
        const docSnap = await getDoc(userRef);
        let count = 0;
        let lastGen = Timestamp.now();

        if (docSnap.exists()) {
          const data = docSnap.data();
          const existingLastGen = data['lastGenerationDate'] as Timestamp | undefined;
          const existingCount = data['anonymousGenerationCount'] || 0;

          if (existingLastGen) {
            const now = new Date();
            const lastGenDate = existingLastGen.toDate();
            const diffHours = (now.getTime() - lastGenDate.getTime()) / (1000 * 60 * 60);

            if (diffHours >= 24) {
              count = 1;
            } else {
              count = existingCount + 1;
              lastGen = existingLastGen;
            }
          } else {
            count = 1;
          }
        } else {
          count = 1;
        }

        await setDoc(userRef, {
          anonymousGenerationCount: count,
          lastGenerationDate: lastGen
        }, { merge: true });
      } else {
        await setDoc(userRef, {
          generationCount: increment(1)
        }, { merge: true });
      }
    } catch (error: unknown) {
      handleFirestoreError(error, OperationType.UPDATE, 'stats/global or users');
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

  getNotificationsSnapshot(callback: (notifications: AppNotification[]) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => { /* no-op */ };

    const q = query(collection(db, 'notifications'));
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AppNotification));
      
      notifications.sort((a, b) => {
        const timeA = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0) : 0;
        const timeB = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0) : 0;
        return timeB - timeA;
      });
      callback(notifications);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });
  }

  async markNotificationAsRead(notificationId: string) {
    const user = this.authService.currentUser();
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const readNotifications = data['readNotifications'] || [];
        if (!readNotifications.includes(notificationId)) {
          await setDoc(userRef, { readNotifications: [...readNotifications, notificationId] }, { merge: true });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  }

  async deleteNotification(notificationId: string) {
    const user = this.authService.currentUser();
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const deletedNotifications = data['deletedNotifications'] || [];
        if (!deletedNotifications.includes(notificationId)) {
          await setDoc(userRef, { deletedNotifications: [...deletedNotifications, notificationId] }, { merge: true });
        }
      }
    } catch (error) {
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

  async moveToTrash(scriptId: string) {
    try {
      await setDoc(doc(db, 'scripts', scriptId), {
        isDeleted: true,
        deletedAt: Timestamp.now()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `scripts/${scriptId}`);
      throw error;
    }
  }

  async restoreScript(scriptId: string) {
    try {
      await setDoc(doc(db, 'scripts', scriptId), {
        isDeleted: false,
        deletedAt: null
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `scripts/${scriptId}`);
      throw error;
    }
  }

  async deleteScript(scriptId: string) {
    try {
      await deleteDoc(doc(db, 'scripts', scriptId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `scripts/${scriptId}`);
      throw error;
    }
  }

  async updateScript(scriptId: string, partial: Partial<ScriptData>) {
    try {
      await setDoc(doc(db, 'scripts', scriptId), partial, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `scripts/${scriptId}`);
      throw error;
    }
  }

  getScriptsSnapshot(callback: (scripts: ScriptData[]) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    const q = query(
      collection(db, 'scripts'),
      where('userId', '==', user.uid)
    );

    return onSnapshot(q, (snapshot) => {
      let scripts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScriptData));
      scripts = scripts.filter(s => !s.isDeleted);
      scripts.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      callback(scripts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scripts');
    });
  }

  getTrashedScriptsSnapshot(callback: (scripts: ScriptData[]) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    const q = query(
      collection(db, 'scripts'),
      where('userId', '==', user.uid)
    );

    return onSnapshot(q, (snapshot) => {
      let scripts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScriptData));
      scripts = scripts.filter(s => s.isDeleted);
      scripts.sort((a, b) => (b.deletedAt?.toMillis() || 0) - (a.deletedAt?.toMillis() || 0));
      callback(scripts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scripts');
    });
  }
}
