import { Injectable, inject } from '@angular/core';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, doc, setDoc, query, where, onSnapshot, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { ScriptData } from '../models/script.model';

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

    // Optimized Query: Server-side filtering
    const q = query(
      collection(db, 'scripts'),
      where('userId', '==', user.uid),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      let scripts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScriptData));
      callback(scripts);
    }, (error) => {
      // Fallback for missing index during development: 
      // If index is missing, it will throw an error with a link to create it.
      console.warn("If you get a missing index error, click the link provided by Firebase to create it.", error);
      handleFirestoreError(error, OperationType.LIST, 'scripts');
      
      // Fallback manual filter if query fails due to missing index
      const fallbackQ = query(collection(db, 'scripts'), where('userId', '==', user.uid));
      onSnapshot(fallbackQ, (fallbackSnap) => {
        let scripts = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScriptData));
        scripts = scripts.filter(s => !s.isDeleted);
        scripts.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        callback(scripts);
      });
    });
  }

  getTrashedScriptsSnapshot(callback: (scripts: ScriptData[]) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => undefined;

    // Optimized Query: Server-side filtering
    const q = query(
      collection(db, 'scripts'),
      where('userId', '==', user.uid),
      where('isDeleted', '==', true)
    );

    return onSnapshot(q, (snapshot) => {
      let scripts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScriptData));
      scripts.sort((a, b) => (b.deletedAt?.toMillis() || 0) - (a.deletedAt?.toMillis() || 0));
      callback(scripts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scripts');
      // Fallback manual filter if query fails due to missing index
      const fallbackQ = query(collection(db, 'scripts'), where('userId', '==', user.uid));
      onSnapshot(fallbackQ, (fallbackSnap) => {
        let scripts = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScriptData));
        scripts = scripts.filter(s => s.isDeleted);
        scripts.sort((a, b) => (b.deletedAt?.toMillis() || 0) - (a.deletedAt?.toMillis() || 0));
        callback(scripts);
      });
    });
  }
}
