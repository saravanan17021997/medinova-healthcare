import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL, supabaseProblem, supabaseReady } from './supabaseConfig';

// Browser Supabase client for the admin panel (loaded only on /admin).
// Only the PUBLIC (publishable / anon) key belongs here.
export { supabaseProblem };

export const supabase: SupabaseClient | null = supabaseReady
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'saradev-admin-auth' },
    })
  : null;
