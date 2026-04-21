import { Injectable, signal } from '@angular/core';
import { auth, db } from '../../firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  isAuthReady = signal<boolean>(false);

  isAnonymous(): boolean {
    return this.currentUser()?.isAnonymous ?? false;
  }

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser.set(user);
      this.isAuthReady.set(true);
      if (user) {
        this.ensureUserDocument(user).catch(console.error);
      }
    });
  }

  waitForAuthReady(): Promise<void> {
    if (this.isAuthReady()) return Promise.resolve();
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe();
        this.isAuthReady.set(true);
        resolve();
      });
    });
  }

  private async ensureUserDocument(user: User) {
    if (!user || user.isAnonymous) return;
    
    const userRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        try {
          await setDoc(userRef, {
            email: user.email || null,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            createdAt: serverTimestamp(),
            generationCount: 0
          });
        } catch (setErr) {
          console.error("Error creating user document (setDoc permissions might be missing): ", setErr);
        }
      }
    } catch (error) {
      console.error("Error checking user document (getDoc permissions might be missing): ", error);
      // We don't throw here to avoid completely breaking the login flow
    }
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      if (Capacitor.isNativePlatform()) {
        // Native platforms fail with Popup, redirect is the fallback web-based method for mobile
        // Ideally we would use @capacitor-firebase/authentication for true native Google accounts
        await signInWithRedirect(auth, provider);
      } else {
        const credential = await signInWithPopup(auth, provider);
        this.currentUser.set(credential.user);
        this.ensureUserDocument(credential.user).catch(console.error);
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  }

  async loginAnonymously() {
    try {
      const credential = await signInAnonymously(auth);
      this.currentUser.set(credential.user);
    } catch (error) {
      console.error('Anonymous login failed', error);
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
      throw error;
    }
  }
}
