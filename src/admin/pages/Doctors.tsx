import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ImageOff, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { buttonClass } from '@/components/ui';
import { cx } from '@/lib/format';
import { useAdminMeta } from '../components';
import { ConfirmDialog, LoadError, PageHeader, Toggle, dbError, useToast } from '../ui';
import { pathFromPublicUrl, removeFiles } from '../storage';

interface Row { id: string; slug: string; name: string; role: string; specialty_id: string | null; photo_url: string | null; photo_small_url: string | null; is_demo: boolean; published: boolean; sort_order: number }
const field = 'h-11 w-full rounded-xl border border-line bg-white px-3 text-[15px] text-ink';

export function AdminDoctors() {
  useAdminMeta('Doctors');
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [specs, setSpecs] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const q = params.get('q') ?? '';
  const spec = params.get('specialty') ?? '';
  const status = params.get('status') ?? '';
  const update = (k: string, v: string) => {
    const n = new URLSearchParams(params);
    if (v) n.set(k, v);
    else n.delete(k);
    setParams(n, { replace: true });
  };

  const load = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const [d, s] = await Promise.all([
      supabase.from('sd_doctors').select('id,slug,name,role,specialty_id,photo_url,photo_small_url,is_demo,published,sort_order').order('sort_order').order('name'),
      supabase.from('sd_specialties').select('id,name').order('sort_order'),
    ]);
    if (d.error || s.error) return setError('Doctors could not be loaded. ' + dbError(d.error ?? s.error));
    setRows(d.data as Row[]);
    setSpecs(s.data);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const specName = useMemo(() => new Map(specs.map((s) => [s.id, s.name])), [specs]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        (!t || r.name.toLowerCase().includes(t) || r.role.toLowerCase().includes(t)) &&
        (!spec || r.specialty_id === spec) &&
        (!status || (status === 'published' ? r.published : status === 'draft' ? !r.published : status === 'demo' ? r.is_demo : !r.is_demo)),
    );
  }, [rows, q, spec, status]);

  const toggle = async (r: Row, published: boolean) => {
    if (!supabase) return;
    const { error: e } = await supabase.from('sd_doctors').update({ published }).eq('id', r.id).select('id').single();
    if (e) return toast('error', dbError(e, 'profile'));
    setRows((rs) => rs?.map((x) => (x.id === r.id ? { ...x, published } : x)) ?? null);
    toast('success', published ? `${r.name} is now shown on the website.` : `${r.name} is hidden from the website.`);
  };

  const confirmDelete = async () => {
    if (!supabase || !deleting) return;
    setBusy(true);
    const { error: e } = await supabase.from('sd_doctors').delete().eq('id', deleting.id).select('id').single();
    setBusy(false);
    if (e) return toast('error', dbError(e, 'profile'));
    await removeFiles([pathFromPublicUrl(deleting.photo_url)]);
    setRows((rs) => rs?.filter((x) => x.id !== deleting.id) ?? null);
    toast('success', `${deleting.name}’s profile was deleted.`);
    setDeleting(null);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Doctors"
        description="Team profiles on the website. A profile appears only when it is published and its specialty is shown."
        actions={
          <Link to="/admin/doctors/new" className={buttonClass('primary', 'md')}>
            <Plus className="h-5 w-5" aria-hidden /> Add doctor
          </Link>
        }
      />
      <div className="mb-5 grid gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-line/70 sm:grid-cols-3">
        <div className="relative">
          <label htmlFor="d-q" className="sr-only">
            Search doctors
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden />
          <input id="d-q" type="search" value={q} onChange={(e) => update('q', e.target.value)} placeholder="Search name or role" className={cx(field, 'pl-9')} />
        </div>
        <div>
          <label htmlFor="d-spec" className="sr-only">
            Specialty
          </label>
          <select id="d-spec" value={spec} onChange={(e) => update('specialty', e.target.value)} className={field}>
            <option value="">All specialties</option>
            {specs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="d-status" className="sr-only">
            Status
          </label>
          <select id="d-status" value={status} onChange={(e) => update('status', e.target.value)} className={field}>
            <option value="">Any status</option>
            <option value="published">Shown</option>
            <option value="draft">Hidden</option>
            <option value="demo">Demo profiles</option>
            <option value="real">Verified profiles</option>
          </select>
        </div>
      </div>

      {error ? (
        <LoadError message={error} onRetry={load} />
      ) : !rows ? (
        <p role="status" className="text-slate">
          Loading doctors…
        </p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-card ring-1 ring-line/70">
          <p className="font-semibold text-ink">{rows.length ? 'No profiles match these filters' : 'No doctor profiles yet'}</p>
          {rows.length > 0 && (
            <button type="button" onClick={() => setParams({}, { replace: true })} className={buttonClass('outline', 'md', 'mt-5')}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate" aria-live="polite">
            {list.length} {list.length === 1 ? 'profile' : 'profiles'}
          </p>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70">
            {list.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap sm:px-5" data-testid="doctor-row">
                <div className="h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-aqua-50">
                  {r.photo_url ? <img src={r.photo_small_url || r.photo_url} alt="" width={48} height={56} loading="lazy" className="h-full w-full object-cover object-top" /> : <ImageOff className="m-auto mt-4 h-5 w-5 text-slate/50" aria-label="No photo" />}
                </div>
                <div className="min-w-0 flex-1 basis-48">
                  <Link to={`/admin/doctors/${r.id}`} className="font-semibold text-ink hover:underline">
                    {r.name}
                  </Link>
                  <p className="truncate text-sm text-slate">
                    {r.role || 'No role'} · {r.specialty_id ? specName.get(r.specialty_id) : <span className="font-medium text-[#B3261E]">No specialty</span>}
                  </p>
                </div>
                <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-semibold', r.is_demo ? 'bg-signal/25 text-ink' : 'bg-teal/10 text-teal-700')}>{r.is_demo ? 'Demo profile' : 'Verified'}</span>
                <div className="w-28">
                  <Toggle checked={r.published} onChange={(v) => toggle(r, v)} label={r.published ? 'Shown' : 'Hidden'} />
                </div>
                <div className="ml-auto flex gap-1">
                  <Link to={`/admin/doctors/${r.id}`} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist" aria-label={`Edit ${r.name}`}>
                    <Pencil className="h-[18px] w-[18px]" aria-hidden />
                  </Link>
                  <button type="button" onClick={() => setDeleting(r)} className="flex h-10 w-10 items-center justify-center rounded-full text-[#B3261E] hover:bg-[#B3261E]/10" aria-label={`Delete ${r.name}`}>
                    <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <ConfirmDialog open={Boolean(deleting)} title={`Delete ${deleting?.name}’s profile?`} confirmLabel="Delete profile" busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)}>
        The profile and its photo are removed from the website. Past appointment requests keep the doctor’s name. To take it offline for now, switch it to Hidden instead.
      </ConfirmDialog>
    </div>
  );
}
