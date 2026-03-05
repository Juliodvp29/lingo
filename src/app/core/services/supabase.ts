import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor() {
    // Initialize Supabase client using environment variables
    this.client = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }
}
