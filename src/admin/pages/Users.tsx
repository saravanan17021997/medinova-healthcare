import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Loader2, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SelectField, TextField, buttonClass } from '@/components/ui';
import { isEmail } from '@/lib/validation';
import { useAdminMeta } from '../components';
import { useAdminAuth, type AdminRole } from '../auth';
import { Card, ConfirmDialog, LoadError, PageHeader, dbError, formatWhen, useToast } from '../ui';

interface Row { user_id: string; email: string; role: AdminRole; created_at: string }

export const ROLE_INFO: Record<AdminRole, string> = {
  owner: 'Everything, including admin users and deleting requests, messages and orders.',
  editor: 'Products, doctors, website content, appointments, orders and messages. Cannot manage admin users or delete requests.',
};

/** Database messages for admin changes, in words an owner can act on. */
function adminError(e: { code?: string; message?: string } | null): string {
  const m = e?.message ?? '';
  if (/last owner/i.test(m)) return 'This is the only owner. Make someone else an owner first, then try again.';
  if (/No login exists/i.test(m)) return m.replace('Create the user in Authentication first.', 'Create their login first (see the steps below), then add them here.');
  if (/Only an owner/i.test(m)) return 'Only an owner can change admin users.';
  return dbError(e, 'admin');
}

export function AdminUsers() {
  useAdminMeta('Admin users');
  const toast = useToast();
  const { role: myRole, email: myEmail, retry, signOut } = useAdminAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('editor');
  const [formError, setFormError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Row | null>(null);
  const [demoting, setDemoting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const { data, error: e } = await supabase.from('sd_admins').select('user_id,email,role,created_at').order('created_at');
    if (e) return setError('Admin users could not be loaded. ' + dbError(e));
    setRows(data as Row[]);
  }, []);
  useEffect(() => {
    if (myRole === 'owner') load();
  }, [load, myRole]);

  if (myRole !== 'owner') {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-card ring-1 ring-line/70">
        <ShieldCheck className="mx-auto h-8 w-8 text-teal" aria-hidden />
        <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Only owners can manage admin users</h1>
        <p className="mt-2 text-slate">Ask an owner if someone needs access to the admin panel.</p>
      </div>
    );
  }

  const owners = (rows ?? []).filter((r) => r.role === 'owner').length;
  const isMe = (r: Row) => r.email.toLowerCase() === (myEmail ?? '').toLowerCase();

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const clean = email.trim().toLowerCase();
    setFormError(null);
    if (!isEmail(clean)) {
      setFormError('Enter the email address they sign in with.');
      return emailRef.current?.focus();
    }
    const existing = rows?.find((r) => r.email.toLowerCase() === clean);
    if (existing) {
      setFormError(`${clean} is already an ${existing.role}. Change their role in the list instead.`);
      return;
    }
    setAdding(true);
    const { error: err } = await supabase.rpc('sd_add_admin', { p_email: clean, p_role: role });
    setAdding(false);
    if (err) return setFormError(adminError(err));
    toast('success', `${clean} can now sign in to the admin panel as an ${role}.`);
    setEmail('');
    setRole('editor');
    load();
  };

  const changeRole = async (r: Row, next: AdminRole) => {
    if (!supabase || next === r.role) return;
    if (r.role === 'owner' && next === 'editor' && isMe(r)) return setDemoting(r);
    await applyRole(r, next);
  };
  const applyRole = async (r: Row, next: AdminRole) => {
    if (!supabase) return;
    setBusy(true);
    const { error: err } = await supabase.from('sd_admins').update({ role: next }).eq('user_id', r.user_id).select('user_id').single();
    setBusy(false);
    setDemoting(null);
    if (err) {
      toast('error', adminError(err));
      return load();
    }
    toast('success', `${r.email} is now an ${next}.`);
    if (isMe(r)) retry();
    else load();
  };

  const remove = async () => {
    if (!supabase || !removing) return;
    setBusy(true);
    const { error: err } = await supabase.from('sd_admins').delete().eq('user_id', removing.user_id).select('user_id').single();
    setBusy(false);
    if (err) {
      toast('error', adminError(err));
      setRemoving(null);
      return;
    }
    const me = isMe(removing);
    toast('success', `${removing.email} no longer has admin access.`);
    setRemoving(null);
    if (me) await signOut();
    else load();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Admin users" description="People who can sign in to this admin panel. Removing someone here does not delete their login or affect other apps that use the same Supabase project." />
      {error ? (
        <LoadError message={error} onRetry={load} />
      ) : !rows ? (
        <p role="status" className="text-slate">Loading admin users…</p>
      ) : (
        <div className="space-y-6">
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70">
            {rows.map((r) => {
              const lastOwner = r.role === 'owner' && owners <= 1;
              return (
                <li key={r.user_id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-5" data-testid="admin-row">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="font-semibold text-ink [overflow-wrap:anywhere]">
                      {r.email} {isMe(r) && <span className="ml-1 rounded-full bg-aqua-100 px-2 py-0.5 text-xs font-semibold text-ink">You</span>}
                    </p>
                    <p className="text-sm text-slate">Added {formatWhen(r.created_at)}</p>
                    {lastOwner && <p className="mt-1 text-xs text-slate">The only owner cannot be removed or made an editor.</p>}
                  </div>
                  <div className="w-44">
                    <label htmlFor={`role-${r.user_id}`} className="sr-only">Role for {r.email}</label>
                    <select id={`role-${r.user_id}`} value={r.role} disabled={busy || lastOwner} onChange={(e) => changeRole(r, e.target.value as AdminRole)} className="h-10 w-full rounded-xl border border-line bg-white px-3 text-[15px] text-ink disabled:bg-mist disabled:text-slate">
                      <option value="owner">Owner</option>
                      <option value="editor">Editor</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => (lastOwner ? toast('error', 'This is the only owner. Make someone else an owner first.') : setRemoving(r))}
                    aria-label={`Remove ${r.email}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#B3261E] hover:bg-[#B3261E]/10"
                  >
                    <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>

          <Card title="Add an admin" id="add-admin">
            <form onSubmit={add} noValidate className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-start">
              <TextField ref={emailRef} id="au-email" label="Email" type="email" autoComplete="off" value={email} onChange={(e) => { setEmail(e.target.value); setFormError(null); }} error={formError ?? undefined} />
              <SelectField id="au-role" label="Role" value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
                <option value="editor">Editor</option>
                <option value="owner">Owner</option>
              </SelectField>
              <button type="submit" disabled={adding} className={buttonClass('primary', 'md', 'sm:mt-7')}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <UserPlus className="h-4 w-4" aria-hidden />} Add admin
              </button>
            </form>
            <p className="mt-3 text-sm text-slate">
              <span className="font-semibold text-ink">{role === 'owner' ? 'Owner' : 'Editor'}:</span> {ROLE_INFO[role]}
            </p>
            <div className="mt-5 rounded-xl bg-mist p-4 text-sm text-slate">
              <p className="font-semibold text-ink">They need a login first</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>In Supabase, open Authentication, then Users, then Add user.</li>
                <li>Enter their email and a temporary password, and tick “Auto Confirm User”.</li>
                <li>Add the same email here, then send them the password privately. They can change it after signing in.</li>
              </ol>
              <p className="mt-2">There is no public sign-up page, so nobody can make themselves an admin.</p>
            </div>
          </Card>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        title={removing && isMe(removing) ? 'Remove your own access?' : `Remove ${removing?.email}?`}
        confirmLabel="Remove access"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      >
        {removing && isMe(removing) ? 'You will be signed out and will not be able to open the admin panel again unless another owner adds you back.' : 'They will no longer be able to open the admin panel. Their login is kept, and you can add them back at any time.'}
      </ConfirmDialog>
      <ConfirmDialog open={Boolean(demoting)} title="Make yourself an editor?" confirmLabel="Make me an editor" busy={busy} onConfirm={() => demoting && applyRole(demoting, 'editor')} onCancel={() => { setDemoting(null); load(); }}>
        You will no longer be able to manage admin users or delete requests. Another owner can make you an owner again.
      </ConfirmDialog>
    </div>
  );
}
