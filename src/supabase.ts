import { createClient } from '@supabase/supabase-js';
import { environment } from './environments/environment';

/**
 * Frontend Supabase client. Uses the public anon key — RLS is enforced
 * server-side. Never replace this with the service role key.
 */
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

/**
 * Centralised error handler for Supabase calls. Throws an Error whose
 * `message` is human-readable and whose `cause` carries the structured
 * payload — easier to log and to surface in toasts.
 */
export function handleSupabaseError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const message = error instanceof Error ? error.message : String(error);
  const info: SupabaseErrorInfo = { error: message, operationType, path };
  console.error('[supabase]', operationType, path ?? '-', message);
  throw new Error(`Supabase ${operationType} failed at ${path ?? '?'}: ${message}`, {
    cause: info,
  });
}
