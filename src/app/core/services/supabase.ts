import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      { auth: { lock: ((_name: string, _timeout: number, fn: () => Promise<unknown>) => fn()) as any } }
    );
  }
}
