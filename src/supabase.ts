import { createClient } from '@supabase/supabase-js';
import { environment } from './environments/environment';

// Client Frontend (utilise la clé anonyme publique — RLS enforced côté Supabase)
// La clé anon est intentionnellement publique. Ne jamais utiliser la service_role ici.
export const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: SupabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
