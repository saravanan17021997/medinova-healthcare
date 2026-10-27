import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, Mail, MessageCircle, Phone, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SelectField, TextArea, buttonClass } from '@/components/ui';
import { cx } from '@/lib/format';
import { liveSite } from '@/config/live';
import { useAdminMeta } from '../components';
import { useAdminAuth } from '../auth';
import { ConfirmDialog, LoadError, PageHeader, dbError, formatWhen, useToast } from '../ui';
import { waNumber } from './Orders';

type Status = 'new' | 'read' | 'replied' | 'archived';
interface Row { id: string; reference: string; name: string; phone: string | null; email: string | null; message: string; status: Status; admin_notes: string | null; created_at: string; updated_at: string }

export const MESSAGE_STATUS: Record<Status, string> = { new: 'New', read: 'Read', replied: 'Replied', archived: 'Archived' };
const TONE: Record<Status, string> = { new: 'bg-signal/30 text-ink', read: 'bg-aqua-100 text-ink', replied: 'bg-teal text-white', archived: 'bg-mist text-slate' };
const PAGE = 20;
const COLS = 'id,reference,name,phone,email,message,status,admin_notes,created_at,updated_at';
const field = 'h-11 w-full rounded-xl border border-line bg-white px-3 text-[15px] text-ink';

function Detail({ row, onClose, onSaved, onDeleted }: { row: Row; onClose: () => void; onSaved: (r: Row) => void; onDeleted: (id: string) => void }) {
  const toast = useToast();
  const { role } = useAdminAuth();
  const [status, setStatus] = useState<Status>(row.status);
  const [notes, setNotes] = useState(row.admin_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dirty = status !== row.status || notes !== (row.admin_notes ?? '');

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !confirm && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, confirm]);

  const save = async () => {
    if (!supabase) return;
    if (notes.length > 2000) return toast('error', 'Keep the notes to 2000 characters.');
    setSaving(true);
    const { data, error } = await supabase.from('sd_contact_messages').update({ status, admin_notes: notes.trim() || null }).eq('id', row.id).select(COLS).single();
    setSaving(false);
    if (error) return toast('error', dbError(error, 'message'));
    onSaved(data as Row);
    toast('success', `${row.reference} saved: ${MESSAGE_STATUS[status]}.`);
  };

  const remove = async () => {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.from('sd_contact_messages').delete().eq('id', row.id).select('id').single();
    setBusy(false);
    if (error) return toast('error', dbError(error, 'message'));
    toast('success', `${row.reference} was deleted.`);
    onDeleted(row.id);
  };

  const greeting = `Hello ${row.name}, this is ${liveSite().name} replying to your message ${row.reference}.`;
  return (
    <div className="fixed inset-0 z-[65] flex justify-end bg-ink/40" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="msg-title" className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-lift">
        <header className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div>
            <p className="font-mono text-sm text-slate">{row.reference}</p>
            <h2 id="msg-title" className="font-display text-2xl font-semibold text-ink">
              {row.name}
            </h2>
            <p className="mt-1 text-sm text-slate">Received {formatWhen(row.created_at)}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <div className="flex-1 space-y-6 p-5">
          <p className="whitespace-pre-line rounded-2xl bg-mist p-4 text-[15px] leading-relaxed text-ink" data-testid="message-text">
            {row.message}
          </p>
          <div className="flex flex-wrap gap-2">
            {row.phone && (
              <>
                <a href={`tel:${row.phone}`} className={buttonClass('dark', 'sm')}>
                  <Phone className="h-4 w-4" aria-hidden /> Call
                </a>
                <a href={`https://wa.me/${waNumber(row.phone)}?text=${encodeURIComponent(greeting)}`} target="_blank" rel="noreferrer" className={buttonClass('outline', 'sm')}>
                  <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
                </a>
              </>
            )}
            {row.email && (
              <a href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: your message ${row.reference}`)}`} className={buttonClass(row.phone ? 'outline' : 'dark', 'sm')}>
                <Mail className="h-4 w-4" aria-hidden /> Email
              </a>
            )}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[15px]">
            <dt className="text-slate">Phone</dt>
            <dd className="text-ink">{row.phone || '—'}</dd>
            <dt className="text-slate">Email</dt>
            <dd className="break-all text-ink">{row.email || '—'}</dd>
          </dl>
          <SelectField id="msg-status" label="Status" value={status} onChange={(e) => setStatus(e.target.value as Status)} hint="Mark it Replied once you have answered, or Archived when nothing more is needed.">
            {Object.entries(MESSAGE_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </SelectField>
          <TextArea id="msg-notes" label="Team notes" optional rows={4} hint="Only admins can see these." value={notes} onChange={(e) => setNotes(e.target.value)} />
          <p className="text-xs text-slate">Last updated {formatWhen(row.updated_at)}</p>
        </div>
        <footer className="flex flex-wrap items-center gap-3 border-t border-line p-5">
          <button type="button" onClick={save} disabled={!dirty || saving} className={buttonClass('primary', 'md')}>
            {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />} Save
          </button>
          {role === 'owner' && (
            <button type="button" onClick={() => setConfirm(true)} className="ml-auto inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-[#B3261E] hover:bg-[#B3261E]/10">
              <Trash2 className="h-4 w-4" aria-hidden /> Delete
            </button>
          )}
        </footer>
      </section>
      <ConfirmDialog open={confirm} title={`Delete ${row.reference}?`} confirmLabel="Delete message" busy={busy} onConfirm={remove} onCancel={() => setConfirm(false)}>
        This permanently removes {row.name}’s message and its notes. To clear it from the list, mark it Archived instead.
      </ConfirmDialog>
    </div>
  );
}

export function AdminMessages() {
  useAdminMeta('Messages');
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState<Row | null>(null);
  const q = params.get('q') ?? '';
  const status = (params.get('status') ?? '') as Status | '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const update = (patch: Record<string, string>) => {
    const n = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    if (!('page' in patch)) n.delete('page');
    setParams(n, { replace: true });
  };

  const load = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const { data, error: e } = await supabase.from('sd_contact_messages').select(COLS).order('created_at', { ascending: false }).limit(1000);
    if (e) return setError('Messages could not be loaded. ' + dbError(e));
    setRows(data as Row[]);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  /** Opening a new message marks it as read. */
  const openRow = async (r: Row) => {
    setOpen(r);
    if (r.status !== 'new' || !supabase) return;
    const { data, error: e } = await supabase.from('sd_contact_messages').update({ status: 'read' }).eq('id', r.id).select(COLS).single();
    if (e) return toast('error', 'Could not mark the message as read. ' + dbError(e, 'message'));
    setRows((rs) => rs?.map((x) => (x.id === r.id ? (data as Row) : x)) ?? null);
    setOpen((o) => (o?.id === r.id ? (data as Row) : o));
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (rows ?? []).forEach((r) => (c[r.status] = (c[r.status] ?? 0) + 1));
    return c;
  }, [rows]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const digits = t.replace(/\D/g, '');
    return (rows ?? []).filter(
      (r) =>
        (!status || r.status === status) &&
        (!t || r.name.toLowerCase().includes(t) || r.reference.toLowerCase().includes(t) || (r.email ?? '').toLowerCase().includes(t) || r.message.toLowerCase().includes(t) || (digits.length >= 3 && (r.phone ?? '').includes(digits))),
    );
  }, [rows, q, status]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * PAGE, current * PAGE);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Messages"
        description="Messages sent from the contact page. Opening a new message marks it as read."
        actions={
          <button type="button" onClick={load} className={buttonClass('outline', 'md')}>
            <RefreshCw className="h-4 w-4" aria-hidden /> Refresh
          </button>
        }
      />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by status">
        {(['', ...Object.keys(MESSAGE_STATUS)] as (Status | '')[]).map((s) => (
          <button key={s || 'all'} type="button" aria-pressed={status === s} onClick={() => update({ status: s })} className={cx('h-10 shrink-0 rounded-full px-4 text-sm font-medium ring-1', status === s ? 'bg-ink text-white ring-ink' : 'bg-white text-ink ring-line hover:ring-teal')}>
            {s ? MESSAGE_STATUS[s] : 'All'} <span className="ml-1 tabular-nums opacity-70">{s ? counts[s] ?? 0 : rows?.length ?? 0}</span>
          </button>
        ))}
      </div>
      <div className="relative mb-5 max-w-md">
        <label htmlFor="m-q" className="sr-only">
          Search messages
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden />
        <input id="m-q" type="search" value={q} onChange={(e) => update({ q: e.target.value })} placeholder="Search name, phone, email, reference or text" className={cx(field, 'pl-9')} />
      </div>

      {error ? (
        <LoadError message={error} onRetry={load} />
      ) : !rows ? (
        <p role="status" className="text-slate">Loading messages…</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-card ring-1 ring-line/70">
          <p className="font-semibold text-ink">{rows.length ? 'No messages match' : 'No messages yet'}</p>
          <p className="mt-1 text-[15px] text-slate">{rows.length ? 'Clear the search or choose another status.' : 'Messages sent from the contact page will appear here.'}</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70">
            {shown.map((r) => (
              <li key={r.id} data-testid="message-row">
                <button type="button" onClick={() => openRow(r)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-mist/60 sm:flex-nowrap sm:px-5">
                  <span className={cx('w-20 shrink-0 rounded-full px-2.5 py-0.5 text-center text-xs font-semibold', TONE[r.status])}>{MESSAGE_STATUS[r.status]}</span>
                  <span className="min-w-0 flex-1 basis-48">
                    <span className={cx('block text-ink', r.status === 'new' ? 'font-bold' : 'font-semibold')}>{r.name}</span>
                    <span className="block truncate text-sm text-slate">{r.message}</span>
                  </span>
                  <span className="hidden w-36 text-right text-xs text-slate md:block">
                    <span className="block font-mono">{r.reference}</span>
                    {formatWhen(r.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <nav aria-label="Pages" className="mt-4 flex items-center justify-between">
              <button type="button" disabled={current <= 1} onClick={() => update({ page: String(current - 1) })} className={buttonClass('outline', 'sm')}>
                <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
              </button>
              <span className="text-sm text-slate">
                Page {current} of {pages}
              </span>
              <button type="button" disabled={current >= pages} onClick={() => update({ page: String(current + 1) })} className={buttonClass('outline', 'sm')}>
                Next <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </nav>
          )}
        </>
      )}
      {open && (
        <Detail
          key={open.id + open.updated_at}
          row={open}
          onClose={() => setOpen(null)}
          onSaved={(r) => {
            setRows((rs) => rs?.map((x) => (x.id === r.id ? r : x)) ?? null);
            setOpen(r);
          }}
          onDeleted={(id) => {
            setRows((rs) => rs?.filter((x) => x.id !== id) ?? null);
            setOpen(null);
          }}
        />
      )}
    </div>
  );
}
