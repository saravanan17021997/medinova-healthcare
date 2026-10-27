import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, ImageOff, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TextArea, TextField, buttonClass } from '@/components/ui';
import { cx } from '@/lib/format';
import { useAdminMeta } from '../components';
import { Card, ConfirmDialog, LoadError, PageHeader, SLUG_RE, Toggle, dbError, slugify, useToast } from '../ui';
import { pathFromPublicUrl, removeFiles } from '../storage';
import { PhotoField } from '../PhotoField';

interface Row { id: string; slug: string; name: string; description: string; image_url: string | null; image_small_url: string | null; sort_order: number; published: boolean }

export function AdminFacilities() {
  useAdminMeta('Facilities');
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const { data, error: e } = await supabase.from('sd_facilities').select('id,slug,name,description,image_url,image_small_url,sort_order,published').order('sort_order').order('name');
    if (e) return setError('Facilities could not be loaded. ' + dbError(e));
    setRows(data as Row[]);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const move = async (i: number, dir: -1 | 1) => {
    if (!rows || !supabase || !rows[i + dir]) return;
    const list = [...rows];
    [list[i], list[i + dir]] = [list[i + dir], list[i]];
    setBusy(true);
    const results = await Promise.all(list.map((r, k) => (r.sort_order === k + 1 ? null : supabase!.from('sd_facilities').update({ sort_order: k + 1 }).eq('id', r.id))).filter(Boolean));
    setBusy(false);
    const failed = results.find((x) => x?.error);
    if (failed?.error) toast('error', dbError(failed.error, 'facility'));
    load();
  };

  const toggle = async (r: Row, published: boolean) => {
    if (!supabase) return;
    const { error: e } = await supabase.from('sd_facilities').update({ published }).eq('id', r.id).select('id').single();
    if (e) return toast('error', dbError(e, 'facility'));
    setRows((rs) => rs?.map((x) => (x.id === r.id ? { ...x, published } : x)) ?? null);
    toast('success', published ? `“${r.name}” is shown on the website.` : `“${r.name}” is hidden from the website.`);
  };

  const confirmDelete = async () => {
    if (!supabase || !deleting) return;
    setBusy(true);
    const { error: e } = await supabase.from('sd_facilities').delete().eq('id', deleting.id).select('id').single();
    setBusy(false);
    if (e) return toast('error', dbError(e, 'facility'));
    await removeFiles([pathFromPublicUrl(deleting.image_url)]);
    toast('success', `“${deleting.name}” was deleted.`);
    setDeleting(null);
    load();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Facilities"
        description="The spaces shown on the Facilities page, in this order. Show only facilities you have checked, ideally with real photographs."
        actions={
          <Link to="/admin/facilities/new" className={buttonClass('primary', 'md')}>
            <Plus className="h-5 w-5" aria-hidden /> Add facility
          </Link>
        }
      />
      {error ? (
        <LoadError message={error} onRetry={load} />
      ) : !rows ? (
        <p role="status" className="text-slate">Loading facilities…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-card ring-1 ring-line/70">
          <p className="font-semibold text-ink">No facilities yet</p>
          <p className="mt-1 text-slate">The Facilities page says they are being updated until you add one.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70">
          {rows.map((r, i) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap sm:px-5" data-testid="facility-row">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label={`Move ${r.name} up`} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30">
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={busy || i === rows.length - 1} aria-label={`Move ${r.name} down`} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30">
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="h-12 w-[72px] shrink-0 overflow-hidden rounded-xl bg-mist">
                {r.image_url ? <img src={r.image_small_url || r.image_url} alt="" width={72} height={48} loading="lazy" className="h-full w-full object-cover" /> : <ImageOff className="m-auto mt-3 h-5 w-5 text-slate/50" aria-label="No image" />}
              </div>
              <div className="min-w-0 flex-1 basis-40">
                <Link to={`/admin/facilities/${r.id}`} className="font-semibold text-ink hover:underline">
                  {r.name}
                </Link>
                <p className="truncate text-sm text-slate">{r.description || 'No description'}</p>
              </div>
              <div className="w-28">
                <Toggle checked={r.published} onChange={(v) => toggle(r, v)} label={r.published ? 'Shown' : 'Hidden'} />
              </div>
              <div className="ml-auto flex gap-1">
                <Link to={`/admin/facilities/${r.id}`} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist" aria-label={`Edit ${r.name}`}>
                  <Pencil className="h-[18px] w-[18px]" aria-hidden />
                </Link>
                <button type="button" onClick={() => setDeleting(r)} className="flex h-10 w-10 items-center justify-center rounded-full text-[#B3261E] hover:bg-[#B3261E]/10" aria-label={`Delete ${r.name}`}>
                  <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={Boolean(deleting)} title={`Delete “${deleting?.name}”?`} confirmLabel="Delete facility" busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)}>
        It is removed from the Facilities page, along with its uploaded image. To take it offline for now, switch it to Hidden instead.
      </ConfirmDialog>
    </div>
  );
}

interface Form { name: string; slug: string; description: string; image_alt: string; published: boolean }
const EMPTY: Form = { name: '', slug: '', description: '', image_alt: '', published: false };

export function AdminFacilityForm() {
  const { id } = useParams();
  const isNew = !id;
  useAdminMeta(isNew ? 'Add facility' : 'Edit facility');
  const toast = useToast();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saved, setSaved] = useState<Form>(EMPTY);
  const [image, setImage] = useState<{ url: string | null; smallUrl: string | null }>({ url: null, smallUrl: null });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const load = useCallback(async () => {
    if (!supabase || !id) return;
    setLoading(true);
    const { data, error } = await supabase.from('sd_facilities').select('*').eq('id', id).maybeSingle();
    if (error || !data) {
      setLoadError(error ? 'The facility could not be loaded. ' + dbError(error) : 'This facility does not exist. It may have been deleted.');
      return setLoading(false);
    }
    const f: Form = { name: data.name, slug: data.slug, description: data.description ?? '', image_alt: data.image_alt ?? '', published: data.published };
    setForm(f);
    setSaved(f);
    setImage({ url: data.image_url, smallUrl: data.image_small_url });
    setLoading(false);
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v, ...(k === 'name' && !slugTouched ? { slug: slugify(String(v)) } : {}) }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const err: typeof errors = {};
    if (!form.name.trim() || form.name.trim().length > 100) err.name = 'Enter a name (up to 100 characters).';
    if (!SLUG_RE.test(form.slug)) err.slug = 'Use lowercase letters, numbers and single hyphens.';
    if (form.description.length > 600) err.description = 'Keep the description to 600 characters.';
    if (form.image_alt.length > 200) err.image_alt = 'Keep the description to 200 characters.';
    setErrors(err);
    if (Object.keys(err).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setSaving(true);
    const payload = { name: form.name.trim(), slug: form.slug, description: form.description.trim(), image_alt: form.image_alt.trim(), published: form.published };
    let res;
    if (isNew) {
      const max = await supabase.from('sd_facilities').select('sort_order').order('sort_order', { ascending: false }).limit(1);
      res = await supabase.from('sd_facilities').insert({ ...payload, sort_order: (max.data?.[0]?.sort_order ?? 0) + 1 }).select('id').single();
    } else res = await supabase.from('sd_facilities').update(payload).eq('id', id!).select('id').single();
    setSaving(false);
    if (res.error) {
      const msg = dbError(res.error, 'facility');
      if (/slug/.test(msg)) setErrors({ slug: msg });
      return toast('error', msg);
    }
    setSaved(form);
    if (isNew) {
      toast('success', `“${payload.name}” was created. Add an image below.`);
      navigate(`/admin/facilities/${res.data.id}`, { replace: true });
    } else toast('success', 'Changes saved.');
  };

  if (loading) return <p role="status" className="mx-auto max-w-4xl text-slate">Loading…</p>;
  if (loadError) return <div className="mx-auto max-w-4xl"><LoadError message={loadError} onRetry={load} /></div>;

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin/facilities" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All facilities
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">{isNew ? 'Add facility' : saved.name}</h1>
        {!isNew && saved.published && (
          <a href="/facilities" target="_blank" rel="noreferrer" className={buttonClass('outline', 'sm')}>
            <ExternalLink className="h-4 w-4" aria-hidden /> View on website
          </a>
        )}
      </div>
      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
        <Card title="Details" id="details">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField id="ff-name" label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={100} />
            <TextField
              id="ff-slug" label="Short ID" hint="Used to tell facilities apart. Lowercase letters, numbers and hyphens." value={form.slug} error={errors.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
            />
            <div className="sm:col-span-2">
              <TextArea id="ff-desc" label="Description" optional rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} error={errors.description} hint={`${form.description.length}/600`} />
            </div>
          </div>
        </Card>
        <Card title="Image" id="image">
          {isNew ? (
            <p className="text-[15px] text-slate">Create the facility first, then you can add its image here.</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              <PhotoField table="sd_facilities" id={id!} prefix="image" folder="facilities" url={image.url} smallUrl={image.smallUrl} aspect="aspect-[3/2]" label="Facility image" hint="Landscape, ideally 1200 × 800 px. JPEG, PNG, WebP or AVIF up to 5 MB." onChange={setImage} />
              <TextField id="ff-alt" label="Image description" optional hint="What the image shows, for people using screen readers." value={form.image_alt} onChange={(e) => set('image_alt', e.target.value)} error={errors.image_alt} />
            </div>
          )}
        </Card>
        <Card title="Visibility" id="visibility">
          <Toggle checked={form.published} onChange={(v) => set('published', v)} label="Shown on the website" />
        </Card>
        <div className="sticky bottom-0 z-20 -mx-4 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
          <button type="submit" disabled={saving || (!isNew && !dirty)} className={buttonClass('primary', 'md')}>
            {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}
            {isNew ? 'Create facility' : 'Save changes'}
          </button>
          <span className={cx('text-sm', dirty ? 'font-medium text-ink' : 'text-slate')} aria-live="polite">
            {dirty ? 'You have unsaved changes.' : isNew ? '' : 'All changes saved.'}
          </span>
        </div>
      </form>
    </div>
  );
}
