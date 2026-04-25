import { Injectable, signal } from '@angular/core';
import { supabase } from '../../supabase';
import { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  currentSession = signal<Session | null>(null);
  isAuthReady = signal<boolean>(false);

  isAnonymous(): boolean {
    return this.currentUser()?.is_anonymous ?? false;
  }

  constructor() {
    // Initialize Capacitor Google Auth plugin if native
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize();
    }

    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user || null);
      this.isAuthReady.set(true);
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user || null);
      this.isAuthReady.set(true);
    });
  }

  async waitForAuthReady(): Promise<void> {
    if (this.isAuthReady()) return;
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.isAuthReady()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      // Sécurité : Timeout après 10 secondes pour ne pas bloquer l'app éternellement
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 10000);
    });
  }

  async loginWithGoogle() {
    try {
      if (Capacitor.isNativePlatform()) {
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;
        if (!idToken) throw new Error('No ID token found from Google Auth');
        
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  }

  async loginAnonymously() {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    } catch (error) {
      console.error('Anonymous login failed', error);
      throw error;
    }
  }

  async logout() {
    try {
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut().catch(() => {});
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout failed', error);
      throw error;
    }
  }

  async getIdToken(): Promise<string | undefined> {
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token;
  }
}
