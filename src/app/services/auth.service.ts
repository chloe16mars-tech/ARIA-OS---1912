console.log('%c[AUTH-STATIC] AuthService File Loaded', 'background: #222; color: #bada55; font-size: 20px;');

import { Injectable, signal, inject, ApplicationRef } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../../supabase';
import { LoggerService } from './logger.service';
import type { UserProfile } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private logger = inject(LoggerService);
  private appRef = inject(ApplicationRef);

  readonly currentUser = signal<User | null>(null);
  readonly currentSession = signal<Session | null>(null);
  readonly currentUserProfile = signal<UserProfile | null>(null);
  readonly isAuthReady = signal<boolean>(false);

  private readonly authReady: Promise<void>;

  constructor() {
    console.log('%c[AUTH-STATIC] Constructor Running', 'color: #00ff00; font-weight: bold;');

    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize();
    }

    this.authReady = new Promise<void>((resolve) => {
      let resolved = false;
      const markReady = () => {
        if (resolved) return;
        resolved = true;
        console.log('[AUTH-STATIC] Auth Ready Signal Fired');
        this.isAuthReady.set(true);
        resolve();
      };

      console.log('[AUTH-STATIC] Fetching Session...');
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          console.log('[AUTH-STATIC] Session Result:', session ? 'User Found' : 'No User');
          this.applySession(session);
          markReady();
        })
        .catch((err) => {
          console.error('[AUTH-STATIC] getSession ERROR:', err);
          markReady();
        });

      setTimeout(markReady, 5000); // 5s timeout
    });

    supabase.auth.onAuthStateChange((event, session) => {
      console.log(`%c[AUTH-EVENT] ${event}`, 'color: #ff00ff;', session?.user?.email);
      this.applySession(session);
      this.isAuthReady.set(true);
    });
  }

  isAnonymous(): boolean {
    return this.currentUser()?.is_anonymous ?? false;
  }

  waitForAuthReady(): Promise<void> {
    return this.authReady;
  }

  async loginWithGoogle(): Promise<void> {
    console.log('[AUTH-ACTION] loginWithGoogle triggered');
    try {
      if (Capacitor.isNativePlatform()) {
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;
        if (!idToken) throw new Error('No ID token');
        const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin + '/auth/callback' }
        });
        if (error) throw error;
      }
    } catch (err) {
      console.error('[AUTH-ACTION] Login FAILED:', err);
      throw err;
    }
  }

  async loginAnonymously(): Promise<void> {
    await supabase.auth.signInAnonymously();
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getIdToken(): Promise<string | undefined> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  private applySession(session: Session | null): void {
    console.log('%c[AUTH-INTERNAL] applySession:', 'color: #aaa;', session ? session.user.id : 'NULL');
    this.currentSession.set(session);
    this.currentUser.set(session?.user ?? null);
    
    if (session?.user) {
      this.loadProfile(session.user);
    } else {
      this.currentUserProfile.set(null);
    }
  }

  private async loadProfile(user: User) {
    console.log('%c[AUTH-PROFILE] Loading for:', 'color: #00ff00;', user.id);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        const isAdmin = data.is_admin === true || data.isAdmin === true;
        console.log('%c[AUTH-PROFILE] SUCCESS. isAdmin:', 'background: #000; color: #fff;', isAdmin);
        this.currentUserProfile.set({
          isAdmin,
          email: data.email,
          displayName: data.display_name,
          photoURL: data.photo_url,
          createdAt: data.created_at ? new Date(data.created_at) : new Date()
        });
      } else {
        console.warn('[AUTH-PROFILE] Profile not found in table.');
        this.currentUserProfile.set({ isAdmin: false, email: user.email, createdAt: new Date() });
      }
    } catch (e) {
      console.error('[AUTH-PROFILE] Fetch error:', e);
    }
  }
}
