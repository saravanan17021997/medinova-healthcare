import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Images, Loader2, Pencil, Pin, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TextArea, TextField, buttonClass } from '@/components/ui';
import { FEATURE_ICONS, FeatureIcon } from '@/components/FeatureIcon';
import { cx } from '@/lib/format';
import { SITE_PAGES, checkLink } from '@/lib/links';
import { SECTION_KEYS, buildSlides, type SectionKey } from '@/services/content';
import { useAdminMeta } from '../components';
import { Card, LoadError, PageHeader, Toggle, dbError, useToast } from '../ui';
import { PhotoField } from '../PhotoField';

interface Info { label: string; about: string; body?: { label: string; max: number; optional: boolean }; image?: boolean; ctas: 0 | 1 | 2; items?: 'steps' | 'features' }

/** What each homepage section is and which parts of it can be edited. */
export const SECTION_INFO: Record<SectionKey, Info> = {
  'home.hero': { label: 'Top of the page', about: 'The first thing visitors see: the main headline, a short introduction, up to two buttons and the large image.', body: { label: 'Introduction', max: 400, optional: true }, image: true, ctas: 2 },
  'home.specialties': { label: 'Specialties', about: 'A heading and introduction above the list of specialties.', body: { label: 'Introduction', max: 300, optional: true }, ctas: 0 },
  'home.team': { label: 'Care team', about: 'A heading and introduction above four doctor profiles.', body: { label: 'Introduction', max: 300, optional: true }, ctas: 0 },
  'home.appointment': { label: 'Appointment steps', about: 'The dark band explaining how to request an appointment, with an image and a button.', body: { label: 'Text under the heading', max: 300, optional: true }, image: true, ctas: 1, items: 'steps' },
  'home.essentials': { label: 'Health essentials', about: 'A heading and introduction above four products from the store.', body: { label: 'Introduction', max: 300, optional: true }, ctas: 0 },
  'home.why': { label: 'Why choose us', about: 'An image next to up to six short points, each with an icon.', body: { label: 'Introduction', max: 300, optional: true }, image: true, ctas: 0, items: 'features' },
  'home.visit': { label: 'Visit or contact us', about: 'The address, opening hours and contact buttons. Those details are edited in Site settings.', body: { label: 'Introduction', max: 300, optional: true }, ctas: 0 },
};
const isKey = (k: string): k is SectionKey => (SECTION_KEYS as readonly string[]).includes(k);

interface Row { id: string; key: SectionKey; heading: string; image_url: string | null; image_small_url: string | null; sort_order: number; published: boolean; items: unknown }

export function AdminHomepage() {
  useAdminMeta('Homepage');
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const { data, error: e } = await supabase.from('sd_page_sections').select('id,key,heading,image_url,image_small_url,sort_order,published,items').order('sort_order');
    if (e) return setError('Homepage sections could not be loaded. ' + dbError(e));
    const list = (data as Row[]).filter((r) => isKey(r.key));
    // the top of the page always comes first, whatever its number
    setRows([...list.filter((r) => r.key === 'home.hero'), ...list.filter((r) => r.key !== 'home.hero')]);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const move = async (i: number, dir: -1 | 1) => {
    if (!rows || !supabase) return;
    const j = i + dir;
    if (j < 1 || j >= rows.length || i < 1) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setBusy(true);
    const changes = next.map((r, k) => ({ r, order: k + 1 })).filter(({ r, order }) => r.sort_order !== order);
    const results = await Promise.all(changes.map(({ r, order }) => supabase!.from('sd_page_sections').update({ sort_order: order }).eq('id', r.id)));
    setBusy(false);
    const failed = results.find((x) => x.error);
    if (failed) toast('error', dbError(failed.error, 'section'));
    else toast('success', `“${SECTION_INFO[rows[i].key].label}” moved ${dir < 0 ? 'up' : 'down'}.`);
    load();
  };

  const heroItems = rows?.find((r) => r.key === 'home.hero')?.items;
  const total = Array.isArray(heroItems) ? heroItems.length : 0;
  const on = buildSlides(heroItems).length;
  const slideNote = !rows ? 'The pictures at the top of the homepage.' : total === 0 ? 'No slides yet: the top of the page shows its main image.' : `${on} of ${total} ${total === 1 ? 'slide' : 'slides'} shown at the top of the homepage.`;

  const toggle = async (r: Row, published: boolean) => {
    if (!supabase) return;
    const { error: e } = await supabase.from('sd_page_sections').update({ published }).eq('id', r.id).select('id').single();
    if (e) return toast('error', dbError(e, 'section'));
    setRows((rs) => rs?.map((x) => (x.id === r.id ? { ...x, published } : x)) ?? null);
    toast('success', published ? `“${SECTION_INFO[r.key].label}” is shown on the homepage.` : `“${SECTION_INFO[r.key].label}” is hidden from the homepage.`);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Homepage"
        description="The sections of the homepage, in the order visitors see them. Edit the words, images and buttons, change the order, or hide a section."
        actions={
          <a href="/" target="_blank" rel="noreferrer" className={buttonClass('outline', 'md')}>
            <ExternalLink className="h-4 w-4" aria-hidden /> View homepage
          </a>
        }
      />
      <Link to="/admin/homepage/slider" className="mb-5 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-line/70 hover:ring-teal sm:p-5" data-testid="slider-link">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-aqua-50 text-teal">
          <Images className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink">Hero image slider</span>
          <span className="block text-sm text-slate">{slideNote}</span>
        </span>
        <span className="text-sm font-semibold text-teal-700">Manage slides</span>
      </Link>
      {error ? (
        <LoadError message={error} onRetry={load} />
      ) : !rows ? (
        <p role="status" className="text-slate">Loading sections…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-card ring-1 ring-line/70">
          <p className="font-semibold text-ink">No homepage sections found</p>
          <p className="mt-1 text-slate">The website is showing its built-in homepage. Run supabase/02_sd_seed.sql to add the sections.</p>
        </div>
      ) : (
        <ol className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70">
          {rows.map((r, i) => {
            const info = SECTION_INFO[r.key];
            const fixed = r.key === 'home.hero';
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap sm:px-5" data-testid="section-row">
                <div className="flex w-7 flex-col items-center">
                  {fixed ? (
                    <Pin className="h-4 w-4 text-slate" aria-label="Always first" />
                  ) : (
                    <>
                      <button type="button" onClick={() => move(i, -1)} disabled={busy || i <= 1} aria-label={`Move ${info.label} up`} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30">
                        <ArrowUp className="h-4 w-4" aria-hidden />
                      </button>
                      <button type="button" onClick={() => move(i, 1)} disabled={busy || i === rows.length - 1} aria-label={`Move ${info.label} down`} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30">
                        <ArrowDown className="h-4 w-4" aria-hidden />
                      </button>
                    </>
                  )}
                </div>
                <div className="min-w-0 flex-1 basis-48">
                  <Link to={`/admin/homepage/${r.key}`} className="font-semibold text-ink hover:underline">
                    {info.label}
                  </Link>
                  <p className="truncate text-sm text-slate">“{r.heading}”</p>
                </div>
                <div className="w-40">
                  {fixed ? <span className="text-sm text-slate">Always shown</span> : <Toggle checked={r.published} onChange={(v) => toggle(r, v)} label={r.published ? 'Shown' : 'Hidden'} />}
                </div>
                <Link to={`/admin/homepage/${r.key}`} className="ml-auto flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist" aria-label={`Edit ${info.label}`}>
                  <Pencil className="h-[18px] w-[18px]" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- editing one section
interface Feature { icon: string; title: string; body: string }
interface Form {
  heading: string; body: string; image_alt: string;
  cta_label: string; cta_href: string; cta2_label: string; cta2_href: string;
  steps: string[]; features: Feature[];
}
type Errors = Partial<Record<string, string>>;

export function validateSection(key: SectionKey, f: Form): Errors {
  const info = SECTION_INFO[key];
  const e: Errors = {};
  if (!f.heading.trim()) e.heading = 'Enter a heading.';
  else if (f.heading.length > 120) e.heading = 'Keep the heading to 120 characters.';
  if (info.body && f.body.length > info.body.max) e.body = `Keep this to ${info.body.max} characters.`;
  if (f.image_alt.length > 200) e.image_alt = 'Keep the description to 200 characters.';
  const button = (label: string, href: string, n: '' | '2') => {
    if (!label.trim() && !href.trim()) return;
    if (!label.trim()) e[`cta${n}_label`] = 'Enter the button text, or clear the link to remove the button.';
    else if (label.length > 40) e[`cta${n}_label`] = 'Keep the button text to 40 characters.';
    if (!href.trim()) e[`cta${n}_href`] = 'Choose where the button goes, or clear the text to remove the button.';
    else {
      const p = checkLink(href);
      if (p) e[`cta${n}_href`] = p;
    }
  };
  if (info.ctas >= 1) button(f.cta_label, f.cta_href, '');
  if (info.ctas >= 2) button(f.cta2_label, f.cta2_href, '2');
  if (info.items === 'steps') {
    if (f.steps.length === 0) e.steps = 'Add at least one step.';
    f.steps.forEach((s, i) => {
      if (!s.trim()) e[`steps.${i}`] = 'Write this step, or remove it.';
      else if (s.length > 160) e[`steps.${i}`] = 'Keep each step to 160 characters.';
    });
  }
  if (info.items === 'features') {
    if (f.features.length === 0) e.features = 'Add at least one point.';
    f.features.forEach((x, i) => {
      if (!x.title.trim()) e[`features.${i}`] = 'Give this point a title, or remove it.';
      else if (x.title.length > 60 || x.body.length > 200) e[`features.${i}`] = 'Keep the title to 60 characters and the text to 200.';
    });
  }
  return e;
}

const EMPTY: Form = { heading: '', body: '', image_alt: '', cta_label: '', cta_href: '', cta2_label: '', cta2_href: '', steps: [], features: [] };
const field = (bad?: string) => cx('h-11 w-full min-w-0 rounded-xl border bg-white px-3 text-[15px] text-ink', bad ? 'border-[#B3261E]' : 'border-line');

export function AdminSectionForm() {
  const { key: rawKey = '' } = useParams();
  const key = isKey(rawKey) ? rawKey : null;
  const info = key ? SECTION_INFO[key] : null;
  useAdminMeta(info ? `Edit ${info.label.toLowerCase()}` : 'Section not found');
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [id, setId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saved, setSaved] = useState<Form>(EMPTY);
  const [image, setImage] = useState<{ url: string | null; smallUrl: string | null }>({ url: null, smallUrl: null });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !key) return setLoading(false);
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.from('sd_page_sections').select('*').eq('key', key).maybeSingle();
    setLoading(false);
    if (error || !data) return setLoadError(error ? 'This section could not be loaded. ' + dbError(error) : 'This section is not in the database. Run supabase/02_sd_seed.sql to add it.');
    const items: unknown[] = Array.isArray(data.items) ? data.items : [];
    const f: Form = {
      heading: data.heading ?? '', body: data.body ?? '', image_alt: data.image_alt ?? '',
      cta_label: data.cta_label ?? '', cta_href: data.cta_href ?? '', cta2_label: data.cta2_label ?? '', cta2_href: data.cta2_href ?? '',
      steps: key === 'home.appointment' ? items.filter((x): x is string => typeof x === 'string') : [],
      features: key === 'home.why' ? items.filter((x): x is Feature => Boolean(x) && typeof x === 'object').map((x) => ({ icon: String(x.icon ?? 'HeartPulse'), title: String(x.title ?? ''), body: String(x.body ?? '') })) : [],
    };
    setId(data.id);
    setForm(f);
    setSaved(f);
    setImage({ url: data.image_url, smallUrl: data.image_small_url });
  }, [key]);
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
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const clearError = (k: string) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !key || !id || !info) return;
    const err = validateSection(key, form);
    setErrors(err);
    if (Object.keys(err).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const opt = (s: string) => (s.trim() ? s.trim() : null);
    const payload = {
      heading: form.heading.trim(),
      body: form.body.trim(),
      image_alt: form.image_alt.trim(),
      ...(info.ctas >= 1 ? { cta_label: opt(form.cta_label), cta_href: opt(form.cta_href) } : {}),
      ...(info.ctas >= 2 ? { cta2_label: opt(form.cta2_label), cta2_href: opt(form.cta2_href) } : {}),
      ...(info.items === 'steps' ? { items: form.steps.map((s) => s.trim()) } : {}),
      ...(info.items === 'features' ? { items: form.features.map((f) => ({ icon: f.icon, title: f.title.trim(), body: f.body.trim() })) } : {}),
    };
    setSaving(true);
    const { error } = await supabase.from('sd_page_sections').update(payload).eq('id', id).select('id').single();
    setSaving(false);
    if (error) return toast('error', dbError(error, 'section'));
    setSaved(form);
    toast('success', 'Changes saved. Visitors see them the next time the homepage loads.');
  };

  if (!key || !info) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-card ring-1 ring-line/70">
        <h1 className="font-display text-2xl font-semibold text-ink">This section does not exist</h1>
        <Link to="/admin/homepage" className="mt-6 inline-block font-semibold text-teal underline-offset-4 hover:underline">All homepage sections</Link>
      </div>
    );
  }
  if (loading) return <p role="status" className="mx-auto max-w-4xl text-slate">Loading…</p>;
  if (loadError) return <div className="mx-auto max-w-4xl"><LoadError message={loadError} onRetry={load} /></div>;

  const ctaFields = (n: '' | '2', title: string) => (
    <fieldset className="grid gap-4 rounded-xl bg-mist/60 p-4 sm:grid-cols-2">
      <legend className="sr-only">{title}</legend>
      <p className="text-sm font-semibold text-ink sm:col-span-2">{title}</p>
      <TextField id={`sc-cta${n}-label`} label="Button text" optional value={form[`cta${n}_label`]} onChange={(e) => set(`cta${n}_label`, e.target.value)} error={errors[`cta${n}_label`]} maxLength={40} />
      <TextField id={`sc-cta${n}-href`} label="Goes to" optional list="site-pages" value={form[`cta${n}_href`]} onChange={(e) => set(`cta${n}_href`, e.target.value)} error={errors[`cta${n}_href`]} hint="A page from the list, or a full https:// address." />
      <p className="text-sm text-slate sm:col-span-2">Clear both fields to hide this button.</p>
    </fieldset>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin/homepage" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All homepage sections
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">{info.label}</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-slate">{info.about}</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className={buttonClass('outline', 'sm')}>
          <ExternalLink className="h-4 w-4" aria-hidden /> View homepage
        </a>
      </div>
      <datalist id="site-pages">
        {SITE_PAGES.map((p) => (
          <option key={p.path} value={p.path}>
            {p.label}
          </option>
        ))}
      </datalist>
      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
        <Card title="Words" id="words">
          <div className="space-y-5">
            <TextField id="sc-heading" label={key === 'home.hero' ? 'Main headline' : 'Heading'} value={form.heading} onChange={(e) => set('heading', e.target.value)} error={errors.heading} maxLength={120} hint={`${form.heading.length}/120`} />
            {info.body && <TextArea id="sc-body" label={info.body.label} optional={info.body.optional} rows={3} value={form.body} onChange={(e) => set('body', e.target.value)} error={errors.body} hint={`${form.body.length}/${info.body.max}`} />}
            {key === 'home.visit' && (
              <p className="text-sm text-slate">
                The address, hours and phone number are in <Link to="/admin/settings" className="font-semibold text-teal-700 underline underline-offset-2">Site settings</Link>.
              </p>
            )}
          </div>
        </Card>

        {info.items === 'steps' && (
          <Card title="Steps" id="steps">
            {errors.steps && <p role="alert" className="mb-3 text-sm font-medium text-[#B3261E]">{errors.steps}</p>}
            <ol className="space-y-3">
              {form.steps.map((s, i) => (
                <li key={i} data-testid="step-row">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aqua/30 text-sm font-bold text-ink" aria-hidden>{i + 1}</span>
                    <label htmlFor={`sc-step-${i}`} className="sr-only">Step {i + 1}</label>
                    <input id={`sc-step-${i}`} value={s} maxLength={160} onChange={(e) => { set('steps', form.steps.map((x, j) => (j === i ? e.target.value : x))); clearError(`steps.${i}`); }} aria-invalid={Boolean(errors[`steps.${i}`])} className={field(errors[`steps.${i}`])} />
                    <button type="button" onClick={() => set('steps', form.steps.filter((_, j) => j !== i))} aria-label={`Remove step ${i + 1}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#B3261E] hover:bg-[#B3261E]/10">
                      <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                    </button>
                  </div>
                  {errors[`steps.${i}`] && <p className="ml-11 mt-1 text-sm font-medium text-[#B3261E]">{errors[`steps.${i}`]}</p>}
                </li>
              ))}
            </ol>
            {form.steps.length < 5 && (
              <button type="button" onClick={() => set('steps', [...form.steps, ''])} className={buttonClass('outline', 'sm', 'mt-4')}>
                <Plus className="h-4 w-4" aria-hidden /> Add a step
              </button>
            )}
          </Card>
        )}

        {info.items === 'features' && (
          <Card title="Points" id="features">
            {errors.features && <p role="alert" className="mb-3 text-sm font-medium text-[#B3261E]">{errors.features}</p>}
            <ul className="space-y-4">
              {form.features.map((x, i) => {
                const upd = (patch: Partial<Feature>) => {
                  set('features', form.features.map((y, j) => (j === i ? { ...y, ...patch } : y)));
                  clearError(`features.${i}`);
                };
                return (
                  <li key={i} className="rounded-xl ring-1 ring-line p-4" data-testid="feature-row">
                    <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-start">
                      <div>
                        <label htmlFor={`sc-ficon-${i}`} className="text-sm font-semibold text-ink">Icon</label>
                        <div className="mt-1.5 flex items-center gap-2">
                          <FeatureIcon name={x.icon} className="h-6 w-6 shrink-0 text-teal" />
                          <select id={`sc-ficon-${i}`} value={x.icon} onChange={(e) => upd({ icon: e.target.value })} className={field()}>
                            {FEATURE_ICONS.map((n) => (
                              <option key={n} value={n}>{n.replace(/([a-z])([A-Z])/g, '$1 $2')}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label htmlFor={`sc-ftitle-${i}`} className="text-sm font-semibold text-ink">Title</label>
                          <input id={`sc-ftitle-${i}`} value={x.title} maxLength={60} onChange={(e) => upd({ title: e.target.value })} aria-invalid={Boolean(errors[`features.${i}`])} className={cx(field(errors[`features.${i}`]), 'mt-1.5')} />
                        </div>
                        <div>
                          <label htmlFor={`sc-fbody-${i}`} className="text-sm font-semibold text-ink">Text <span className="font-normal text-slate">(optional)</span></label>
                          <textarea id={`sc-fbody-${i}`} value={x.body} maxLength={200} rows={2} onChange={(e) => upd({ body: e.target.value })} className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2 text-[15px] text-ink" />
                        </div>
                      </div>
                      <button type="button" onClick={() => set('features', form.features.filter((_, j) => j !== i))} aria-label={`Remove point ${i + 1}`} className="flex h-10 w-10 items-center justify-center rounded-full text-[#B3261E] hover:bg-[#B3261E]/10">
                        <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                      </button>
                    </div>
                    {errors[`features.${i}`] && <p className="mt-2 text-sm font-medium text-[#B3261E]">{errors[`features.${i}`]}</p>}
                  </li>
                );
              })}
            </ul>
            {form.features.length < 6 && (
              <button type="button" onClick={() => set('features', [...form.features, { icon: 'HeartPulse', title: '', body: '' }])} className={buttonClass('outline', 'sm', 'mt-4')}>
                <Plus className="h-4 w-4" aria-hidden /> Add a point
              </button>
            )}
          </Card>
        )}

        {info.ctas > 0 && (
          <Card title={info.ctas === 1 ? 'Button' : 'Buttons'} id="buttons">
            <div className="space-y-4">
              {ctaFields('', info.ctas === 1 ? 'Main button' : 'First button')}
              {info.ctas === 2 && ctaFields('2', 'Second button')}
              {key === 'home.appointment' && <p className="text-sm text-slate">The “Ask on WhatsApp” button next to it is always shown and uses the WhatsApp number in Site settings.</p>}
            </div>
          </Card>
        )}

        {info.image && id && (
          <Card title="Image" id="image">
            <div className="grid gap-5 lg:grid-cols-2">
              <PhotoField
                table="sd_page_sections" id={id} prefix="image" folder="sections" url={image.url} smallUrl={image.smallUrl} aspect="aspect-[16/10]" sizeColumns={false}
                label={key === 'home.hero' ? 'Main image' : 'Section image'} hint="Landscape, ideally 1600 × 1000 px. JPEG, PNG, WebP or AVIF up to 5 MB."
                removedNote="The homepage shows the built-in image until you add a new one." onChange={setImage}
              />
              {key === 'home.hero' && (
                <p className="text-sm text-slate lg:col-span-2">
                  This image is shown when the <Link to="/admin/homepage/slider" className="font-semibold text-teal-700 underline underline-offset-2">Hero image slider</Link> has no slides switched on.
                </p>
              )}
              <TextField id="sc-alt" label="Image description" optional value={form.image_alt} onChange={(e) => set('image_alt', e.target.value)} error={errors.image_alt} hint="What the image shows, for people using screen readers." />
            </div>
          </Card>
        )}

        <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
          <button type="submit" disabled={saving || !dirty} className={buttonClass('primary', 'md')}>
            {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}
            Save changes
          </button>
          {dirty && (
            <button type="button" onClick={() => { setForm(saved); setErrors({}); }} className={buttonClass('ghost', 'md')}>
              Discard changes
            </button>
          )}
          <span className={cx('text-sm', dirty ? 'font-medium text-ink' : 'text-slate')} aria-live="polite">
            {dirty ? 'You have unsaved changes.' : 'All changes saved.'}
          </span>
        </div>
      </form>
    </div>
  );
}
