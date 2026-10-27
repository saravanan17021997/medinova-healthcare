import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TextArea, TextField, buttonClass } from '@/components/ui';
import { cx } from '@/lib/format';
import { buildSite, type SettingRow } from '@/services/content';
import { useAdminMeta } from '../components';
import { Card, LoadError, PageHeader, Toggle, dbError, formatWhen, useToast } from '../ui';

interface Hours { days: string; time: string }
interface Form {
  name: string; shortName: string; tagline: string;
  phone: string; whatsapp: string; email: string;
  hours: Hours[];
  locVerified: boolean; locName: string; address: string; mapsQuery: string;
  demo: boolean; demoNotice: string;
  credit: string;
}
type Errors = Partial<Record<keyof Form | `hours.${number}`, string>>;

const digits = (s: string) => s.replace(/[\s().-]/g, '');
/** The number the Call button dials: digits, with a leading + kept. */
export const dialNumber = (s: string) => digits(s.trim());
/** WhatsApp wants the country code and digits only. */
export const whatsappDigits = (s: string) => s.replace(/\D/g, '');
const PLACEHOLDER_ADDRESS = /goes here|city, state, pin code/i;

function toForm(rows: SettingRow[]): Form {
  const s = buildSite(rows);
  return {
    name: s.name, shortName: s.shortName, tagline: s.tagline,
    phone: s.contact.phoneDisplay, whatsapp: s.contact.whatsappNumber, email: s.contact.email,
    hours: s.contact.hours.map((h) => ({ ...h })),
    locVerified: s.location.verified, locName: s.location.name, address: s.location.addressLines.join('\n'), mapsQuery: s.location.mapsQuery,
    demo: s.demo, demoNotice: s.demoNotice,
    credit: s.credit,
  };
}

export function validateSettings(f: Form): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2 || f.name.trim().length > 80) e.name = 'Enter the clinic name (2 to 80 characters).';
  if (!f.shortName.trim() || f.shortName.trim().length > 30) e.shortName = 'Enter a short name (up to 30 characters).';
  if (!f.tagline.trim() || f.tagline.length > 120) e.tagline = 'Enter a tagline (up to 120 characters).';
  if (!/^\+?[0-9]{6,15}$/.test(dialNumber(f.phone))) e.phone = 'Enter a phone number using digits, spaces or dashes, for example 98765 43210 or +91 98765 43210.';
  else if (f.phone.trim().length > 30) e.phone = 'Keep the phone number to 30 characters.';
  const wa = whatsappDigits(f.whatsapp);
  if (f.whatsapp.trim()) {
    if (/[^\d\s()+-]/.test(f.whatsapp)) e.whatsapp = 'Use digits only, for example 919876543210.';
    else if (wa.length === 10) e.whatsapp = 'Add the country code at the start. For India: 91 followed by the 10-digit number.';
    else if (wa.length < 11 || wa.length > 15) e.whatsapp = 'Enter the country code and number, 11 to 15 digits, for example 919876543210.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Enter an email address like hello@yourclinic.in.';
  if (f.hours.length === 0) e.hours = 'Add at least one row of opening hours.';
  f.hours.forEach((h, i) => {
    if (!h.days.trim() || !h.time.trim()) e[`hours.${i}`] = 'Fill in both the days and the times, or remove this row.';
    else if (h.days.length > 60 || h.time.length > 60) e[`hours.${i}`] = 'Keep each part to 60 characters.';
  });
  const lines = f.address.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!f.locName.trim() || f.locName.length > 100) e.locName = 'Enter a name for the location (up to 100 characters).';
  if (lines.length === 0) e.address = 'Enter the address.';
  else if (lines.length > 4) e.address = 'Use up to 4 lines.';
  else if (lines.some((l) => l.length > 120)) e.address = 'Keep each line to 120 characters.';
  else if (f.locVerified && PLACEHOLDER_ADDRESS.test(f.address)) e.address = 'Replace the placeholder address before marking it as confirmed.';
  if (f.mapsQuery.length > 200) e.mapsQuery = 'Keep this to 200 characters.';
  if (f.demo && !f.demoNotice.trim()) e.demoNotice = 'Enter the notice text, or turn the demo notices off.';
  if (f.demoNotice.length > 300) e.demoNotice = 'Keep the notice to 300 characters.';
  if (f.credit.length > 160) e.credit = 'Keep the footer line to 160 characters.';
  return e;
}

/** The rows to save. Values in the stored JSON that this form does not edit are kept. */
function toRows(f: Form, stored: Map<string, unknown>): SettingRow[] {
  const keep = (k: string) => {
    const v = stored.get(k);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  };
  return [
    { key: 'brand', value: { ...keep('brand'), name: f.name.trim(), shortName: f.shortName.trim(), tagline: f.tagline.trim(), demo: f.demo, demoNotice: f.demoNotice.trim() } },
    { key: 'contact', value: { ...keep('contact'), phoneDisplay: f.phone.trim(), phoneHref: dialNumber(f.phone), whatsappNumber: whatsappDigits(f.whatsapp), email: f.email.trim() } },
    { key: 'hours', value: f.hours.map((h) => ({ days: h.days.trim(), time: h.time.trim() })) },
    { key: 'location', value: { ...keep('location'), verified: f.locVerified, name: f.locName.trim(), addressLines: f.address.split('\n').map((l) => l.trim()).filter(Boolean), mapsQuery: f.mapsQuery.trim() } },
    { key: 'footer', value: { ...keep('footer'), credit: f.credit.trim() } },
  ];
}

export function AdminSettings() {
  useAdminMeta('Site settings');
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [stored, setStored] = useState<Map<string, unknown> | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saved, setSaved] = useState<Form | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoadError(null);
    const { data, error } = await supabase.from('sd_site_settings').select('key,value,updated_at');
    if (error) return setLoadError('Settings could not be loaded. ' + dbError(error));
    const rows = data as (SettingRow & { updated_at: string })[];
    const f = toForm(rows);
    setStored(new Map(rows.map((r) => [r.key, r.value])));
    setForm(f);
    setSaved(f);
    setLastSaved(rows.map((r) => r.updated_at).sort().pop() ?? null);
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

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const setHour = (i: number, part: keyof Hours, v: string) => {
    setForm((f) => (f ? { ...f, hours: f.hours.map((h, j) => (j === i ? { ...h, [part]: v } : h)) } : f));
    if (errors[`hours.${i}`]) setErrors((e) => ({ ...e, [`hours.${i}`]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !form || !stored || !saved) return;
    const err = validateSettings(form);
    setErrors(err);
    if (Object.keys(err).length) {
      toast('error', 'Some settings need fixing before they can be saved.');
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const before = new Map(toRows(saved, stored).map((r) => [r.key, JSON.stringify(r.value)]));
    const changed = toRows(form, stored).filter((r) => before.get(r.key) !== JSON.stringify(r.value) || !stored.has(r.key));
    if (changed.length === 0) return;
    setSaving(true);
    const { error } = await supabase.from('sd_site_settings').upsert(changed, { onConflict: 'key' }).select('key');
    setSaving(false);
    if (error) return toast('error', dbError(error, 'setting'));
    toast('success', 'Settings saved. Visitors see them the next time a page loads.');
    await load();
  };

  if (loadError) return <div className="mx-auto max-w-4xl"><LoadError message={loadError} onRetry={load} /></div>;
  if (!form) return <p role="status" className="mx-auto max-w-4xl text-slate">Loading settings…</p>;

  const dial = dialNumber(form.phone);
  const wa = whatsappDigits(form.whatsapp);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Site settings" description="The clinic’s name, contact details, hours and address, used in the header, footer, homepage and contact page." />
      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
        <Card title="Clinic name" id="brand">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField id="st-name" label="Full name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={80} hint="Used in page titles and the footer." />
            <TextField id="st-short" label="Short name" value={form.shortName} onChange={(e) => set('shortName', e.target.value)} error={errors.shortName} maxLength={30} hint={`Starts WhatsApp messages: “Hello ${form.shortName.trim() || '…'}, …”`} />
            <div className="sm:col-span-2">
              <TextField id="st-tagline" label="Tagline" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} error={errors.tagline} maxLength={120} />
            </div>
          </div>
        </Card>

        <Card title="Contact details" id="contact">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <TextField id="st-phone" label="Phone number" type="tel" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} hint="Shown as you type it." />
              {!errors.phone && /^\+?[0-9]{6,15}$/.test(dial) && (
                <p className="mt-1.5 text-sm text-slate">
                  The Call button dials <a href={`tel:${dial}`} className="font-medium text-teal-700 underline underline-offset-2">{dial}</a>
                </p>
              )}
            </div>
            <div>
              <TextField id="st-wa" label="WhatsApp number" optional inputMode="numeric" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} error={errors.whatsapp} hint="Country code and number, for example 919876543210. Leave empty and WhatsApp asks visitors which chat to use." />
              {!errors.whatsapp && wa.length >= 11 && wa.length <= 15 && (
                <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hello ${form.shortName.trim()}, this is a test.`)}`} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 underline underline-offset-2">
                  Test this WhatsApp link <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              )}
            </div>
            <div className="sm:col-span-2">
              <TextField id="st-email" label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
            </div>
          </div>
        </Card>

        <Card title="Opening hours" id="hours">
          <fieldset>
            <legend className="sr-only">Opening hours</legend>
            {errors.hours && (
              <p role="alert" className="mb-3 text-sm font-medium text-[#B3261E]">
                {errors.hours}
              </p>
            )}
            <ul className="space-y-3">
              {form.hours.map((h, i) => (
                <li key={i} data-testid="hours-row">
                  <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-3">
                    <label className="sr-only" htmlFor={`st-days-${i}`}>Days, row {i + 1}</label>
                    <input id={`st-days-${i}`} value={h.days} placeholder="Monday to Friday" onChange={(e) => setHour(i, 'days', e.target.value)} aria-invalid={Boolean(errors[`hours.${i}`])} aria-describedby={errors[`hours.${i}`] ? `st-hours-err-${i}` : undefined} className={cx('h-11 w-full min-w-0 rounded-xl border bg-white px-3 text-[15px]', errors[`hours.${i}`] ? 'border-[#B3261E]' : 'border-line')} />
                    <label className="sr-only" htmlFor={`st-time-${i}`}>Times, row {i + 1}</label>
                    <input id={`st-time-${i}`} value={h.time} placeholder="8:00 am to 8:00 pm" onChange={(e) => setHour(i, 'time', e.target.value)} aria-invalid={Boolean(errors[`hours.${i}`])} className={cx('h-11 w-full min-w-0 rounded-xl border bg-white px-3 text-[15px]', errors[`hours.${i}`] ? 'border-[#B3261E]' : 'border-line')} />
                    <button type="button" onClick={() => set('hours', form.hours.filter((_, j) => j !== i))} aria-label={`Remove row ${i + 1}`} className="flex h-10 w-10 items-center justify-center rounded-full text-[#B3261E] hover:bg-[#B3261E]/10">
                      <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                    </button>
                  </div>
                  {errors[`hours.${i}`] && (
                    <p id={`st-hours-err-${i}`} className="mt-1 text-sm font-medium text-[#B3261E]">
                      {errors[`hours.${i}`]}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {form.hours.length < 7 && (
              <button type="button" onClick={() => set('hours', [...form.hours, { days: '', time: '' }])} className={buttonClass('outline', 'sm', 'mt-4')}>
                <Plus className="h-4 w-4" aria-hidden /> Add a row
              </button>
            )}
          </fieldset>
        </Card>

        <Card title="Address and directions" id="location">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField id="st-locname" label="Location name" value={form.locName} onChange={(e) => set('locName', e.target.value)} error={errors.locName} maxLength={100} />
            <TextField id="st-maps" label="Map destination" optional value={form.mapsQuery} onChange={(e) => set('mapsQuery', e.target.value)} error={errors.mapsQuery} hint="Usually the full address, or a Google Maps place name. Used for the Get directions button." />
            <div className="sm:col-span-2">
              <TextArea id="st-address" label="Address" rows={4} value={form.address} onChange={(e) => set('address', e.target.value)} error={errors.address} hint="One line per row, up to 4 rows." />
            </div>
            <div className="sm:col-span-2 rounded-xl bg-mist p-4">
              <Toggle checked={form.locVerified} onChange={(v) => set('locVerified', v)} label="This address has been confirmed" />
              <p className="mt-2 text-sm text-slate">
                {form.locVerified
                  ? form.mapsQuery.trim()
                    ? 'The Get directions button is shown on the homepage and contact page.'
                    : 'Add a map destination to show the Get directions button.'
                  : 'Until this is on, the website shows the address without directions and says the details are placeholders.'}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Demo notices" id="demo">
          <Toggle checked={form.demo} onChange={(v) => set('demo', v)} label="Show demo notices" />
          <p className="mt-2 text-sm text-slate">The banner at the top of every page, the note in the footer, and the “(demo)” labels next to the phone number and opening hours. Turn this off only once the details on the site are real.</p>
          {form.demo && (
            <div className="mt-5">
              <TextArea id="st-notice" label="Banner text" rows={3} value={form.demoNotice} onChange={(e) => set('demoNotice', e.target.value)} error={errors.demoNotice} hint={`${form.demoNotice.length}/300`} />
            </div>
          )}
        </Card>

        <Card title="Footer" id="footer">
          <TextField id="st-credit" label="Footer line" optional value={form.credit} onChange={(e) => set('credit', e.target.value)} error={errors.credit} maxLength={160} hint="A short line at the very bottom of every page, such as a credit." />
        </Card>

        <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
          <button type="submit" disabled={saving || !dirty} className={buttonClass('primary', 'md')}>
            {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}
            Save settings
          </button>
          {dirty && (
            <button type="button" onClick={() => { setForm(saved); setErrors({}); }} className={buttonClass('ghost', 'md')}>
              Discard changes
            </button>
          )}
          <span className={cx('text-sm', dirty ? 'font-medium text-ink' : 'text-slate')} aria-live="polite">
            {dirty ? 'You have unsaved changes.' : lastSaved ? `All changes saved. Last saved ${formatWhen(lastSaved)}.` : 'All changes saved.'}
          </span>
        </div>
      </form>
    </div>
  );
}
