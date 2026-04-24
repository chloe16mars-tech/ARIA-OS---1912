import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'];
const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for the server.');
}

// Client for checking sessions (anon key is enough usually, but we might want service role for deletions)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for restricted operations
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;
