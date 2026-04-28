import { Injectable } from '@angular/core';
import { supabase } from '../../supabase';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  /**
   * Frontend Supabase client.
   * Access it via inject(SupabaseService).client
   */
  public readonly client = supabase;
}
