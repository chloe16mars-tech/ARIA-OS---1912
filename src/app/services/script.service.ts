import { Injectable, inject } from '@angular/core';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, doc, setDoc, query, where, onSnapshot, deleteDoc, Timestamp } from 'firebase/firestore';
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

@Injectable({
  providedIn: 'root'
})
export class ScriptService {
  private authService = inject(AuthService);

  async saveScript(script: Omit<ScriptData, 'id' | 'userId' | 'createdAt'>) {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    const scriptRef = doc(collection(db, 'scripts'));
    const scriptData: ScriptData = {
      ...script,
      userId: user.uid,
      createdAt: Timestamp.now(),
      isDeleted: false
    };

    try {
      await setDoc(scriptRef, scriptData);
      return scriptRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scripts');
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

  // OPTIMIZED: Native Firebase filtering instead of client-side JS filtering
  getScriptsSnapshot(callback: (scripts: ScriptData[]) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    const q = query(
      collection(db, 'scripts'),
      where('userId', '==', user.uid),
      where('isDeleted', '==', false) // Use index/filter directly in query
    );

    return onSnapshot(q, (snapshot) => {
      const scripts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScriptData));
      scripts.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      callback(scripts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scripts');
    });
  }

  // OPTIMIZED: Native Firebase filtering
  getTrashedScriptsSnapshot(callback: (scripts: ScriptData[]) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    const q = query(
      collection(db, 'scripts'),
      where('userId', '==', user.uid),
      where('isDeleted', '==', true) 
    );

    return onSnapshot(q, (snapshot) => {
      const scripts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScriptData));
      scripts.sort((a, b) => (b.deletedAt?.toMillis() || 0) - (a.deletedAt?.toMillis() || 0));
      callback(scripts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scripts');
    });
  }
}
