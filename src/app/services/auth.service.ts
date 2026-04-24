import { Injectable, signal } from '@angular/core';
import { supabase } from '../../supabase';
import { User, Session } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  session = signal<Session | null>(null);
  isAuthReady = signal<boolean>(false);

  // For compatibility with components expecting Firebase's isAnonymous
  isAnonymous(): boolean {
    return false; // We only use Google login now
  }

  constructor() {
    this.initAuth();
  }

  private async initAuth() {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    this.setAuth(session);

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      this.setAuth(session);
    });
  }

  private setAuth(session: Session | null) {
    this.session.set(session);
    this.currentUser.set(session?.user ?? null);
    this.isAuthReady.set(true);
    
    if (session?.user) {
      this.ensureUserDocument(session.user).catch(err => {
         console.error("Error ensuring user profile:", err);
      });
    }
  }

  waitForAuthReady(): Promise<void> {
    if (this.isAuthReady()) return Promise.resolve();
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn("Auth ready timed out. Proceeding anyway.");
        this.isAuthReady.set(true);
        resolve();
      }, 5000);

      const checkInterval = setInterval(() => {
        if (this.isAuthReady()) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  private async ensureUserDocument(user: User) {
    if (!user) return;
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') { // Not found
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          display_name: user.user_metadata?.['full_name'] || user.user_metadata?.['name'] || null,
          photo_url: user.user_metadata?.['avatar_url'] || null,
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error("Error creating profile:", insertError);
      }
    } else if (error) {
      console.error("Error checking profile:", error);
    }
  }

  async loginWithGoogle() {
    console.log('Initiating Google Login...');
    try {
      // 1. Get the OAuth URL first
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          skipBrowserRedirect: true
        }
      });

      console.log('Supabase OAuth URL response:', { data, error });

      if (error) throw error;
      
      if (data?.url) {
        // 2. Open the provider's URL directly in a popup
        // This is much more reliable in an iframe than a redirect
        const authWindow = window.open(data.url, 'google_login', 'width=600,height=700');
        
        if (!authWindow) {
          throw new Error('popup-blocked');
        }
      } else {
        throw new Error('No OAuth URL returned');
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  }

  async loginAnonymously() {
     // User wants to keep only Google login
     throw new Error("Connexion anonyme désactivée.");
  }

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      this.currentUser.set(null);
      this.session.set(null);
    } catch (error) {
      console.error('Logout failed', error);
      throw error;
    }
  }
}
