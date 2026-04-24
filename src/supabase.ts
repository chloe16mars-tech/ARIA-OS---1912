import { createClient } from '@supabase/supabase-js';

// Helper to get environment variables safely in both browser and SSR
const getEnv = (name: string): string => {
  // 1. Try process.env (Server-side)
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name] as string;
  }
  
  // 2. Try window/global properties (Client-side/SSR)
  try {
    if (typeof window !== 'undefined' && (window as any)[name]) {
      return (window as any)[name];
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any)[name]) {
      return (globalThis as any)[name];
    }
  } catch (e) {
    // Ignore
  }

  // 3. Try direct access if the build system replaces constants
  if (name === 'SUPABASE_URL') {
    try { return (SUPABASE_URL as any); } catch(e) {}
  }
  if (name === 'SUPABASE_ANON_KEY') {
    try { return (SUPABASE_ANON_KEY as any); } catch(e) {}
  }

  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Log keys existence (don't log values for security)
if (typeof window !== 'undefined') {
  console.log('Supabase Configuration Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'none'
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
