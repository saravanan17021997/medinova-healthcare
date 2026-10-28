import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TextField, buttonClass } from '@/components/ui';
import { FEATURE_ICONS, FeatureIcon, iconLabel } from '@/components/FeatureIcon';
import { cx } from '@/lib/format';
import { DEFAULT_HERO_EXTRAS, HERO_LIMITS, buildHeroExtras, type HeroExtras, type HeroHighlight, type HeroStat, type StatSource } from '@/config/hero';
import { useAdminMeta } from '../components';
import { Card, LoadError, PageHeader, dbError, formatWhen, useToast } from '../ui';

// Admin -> Homepage -> Hero highlights. The badge above the headline, the four
// glass cards around the hero image and the four figures under the hero, saved
// in sd_site_settings under "home_hero" (an existing table; admins may write it).

export const HERO_SETTING_KEY = 'home_hero';

const SOURCE_LABEL: Record<StatSource, string> = {
  specialties: 'Number of published specialties',
  doctors: 'Number of published doctor profiles',
  facilities: 'Number of published facilities',
  products: 'Number of products in the store',
  custom: 'A figure you enter',
};

interface Form { badge: string; highlights: HeroHighlight[]; stats: HeroStat[] }
type Errors = Partial<Record<'badge' | `highlights.${number}` | `stats.${number}`, string>>;

const blankHighlight = (): HeroHighlight => ({ icon: 'HeartPulse', text: '' });
const blankStat = (): HeroStat => ({ icon: 'HeartPulse', source: 'custom', value: '', label: '' });

/** Always four rows of each, so empty ones can be filled in later. */
function toForm(x: HeroExtras): Form {
  const pad = <T,>(list: T[], blank: () => T, n: number) => [...list.map((v) => ({ ...v })), ...Array.from({ length: Math.max(0, n - list.length) }, blank)];
  return { badge: x.badge, highlights: pad(x.highlights, blankHighlight, HERO_LIMITS.highlights), stats: pad(x.stats, blankStat, HERO_LIMITS.stats) };
}

/** What gets saved: empty rows are left out (they are hidden on the website). */
export function toValue(f: Form): HeroExtras {
  return {
    badge: f.badge.trim(),
    highlights: f.highlights.map((h) => ({ icon: h.icon, text: h.text.trim() })).filter((h) => h.text),
    stats: f.stats
      .map((s) => ({ icon: s.icon, source: s.source, value: s.source === 'custom' ? s.value.trim() : '', label: s.label.trim() }))
      .filter((s) => s.label),
  };
}

export function validateHero(f: Form): Errors {
  const e: Errors = {};
  if (f.badge.trim().length > HERO_LIMITS.badge) e.badge = `Keep the badge to ${HERO_LIMITS.badge} characters.`;
  f.highlights.forEach((h, i) => {
    if (h.text.trim().length > HERO_LIMITS.highlight) e[`highlights.${i}`] = `Keep this to ${HERO_LIMITS.highlight} characters.`;
  });
  f.stats.forEach((s, i) => {
    const label = s.label.trim();
    const value = s.value.trim();
    if (label.length > HERO_LIMITS.label) e[`stats.${i}`] = `Keep the label to ${HERO_LIMITS.label} characters.`;
    else if (s.source === 'custom' && label && !value) e[`stats.${i}`] = 'Enter the figure, or clear the label to hide this card.';
    else if (s.source === 'custom' && value && !label) e[`stats.${i}`] = 'Add a label for this figure, or clear the figure.';
    else if (value.length > HERO_LIMITS.value) e[`stats.${i}`] = `Keep the figure to ${HERO_LIMITS.value} characters, for example 10,000+.`;
  });
  return e;
}

const field = (err?: string) => cx('h-11 w-full min-w-0 rounded-xl border bg-white px-3 text-[15px] text-ink', err ? 'border-[#B3261E]' : 'border-line');

function IconPicker({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <FeatureIcon name={value} className="h-6 w-6 shrink-0 text-teal" />
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={field()}>
        {FEATURE_ICONS.map((n) => (
          <option key={n} value={n}>{iconLabel(n)}</option>
        ))}
      </select>
    </div>
  );
}

export function AdminHeroHighlights() {
  useAdminMeta('Hero highlights');
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saved, setSaved] = useState<Form | null>(null);
  const [stored, setStored] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoadError(null);
    const { data, error } = await supabase.from('sd_site_settings').select('key,value,updated_at').eq('key', HERO_SETTING_KEY);
    if (error) return setLoadError('Hero highlights could not be loaded. ' + dbError(error));
    const row = (data as { key: string; value: unknown; updated_at: string }[])[0];
    const f = toForm(row ? buildHeroExtras(row.value) : DEFAULT_HERO_EXTRAS);
    setStored(Boolean(row));
    setForm(f);
    setSaved(f);
    setLastSaved(row?.updated_at ?? null);
  }, []);
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

  const clear = (k: keyof Errors) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }));
  const setHighlight = (i: number, patch: Partial<HeroHighlight>) => {
    setForm((f) => (f ? { ...f, highlights: f.highlights.map((h, j) => (j === i ? { ...h, ...patch } : h)) } : f));
    clear(`highlights.${i}`);
  };
  const setStat = (i: number, patch: Partial<HeroStat>) => {
    setForm((f) => (f ? { ...f, stats: f.stats.map((s, j) => (j === i ? { ...s, ...patch } : s)) } : f));
    clear(`stats.${i}`);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !form) return;
    const err = validateHero(form);
    setErrors(err);
    if (Object.keys(err).length) {
      toast('error', 'Some highlights need fixing before they can be saved.');
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    if (!dirty && stored) return;
    setSaving(true);
    const { error } = await supabase.from('sd_site_settings').upsert([{ key: HERO_SETTING_KEY, value: toValue(form) }], { onConflict: 'key' }).select('key');
    setSaving(false);
    if (error) return toast('error', dbError(error, 'setting'));
    toast('success', 'Hero highlights saved. Visitors see them the next time a page loads.');
    await load();
  };

  if (loadError) return <div className="mx-auto max-w-4xl"><LoadError message={loadError} onRetry={load} /></div>;
  if (!form) return <p role="status" className="mx-auto max-w-4xl text-slate">Loading hero highlights…</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin/homepage" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Homepage
      </Link>
      <PageHeader
        title="Hero highlights"
        description="The small badge above the main headline, the cards floating around the hero image, and the figures under it. Leave a box empty to hide that item."
        actions={
          <a href="/" target="_blank" rel="noreferrer" className={buttonClass('outline', 'md')}>
            <ExternalLink className="h-4 w-4" aria-hidden /> View homepage
          </a>
        }
      />
      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
        <Card title="Badge" id="badge">
          <TextField id="hh-badge" label="Badge text" optional value={form.badge} maxLength={HERO_LIMITS.badge} onChange={(e) => { setForm({ ...form, badge: e.target.value }); clear('badge'); }} error={errors.badge} hint="Shown above the headline. Leave empty to hide it." />
        </Card>

        <Card title="Floating cards" id="highlights">
          <p className="-mt-1 mb-4 text-sm text-slate">Up to four short points shown around the image on wide screens, and under it on phones. Keep each one to a few words, and only say what is true for your clinic.</p>
          <ul className="space-y-4">
            {form.highlights.map((h, i) => (
              <li key={i} className="grid gap-3 sm:grid-cols-[14rem_1fr]" data-testid="highlight-row">
                <div>
                  <label htmlFor={`hh-hicon-${i}`} className="text-sm font-semibold text-ink">Icon, card {i + 1}</label>
                  <div className="mt-1.5"><IconPicker id={`hh-hicon-${i}`} value={h.icon} onChange={(v) => setHighlight(i, { icon: v })} /></div>
                </div>
                <div>
                  <label htmlFor={`hh-htext-${i}`} className="text-sm font-semibold text-ink">Text, card {i + 1}</label>
                  <input id={`hh-htext-${i}`} value={h.text} maxLength={HERO_LIMITS.highlight} onChange={(e) => setHighlight(i, { text: e.target.value })} aria-invalid={Boolean(errors[`highlights.${i}`])} aria-describedby={errors[`highlights.${i}`] ? `hh-herr-${i}` : undefined} className={cx(field(errors[`highlights.${i}`]), 'mt-1.5')} />
                  {errors[`highlights.${i}`] && <p id={`hh-herr-${i}`} className="mt-1 text-sm font-medium text-[#B3261E]">{errors[`highlights.${i}`]}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Figures under the hero" id="stats">
          <p className="-mt-1 mb-4 text-sm text-slate">An automatic figure counts what is published on the website right now, and is hidden while it is 0. Enter your own figure only if you can back it up, for example a number of patients from your records.</p>
          <ul className="space-y-5">
            {form.stats.map((s, i) => {
              const err = errors[`stats.${i}`];
              return (
                <li key={i} className="rounded-2xl bg-mist p-4" data-testid="stat-row">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`hh-ssource-${i}`} className="text-sm font-semibold text-ink">Figure {i + 1} shows</label>
                      <select id={`hh-ssource-${i}`} value={s.source} onChange={(e) => setStat(i, { source: e.target.value as StatSource })} className={cx(field(), 'mt-1.5')}>
                        {(Object.keys(SOURCE_LABEL) as StatSource[]).map((k) => (
                          <option key={k} value={k}>{SOURCE_LABEL[k]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`hh-sicon-${i}`} className="text-sm font-semibold text-ink">Icon, figure {i + 1}</label>
                      <div className="mt-1.5"><IconPicker id={`hh-sicon-${i}`} value={s.icon} onChange={(v) => setStat(i, { icon: v })} /></div>
                    </div>
                    {s.source === 'custom' && (
                      <div>
                        <label htmlFor={`hh-svalue-${i}`} className="text-sm font-semibold text-ink">Figure</label>
                        <input id={`hh-svalue-${i}`} value={s.value} maxLength={HERO_LIMITS.value} placeholder="10,000+" onChange={(e) => setStat(i, { value: e.target.value })} aria-invalid={Boolean(err)} className={cx(field(err), 'mt-1.5')} />
                      </div>
                    )}
                    <div className={s.source === 'custom' ? '' : 'sm:col-span-2'}>
                      <label htmlFor={`hh-slabel-${i}`} className="text-sm font-semibold text-ink">Label</label>
                      <input id={`hh-slabel-${i}`} value={s.label} maxLength={HERO_LIMITS.label} placeholder="Happy patients" onChange={(e) => setStat(i, { label: e.target.value })} aria-invalid={Boolean(err)} aria-describedby={err ? `hh-serr-${i}` : undefined} className={cx(field(err), 'mt-1.5')} />
                    </div>
                  </div>
                  {err && <p id={`hh-serr-${i}`} className="mt-2 text-sm font-medium text-[#B3261E]">{err}</p>}
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
          <button type="submit" disabled={saving || (!dirty && stored)} className={buttonClass('primary', 'md')}>
            {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}
            Save highlights
          </button>
          {dirty && (
            <button type="button" onClick={() => { setForm(saved); setErrors({}); }} className={buttonClass('ghost', 'md')}>
              Discard changes
            </button>
          )}
          <button type="button" onClick={() => { setForm(toForm(DEFAULT_HERO_EXTRAS)); setErrors({}); }} className={buttonClass('ghost', 'md')}>
            <RotateCcw className="h-4 w-4" aria-hidden /> Start from the suggested wording
          </button>
          <span className={cx('text-sm', dirty ? 'font-medium text-ink' : 'text-slate')} aria-live="polite">
            {dirty ? 'You have unsaved changes.' : !stored ? 'Showing the suggested wording. Save to keep your own.' : lastSaved ? `All changes saved. Last saved ${formatWhen(lastSaved)}.` : 'All changes saved.'}
          </span>
        </div>
      </form>
    </div>
  );
}
