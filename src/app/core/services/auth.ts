import { computed, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { Router } from '@angular/router';
import { User } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _user = signal<User | null>(null);
  private _loading = signal<boolean>(true);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly isLoggedIn = computed(() => this._user() !== null);

  private get db() { return this.supabase.client; }

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.init();
  }


  private async init(): Promise<void> {
    // Check for existing session on startup
    const { data: { session } } = await this.db.auth.getSession();
    if (session) {
      await this.loadUserProfile(session.user.id);
    }
    this._loading.set(false);

    // React to auth state changes (login, logout)
    this.db.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await this.loadUserProfile(session.user.id);
      }
      if (event === 'SIGNED_OUT') {
        this._user.set(null);
        this.router.navigate(['/auth/login']);
      }
    });
  }

  private async loadUserProfile(userId: string): Promise<void> {
    // Fetch profile data from 'users' table and update signal
    const { data, error } = await this.db
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error cargando perfil:', error.message);
      return;
    }
    this._user.set(data as User);
  }


  async signUpWithEmail(email: string, password: string, displayName: string) {
    const { data, error } = await this.db.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } }
    });
    if (error) throw error;
    return data;
  }

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await this.db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    // Trigger OAuth flow with Google provider
    const { error } = await this.db.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/tabs/home' }
    });
    if (error) throw error;
  }

  async signOut() {
    await this.db.auth.signOut();
  }

  async updateProfile(updates: Partial<User>) {
    const userId = this._user()?.id;
    if (!userId) throw new Error('No hay sesión activa');

    const { error } = await this.db
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    await this.loadUserProfile(userId);
  }
}
