import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

let supabaseClient: any = null;

export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );
  }
  return supabaseClient;
}
