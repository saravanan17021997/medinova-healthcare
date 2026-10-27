import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Browser Supabase client for the admin panel.
// Only the PUBLIC (publishable / anon) key belongs here. Access to data is
// enforced in the database by Row Level Security, not by this file.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

/** Refuse secret keys, so a copy-paste mistake can never ship one to the browser. */
function keyProblem(k: string): string | null {
  if (k.startsWith('sb_secret_')) return 'VITE_SUPABASE_ANON_KEY contains a SECRET key. Use the publishable (anon) key instead, and rotate the secret key in Supabase.';
  const parts = k.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload?.role === 'service_role') return 'VITE_SUPABASE_ANON_KEY contains the service_role key. Use the anon (publishable) key instead, and rotate the service_role key in Supabase.';
    } catch {
      /* not a JWT: new-style publishable keys are fine */
    }
  }
  return null;
}

export const supabaseProblem: string | null = !url || !key ? 'missing' : keyProblem(key);

export const supabase: SupabaseClient | null =
  url && key && !supabaseProblem
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'saradev-admin-auth' },
      })
    : null;
