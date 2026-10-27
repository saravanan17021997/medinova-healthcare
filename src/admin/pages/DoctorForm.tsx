import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SelectField, TextArea, TextField, buttonClass } from '@/components/ui';
import { cx } from '@/lib/format';
import { useAdminMeta } from '../components';
import { Card, ConfirmDialog, LoadError, SLUG_RE, Toggle, dbError, slugify, useToast } from '../ui';
import { pathFromPublicUrl, removeFiles } from '../storage';
import { PhotoField } from '../PhotoField';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MODES = ['In person', 'Video'];

interface Form {
  name: string; slug: string; specialty_id: string; role: string; qualifications: string; registration_no: string; bio: string;
  languages: string; availability: string[]; modes: string[]; focus: string; photo_alt: string; is_demo: boolean; published: boolean;
}
type Errors = Partial<Record<keyof Form, string>>;
const EMPTY: Form = { name: '', slug: '', specialty_id: '', role: '', qualifications: '', registration_no: '', bio: '', languages: 'English', availability: [], modes: ['In person'], focus: '', photo_alt: '', is_demo: false, published: false };
const list = (s: string, sep: RegExp) => s.split(sep).map((x) => x.trim()).filter(Boolean);

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.name.trim() || f.name.trim().length > 100) e.name = 'Enter the name (up to 100 characters).';
  if (!SLUG_RE.test(f.slug)) e.slug = 'Use lowercase letters, numbers and single hyphens, e.g. anita-das.';
  if (!f.specialty_id) e.specialty_id = 'Choose a specialty.';
  if (f.role.length > 100) e.role = 'Keep the role to 100 characters.';
  if (f.qualifications.length > 300) e.qualifications = 'Keep it to 300 characters.';
  if (f.registration_no.length > 60) e.registration_no = 'Keep it to 60 characters.';
  if (f.bio.length > 4000) e.bio = `Keep the biography to 4000 characters (now ${f.bio.length}).`;
  if (!list(f.languages, /[,\n]/).length) e.languages = 'Add at least one language.';
  if (!f.modes.length) e.modes = 'Choose at least one way to consult.';
  if (!f.is_demo && f.published && !f.qualifications.trim()) e.qualifications = 'A verified profile needs its qualifications before it is published.';
  return e;
}

export function AdminDoctorForm() {
  const { id } = useParams();
  const isNew = !id;
  useAdminMeta(isNew ? 'Add doctor' : 'Edit doctor');
  const navigate = useNavigate();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saved, setSaved] = useState<Form>(EMPTY);
  const [photo, setPhoto] = useState<{ url: string | null; smallUrl: string | null }>({ url: null, smallUrl: null });
  const [specs, setSpecs] = useState<{ id: string; name: string; published: boolean }[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [deleting, setDeleting] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setLoadError(null);
    const s = await supabase.from('sd_specialties').select('id,name,published').order('sort_order');
    if (s.error) {
      setLoadError('Specialties could not be loaded. ' + dbError(s.error));
      return setLoading(false);
    }
    setSpecs(s.data);
    if (id) {
      const { data, error } = await supabase.from('sd_doctors').select('*').eq('id', id).maybeSingle();
      if (error || !data) {
        setLoadError(error ? 'The profile could not be loaded. ' + dbError(error) : 'This profile does not exist. It may have been deleted.');
        return setLoading(false);
      }
      const f: Form = {
        name: data.name, slug: data.slug, specialty_id: data.specialty_id ?? '', role: data.role ?? '', qualifications: data.qualifications ?? '',
        registration_no: data.registration_no ?? '', bio: data.bio ?? '', languages: (data.languages ?? []).join(', '), availability: data.availability ?? [],
        modes: data.modes ?? [], focus: (data.focus ?? []).join('\n'), photo_alt: data.photo_alt ?? '', is_demo: data.is_demo, published: data.published,
      };
      setForm(f);
      setSaved(f);
      setPhoto({ url: data.photo_url, smallUrl: data.photo_small_url });
    }
    setLoading(false);
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v, ...(k === 'name' && !slugTouched ? { slug: slugify(String(v)) } : {}) }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const flip = (k: 'availability' | 'modes', v: string, order: string[]) => set(k, (form[k].includes(v) ? form[k].filter((x) => x !== v) : [...form[k], v]).sort((a, b) => order.indexOf(a) - order.indexOf(b)));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const err = validate(form);
    setErrors(err);
    if (Object.keys(err).length) {
      toast('error', 'Check the highlighted fields.');
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(), slug: form.slug, specialty_id: form.specialty_id, role: form.role.trim(),
      qualifications: form.qualifications.trim() || null, registration_no: form.registration_no.trim() || null, bio: form.bio.trim() || null,
      languages: list(form.languages, /[,\n]/), availability: form.availability, modes: form.modes, focus: list(form.focus, /\n/),
      photo_alt: form.photo_alt.trim(), is_demo: form.is_demo, published: form.published,
    };
    const res = isNew ? await supabase.from('sd_doctors').insert(payload).select('id').single() : await supabase.from('sd_doctors').update(payload).eq('id', id!).select('id').single();
    setSaving(false);
    if (res.error) {
      const msg = dbError(res.error, 'profile');
      if (/slug/.test(msg)) setErrors({ slug: msg });
      return toast('error', msg);
    }
    setSaved(form);
    if (isNew) {
      toast('success', `${payload.name}’s profile was created. Add a photo below.`);
      navigate(`/admin/doctors/${res.data.id}`, { replace: true });
    } else toast('success', 'Changes saved.');
  };

  const confirmDelete = async () => {
    if (!supabase || !id) return;
    setBusyDelete(true);
    const { error } = await supabase.from('sd_doctors').delete().eq('id', id).select('id').single();
    if (error) {
      setBusyDelete(false);
      return toast('error', dbError(error, 'profile'));
    }
    await removeFiles([pathFromPublicUrl(photo.url)]);
    setSaved(form);
    toast('success', `${saved.name}’s profile was deleted.`);
    navigate('/admin/doctors', { replace: true });
  };

  if (loading) return <p role="status" className="mx-auto max-w-5xl text-slate">Loading…</p>;
  if (loadError)
    return (
      <div className="mx-auto max-w-5xl">
        <LoadError message={loadError} onRetry={load} />
        <Link to="/admin/doctors" className="mt-4 inline-block font-semibold text-teal-700 underline">
          Back to doctors
        </Link>
      </div>
    );
  const spec = specs.find((s) => s.id === form.specialty_id);

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/admin/doctors" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All doctors
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">{isNew ? 'Add doctor' : saved.name}</h1>
        {!isNew && saved.published && (
          <a href={`/doctors/${saved.slug}`} target="_blank" rel="noreferrer" className={buttonClass('outline', 'sm')}>
            <ExternalLink className="h-4 w-4" aria-hidden /> View on website
          </a>
        )}
      </div>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
        <Card title="Profile" id="profile">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField id="df-name" label="Name" hint="As it should appear, e.g. Dr. Anita Das" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={100} />
            <TextField
              id="df-slug"
              label="Web address (slug)"
              hint={`Shown as /doctors/${form.slug || 'name'}`}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              error={errors.slug}
            />
            <SelectField id="df-spec" label="Specialty" value={form.specialty_id} onChange={(e) => set('specialty_id', e.target.value)} error={errors.specialty_id} hint={spec && !spec.published ? 'This specialty is hidden, so this profile is hidden too.' : undefined}>
              <option value="">Choose a specialty</option>
              {specs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.published ? '' : ' (hidden)'}
                </option>
              ))}
            </SelectField>
            <TextField id="df-role" label="Role" optional hint="e.g. Cardiology consultant" value={form.role} onChange={(e) => set('role', e.target.value)} error={errors.role} />
            <TextField id="df-qual" label="Qualifications" optional hint="e.g. MBBS, MD (General Medicine)" value={form.qualifications} onChange={(e) => set('qualifications', e.target.value)} error={errors.qualifications} />
            <TextField id="df-reg" label="Registration number" optional hint="Medical council registration. Shown on verified profiles." value={form.registration_no} onChange={(e) => set('registration_no', e.target.value)} error={errors.registration_no} />
            <div className="sm:col-span-2">
              <TextArea id="df-bio" label="Biography" optional rows={5} hint={`Leave a blank line between paragraphs. ${form.bio.length}/4000`} value={form.bio} onChange={(e) => set('bio', e.target.value)} error={errors.bio} />
            </div>
          </div>
        </Card>

        <Card title="Availability" id="availability">
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField id="df-lang" label="Languages" hint="Separate with commas, e.g. English, Tamil" value={form.languages} onChange={(e) => set('languages', e.target.value)} error={errors.languages} />
            <TextArea id="df-focus" label="Areas of focus" optional rows={3} hint="One per line" value={form.focus} onChange={(e) => set('focus', e.target.value)} />
            <fieldset>
              <legend className="text-sm font-semibold text-ink">Usually available on</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <label key={d} className={cx('flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm', form.availability.includes(d) ? 'border-teal bg-aqua-50 font-semibold' : 'border-line')}>
                    <input type="checkbox" className="h-4 w-4 accent-teal" checked={form.availability.includes(d)} onChange={() => flip('availability', d, DAYS)} />
                    {d}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset aria-describedby={errors.modes ? 'df-modes-error' : undefined}>
              <legend className="text-sm font-semibold text-ink">Consultations</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {MODES.map((m) => (
                  <label key={m} className={cx('flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm', form.modes.includes(m) ? 'border-teal bg-aqua-50 font-semibold' : 'border-line')}>
                    <input type="checkbox" className="h-4 w-4 accent-teal" checked={form.modes.includes(m)} onChange={() => flip('modes', m, MODES)} aria-invalid={Boolean(errors.modes)} />
                    {m}
                  </label>
                ))}
              </div>
              {errors.modes && (
                <p id="df-modes-error" className="mt-1.5 text-sm font-medium text-[#B3261E]">
                  {errors.modes}
                </p>
              )}
            </fieldset>
          </div>
        </Card>

        <Card title="Photo" id="photo">
          {isNew ? (
            <p className="text-[15px] text-slate">Create the profile first, then you can add a photo here.</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <PhotoField table="sd_doctors" id={id!} prefix="photo" folder="doctors" url={photo.url} smallUrl={photo.smallUrl} label="Profile photo" hint="Portrait, ideally 800 × 1000 px. JPEG, PNG, WebP or AVIF up to 5 MB. Only use a photo the person has agreed to." onChange={setPhoto} />
              <TextField id="df-alt" label="Photo description" optional hint="For screen readers, e.g. Portrait of Dr. Anita Das" value={form.photo_alt} onChange={(e) => set('photo_alt', e.target.value)} />
            </div>
          )}
        </Card>

        <Card title="Visibility" id="visibility">
          <div className="flex flex-col gap-5 sm:flex-row sm:gap-10">
            <div>
              <Toggle checked={form.published} onChange={(v) => set('published', v)} label="Shown on the website" />
              <p className="mt-1 pl-[54px] text-sm text-slate">Off = hidden and cannot be chosen for appointments.</p>
            </div>
            <div>
              <Toggle checked={form.is_demo} onChange={(v) => set('is_demo', v)} label="Fictional demo profile" />
              <p className="mt-1 max-w-sm pl-[54px] text-sm text-slate">On = labelled “Fictional demo profile” on the website. Turn off only for a real, verified clinician.</p>
            </div>
          </div>
        </Card>

        <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
          <button type="submit" disabled={saving || (!isNew && !dirty)} className={buttonClass('primary', 'md')}>
            {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}
            {isNew ? 'Create profile' : 'Save changes'}
          </button>
          <span className={cx('text-sm', dirty ? 'font-medium text-ink' : 'text-slate')} aria-live="polite">
            {dirty ? 'You have unsaved changes.' : isNew ? '' : 'All changes saved.'}
          </span>
          {!isNew && (
            <button type="button" onClick={() => setDeleting(true)} className="ml-auto inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-[#B3261E] hover:bg-[#B3261E]/10">
              <Trash2 className="h-4 w-4" aria-hidden /> Delete profile
            </button>
          )}
        </div>
      </form>
      <ConfirmDialog open={deleting} title={`Delete ${saved.name}’s profile?`} confirmLabel="Delete profile" busy={busyDelete} onConfirm={confirmDelete} onCancel={() => setDeleting(false)}>
        The profile and its photo are removed from the website. Past appointment requests keep the doctor’s name. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
