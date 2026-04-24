import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
export const supabaseUrl = 'https://seqaczzjvrqveourhvxb.supabase.co';
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcWFjenpqdnJxdmVvdXJodnhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzQ0MDUsImV4cCI6MjA5MjYxMDQwNX0.lHuS_0QKpHnnIDX2AZJijdH5C0SnBR7Ii7B0CF4UqDg';

// Client Frontend (utilise la clé anonyme publique)
export const supabase = createClient(supabaseUrl, supabaseKey);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
