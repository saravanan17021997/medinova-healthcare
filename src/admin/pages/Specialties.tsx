import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, ImageOff, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SelectField, TextArea, TextField, buttonClass } from '@/components/ui';
import { SpecialtyIcon, SPECIALTY_ICONS } from '@/components/SpecialtyIcon';
import { cx } from '@/lib/format';
import { useAdminMeta } from '../components';
import { Card, ConfirmDialog, LoadError, PageHeader, SLUG_RE, Toggle, dbError, slugify, useToast } from '../ui';
import { pathFromPublicUrl, removeFiles } from '../storage';
import { PhotoField } from '../PhotoField';

interface Row { id: string; slug: string; name: string; summary: string; icon: string; image_url: string | null; image_small_url: string | null; sort_order: number; published: boolean; doctors: number }

export function AdminSpecialties() {
  useAdminMeta('Specialties');
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const { data, error: e } = await supabase.from('sd_specialties').select('id,slug,name,summary,icon,image_url,image_small_url,sort_order,published,sd_doctors(count)').order('sort_order').order('name');
    if (e) return setError('Specialties could not be loaded. ' + dbError(e));
    setRows((data as (Omit<Row, 'doctors'> & { sd_doctors: { count: number }[] })[]).map((r) => ({ ...r, summary: r.summary ?? '', doctors: r.sd_doctors?.[0]?.count ?? 0 })));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const move = async (i: number, dir: -1 | 1) => {
    if (!rows || !supabase || !rows[i + dir]) return;
    const a = rows[i];
    const b = rows[i + dir];
    const r1 = await supabase.from('sd_specialties').update({ sort_order: i + dir + 1 }).eq('id', a.id);
    const r2 = await supabase.from('sd_specialties').update({ sort_order: i + 1 }).eq('id', b.id);
    if (r1.error || r2.error) toast('error', dbError(r1.error ?? r2.error, 'specialty'));
    load();
  };

  const toggle = async (r: Row, published: boolean) => {
    if (!supabase) return;
    const { error: e } = await supabase.from('sd_specialties').update({ published }).eq('id', r.id).select('id').single();
    if (e) return toast('error', dbError(e, 'specialty'));
    setRows((rs) => rs?.map((x) => (x.id === r.id ? { ...x, published } : x)) ?? null);
    toast('success', published ? `“${r.name}” is shown on the website.` : `“${r.name}” and its ${r.doctors} ${r.doctors === 1 ? 'profile are' : 'profiles are'} hidden from the website.`);
  };

  const confirmDelete = async () => {
    if (!supabase || !deleting) return;
    setBusy(true);
    const { error: e } = await supabase.from('sd_specialties').delete().eq('id', deleting.id).select('id').single();
    setBusy(false);
    if (e) return toast('error', dbError(e, 'specialty'));
    await removeFiles([pathFromPublicUrl(deleting.image_url)]);
    toast('success', `“${deleting.name}” was deleted.`);
    setDeleting(null);
    load();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Specialties"
        description="Services shown on the website. Hiding a specialty also hides its doctor profiles and removes it from the appointment form."
        actions={
          <Link to="/admin/specialties/new" className={buttonClass('primary', 'md')}>
            <Plus className="h-5 w-5" aria-hidden /> Add specialty
          </Link>
        }
      />
      {error ? (
        <LoadError message={error} onRetry={load} />
      ) : !rows ? (
        <p role="status" className="text-slate">
          Loading specialties…
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70">
          {rows.map((r, i) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap sm:px-5" data-testid="specialty-row">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${r.name} up`} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30">
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Move ${r.name} down`} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30">
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-mist">{r.image_url ? <img src={r.image_small_url || r.image_url} alt="" width={64} height={48} loading="lazy" className="h-full w-full object-cover" /> : <ImageOff className="m-auto mt-3 h-5 w-5 text-slate/50" aria-label="No image" />}</div>
              <div className="min-w-0 flex-1 basis-40">
                <Link to={`/admin/specialties/${r.id}`} className="flex items-center gap-2 font-semibold text-ink hover:underline">
                  <SpecialtyIcon name={r.icon} className="h-4 w-4 text-teal" /> {r.name}
                </Link>
                <p className="truncate text-sm text-slate">
                  /{r.slug} · {r.doctors} {r.doctors === 1 ? 'doctor' : 'doctors'}
                </p>
              </div>
              <Toggle checked={r.published} onChange={(v) => toggle(r, v)} label={r.published ? 'Shown' : 'Hidden'} />
              <div className="ml-auto flex gap-1">
                <Link to={`/admin/specialties/${r.id}`} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist" aria-label={`Edit ${r.name}`}>
                  <Pencil className="h-[18px] w-[18px]" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={() => (r.doctors > 0 ? toast('error', `“${r.name}” has ${r.doctors} doctor ${r.doctors === 1 ? 'profile' : 'profiles'}. Move them to another specialty first, or hide it instead.`) : setDeleting(r))}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[#B3261E] hover:bg-[#B3261E]/10"
                  aria-label={`Delete ${r.name}`}
                >
                  <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={Boolean(deleting)} title={`Delete “${deleting?.name}”?`} confirmLabel="Delete specialty" busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)}>
        No doctor profiles use it. Past appointment requests keep the specialty name. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}

interface Form { name: string; slug: string; summary: string; description: string; reasons: string; icon: string; image_alt: string; published: boolean }
const EMPTY: Form = { name: '', slug: '', summary: '', description: '', reasons: '', icon: 'Stethoscope', image_alt: '', published: false };

export function AdminSpecialtyForm() {
  const { id } = useParams();
  const isNew = !id;
  useAdminMeta(isNew ? 'Add specialty' : 'Edit specialty');
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
    const { data, error } = await supabase.from('sd_specialties').select('*').eq('id', id).maybeSingle();
    if (error || !data) {
      setLoadError(error ? 'The specialty could not be loaded. ' + dbError(error) : 'This specialty does not exist. It may have been deleted.');
      return setLoading(false);
    }
    const f: Form = { name: data.name, slug: data.slug, summary: data.summary ?? '', description: data.description ?? '', reasons: (data.reasons ?? []).join('\n'), icon: data.icon ?? 'Stethoscope', image_alt: data.image_alt ?? '', published: data.published };
    setForm(f);
    setSaved(f);
    setImage({ url: data.image_url, smallUrl: data.image_small_url });
    setLoading(false);
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v, ...(k === 'name' && !slugTouched ? { slug: slugify(String(v)) } : {}) }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const err: typeof errors = {};
    if (!form.name.trim() || form.name.trim().length > 80) err.name = 'Enter a name (up to 80 characters).';
    if (!SLUG_RE.test(form.slug)) err.slug = 'Use lowercase letters, numbers and single hyphens.';
    if (form.summary.length > 200) err.summary = 'Keep the summary to 200 characters.';
    if (form.description.length > 4000) err.description = 'Keep the description to 4000 characters.';
    setErrors(err);
    if (Object.keys(err).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setSaving(true);
    const payload = { name: form.name.trim(), slug: form.slug, summary: form.summary.trim(), description: form.description.trim(), reasons: form.reasons.split('\n').map((x) => x.trim()).filter(Boolean), icon: form.icon, image_alt: form.image_alt.trim(), published: form.published };
    let res;
    if (isNew) {
      const max = await supabase.from('sd_specialties').select('sort_order').order('sort_order', { ascending: false }).limit(1);
      res = await supabase.from('sd_specialties').insert({ ...payload, sort_order: (max.data?.[0]?.sort_order ?? 0) + 1 }).select('id').single();
    } else res = await supabase.from('sd_specialties').update(payload).eq('id', id!).select('id').single();
    setSaving(false);
    if (res.error) {
      const msg = dbError(res.error, 'specialty');
      if (/slug/.test(msg)) setErrors({ slug: msg });
      return toast('error', msg);
    }
    setSaved(form);
    if (isNew) {
      toast('success', `“${payload.name}” was created. Add an image below.`);
      navigate(`/admin/specialties/${res.data.id}`, { replace: true });
    } else toast('success', 'Changes saved.');
  };

  if (loading) return <p role="status" className="mx-auto max-w-4xl text-slate">Loading…</p>;
  if (loadError) return <div className="mx-auto max-w-4xl"><LoadError message={loadError} onRetry={load} /></div>;

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin/specialties" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All specialties
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">{isNew ? 'Add specialty' : saved.name}</h1>
        {!isNew && saved.published && (
          <a href={`/specialties/${saved.slug}`} target="_blank" rel="noreferrer" className={buttonClass('outline', 'sm')}>
            <ExternalLink className="h-4 w-4" aria-hidden /> View on website
          </a>
        )}
      </div>
      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
        <Card title="Details" id="details">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField id="sf-name" label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={80} />
            <TextField
              id="sf-slug"
              label="Web address (slug)"
              hint={`Shown as /specialties/${form.slug || 'name'}`}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              error={errors.slug}
            />
            <div className="sm:col-span-2">
              <TextField id="sf-summary" label="Short summary" hint={`Shown on cards. ${form.summary.length}/200`} value={form.summary} onChange={(e) => set('summary', e.target.value)} error={errors.summary} />
            </div>
            <div className="sm:col-span-2">
              <TextArea id="sf-desc" label="Description" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} error={errors.description} />
            </div>
            <TextArea id="sf-reasons" label="Common reasons to visit" optional rows={5} hint="One per line" value={form.reasons} onChange={(e) => set('reasons', e.target.value)} />
            <div>
              <SelectField id="sf-icon" label="Icon" value={form.icon} onChange={(e) => set('icon', e.target.value)}>
                {SPECIALTY_ICONS.map((n) => (
                  <option key={n} value={n}>
                    {n.replace(/([a-z])([A-Z0-9])/g, '$1 $2')}
                  </option>
                ))}
              </SelectField>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate">
                Preview <SpecialtyIcon name={form.icon} className="h-6 w-6 text-teal" />
              </p>
            </div>
          </div>
        </Card>
        <Card title="Image" id="image">
          {isNew ? (
            <p className="text-[15px] text-slate">Create the specialty first, then you can add its image here.</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              <PhotoField table="sd_specialties" id={id!} prefix="image" folder="specialties" url={image.url} smallUrl={image.smallUrl} aspect="aspect-[4/3]" label="Specialty image" hint="Landscape, ideally 1200 × 900 px. JPEG, PNG, WebP or AVIF up to 5 MB." onChange={setImage} />
              <TextField id="sf-alt" label="Image description" optional hint="For screen readers" value={form.image_alt} onChange={(e) => set('image_alt', e.target.value)} />
            </div>
          )}
        </Card>
        <Card title="Visibility" id="visibility">
          <Toggle checked={form.published} onChange={(v) => set('published', v)} label="Shown on the website" />
        </Card>
        <div className="sticky bottom-0 z-20 -mx-4 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
          <button type="submit" disabled={saving || (!isNew && !dirty)} className={buttonClass('primary', 'md')}>
            {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}
            {isNew ? 'Create specialty' : 'Save changes'}
          </button>
          <span className={cx('text-sm', dirty ? 'font-medium text-ink' : 'text-slate')} aria-live="polite">
            {dirty ? 'You have unsaved changes.' : isNew ? '' : 'All changes saved.'}
          </span>
        </div>
      </form>
    </div>
  );
}
