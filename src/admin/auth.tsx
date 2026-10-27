import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseProblem } from '@/lib/supabase';

export type AdminRole = 'owner' | 'editor';
export type AdminStatus = 'loading' | 'unconfigured' | 'signed-out' | 'not-admin' | 'admin' | 'error';

interface AdminAuth {
  status: AdminStatus;
  email: string | null;
  role: AdminRole | null;
  /** Set when status is 'error' or 'unconfigured'. */
  problem: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  retry: () => void;
}

const Ctx = createContext<AdminAuth | null>(null);

/** Turns Supabase sign-in errors into plain instructions. */
function signInMessage(err: { message?: string; status?: number; code?: string }): string {
  const m = (err.message || '').toLowerCase();
  if (err.status === 429 || m.includes('rate limit') || m.includes('too many')) return 'Too many sign-in attempts. Wait a minute, then try again.';
  if (m.includes('invalid login credentials') || err.code === 'invalid_credentials') return 'Email or password is incorrect.';
  if (m.includes('email not confirmed')) return 'This email address has not been confirmed yet. Confirm it in Supabase → Authentication → Users.';
  if (m.includes('fetch') || m.includes('network')) return 'Could not reach the sign-in service. Check your internet connection and try again.';
  return 'Sign-in failed. Try again in a moment.';
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AdminAuth, 'signIn' | 'signOut' | 'retry'>>(() =>
    supabase
      ? { status: 'loading', email: null, role: null, problem: null }
      : { status: 'unconfigured', email: null, role: null, problem: supabaseProblem },
  );
  const latest = useRef(0);

  // Who is signed in, and are they on the sd_admins allow-list?
  // RLS lets a signed-in user read only their own row, so this query cannot
  // reveal anyone else. The database also re-checks admin rights on every call.
  const resolve = useCallback(async (session: Session | null) => {
    const run = ++latest.current;
    if (!supabase) return;
    if (!session) {
      setState({ status: 'signed-out', email: null, role: null, problem: null });
      return;
    }
    const { data, error } = await supabase.from('sd_admins').select('role').eq('user_id', session.user.id).limit(1);
    if (run !== latest.current) return;
    if (error) {
      setState({ status: 'error', email: session.user.email ?? null, role: null, problem: 'Could not check your admin access. ' + error.message });
    } else if (!data?.length) {
      setState({ status: 'not-admin', email: session.user.email ?? null, role: null, problem: null });
    } else {
      setState({ status: 'admin', email: session.user.email ?? null, role: data[0].role as AdminRole, problem: null });
    }
  }, []);

  const check = useCallback(() => {
    if (!supabase) return;
    setState((s) => ({ ...s, status: 'loading' }));
    supabase.auth.getSession().then(({ data }) => resolve(data.session));
  }, [resolve]);

  useEffect(() => {
    if (!supabase) return;
    check();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer: calling Supabase inside this callback can deadlock the client.
      setTimeout(() => resolve(session), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [check, resolve]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'The admin panel is not connected to Supabase yet.';
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error ? signInMessage(error) : null;
    } catch (e) {
      return signInMessage({ message: (e as Error).message });
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut().catch(() => supabase!.auth.signOut({ scope: 'local' }));
    setState({ status: 'signed-out', email: null, role: null, problem: null });
  }, []);

  const value = useMemo(() => ({ ...state, signIn, signOut, retry: check }), [state, signIn, signOut, check]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return v;
}
