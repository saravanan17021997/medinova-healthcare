// Supabase connection settings, shared by the public store (plain fetch) and
// the admin panel (supabase-js). Both values are PUBLIC by design. Data access
// is decided by Row Level Security in the database, not by this file.
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim().replace(/\/$/, '') || '';
export const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

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

/** 'missing' when not configured, a message when the key is unsafe, otherwise null. */
export const supabaseProblem: string | null = !SUPABASE_URL || !SUPABASE_KEY ? 'missing' : keyProblem(SUPABASE_KEY);
export const supabaseReady = supabaseProblem === null;
