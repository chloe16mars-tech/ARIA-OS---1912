import { Injectable, signal, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../../supabase';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private logger = inject(LoggerService);

  readonly currentUser = signal<User | null>(null);
  readonly currentSession = signal<Session | null>(null);
  readonly isAuthReady = signal<boolean>(false);

  /**
   * Resolves once the initial Supabase session lookup has finished.
   * Stored as a Promise (not a polling loop) to avoid wasted ticks.
   */
  private readonly authReady: Promise<void>;

  constructor() {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize();
    }

    this.authReady = new Promise<void>((resolve) => {
      let resolved = false;
      const markReady = () => {
        if (resolved) return;
        resolved = true;
        this.isAuthReady.set(true);
        resolve();
      };

      // Initial fetch.
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          this.applySession(session);
          markReady();
        })
        .catch((err) => {
          this.logger.error('AuthService', 'getSession failed', err);
          markReady();
        });

      // Safety net — never block the app for more than 10 s on auth.
      setTimeout(markReady, 10_000);
    });

    // Keep state in sync with all subsequent auth events.
    supabase.auth.onAuthStateChange((_event, session) => {
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
    try {
      if (Capacitor.isNativePlatform()) {
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;
        if (!idToken) throw new Error('No ID token returned by GoogleAuth.');
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) throw error;
      }
    } catch (err) {
      this.logger.error('AuthService', 'login failed', err);
      throw err;
    }
  }

  async loginAnonymously(): Promise<void> {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      this.logger.error('AuthService', 'anonymous login failed', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut().catch(() => undefined);
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      this.logger.error('AuthService', 'logout failed', err);
      throw err;
    }
  }

  async getIdToken(): Promise<string | undefined> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  private applySession(session: Session | null): void {
    this.currentSession.set(session);
    this.currentUser.set(session?.user ?? null);
  }
}
