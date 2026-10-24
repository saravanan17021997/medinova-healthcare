import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Phone, RotateCcw, ShieldCheck } from 'lucide-react';
import { HERO, ILLUSTRATION } from '@/data/img';
import { specialties, specialtyBySlug } from '@/data/specialties';
import { doctors, doctorBySlug } from '@/data/doctors';
import { Img } from '@/components/Img';
import { PageHeader } from '@/components/PageHeader';
import { Notice, SelectField, TextArea, TextField, buttonClass } from '@/components/ui';
import { usePageMeta } from '@/hooks/usePageMeta';
import { submitEnquiry } from '@/services/enquiry';
import { telUrl, whatsappUrl } from '@/services/contact';
import { isBlank, isEmail, isPhone, type Errors } from '@/lib/validation';
import { formatDate, todayIso } from '@/lib/format';
import { site } from '@/config/site';

interface Form {
  name: string;
  phone: string;
  email: string;
  specialty: string;
  doctor: string;
  date: string;
  time: string;
  message: string;
}

const TIMES = ['Morning (9 am to 12 pm)', 'Afternoon (12 pm to 4 pm)', 'Evening (4 pm to 7 pm)'];
const ORDER: (keyof Form)[] = ['name', 'phone', 'email', 'specialty', 'doctor', 'date', 'time', 'message'];

function validate(f: Form): Errors<Form> {
  const e: Errors<Form> = {};
  if (isBlank(f.name)) e.name = 'Enter the patient’s name.';
  if (isBlank(f.phone)) e.phone = 'Enter a phone number so the team can call you back.';
  else if (!isPhone(f.phone)) e.phone = 'Enter a 10-digit mobile number, or an international number starting with +.';
  if (!isBlank(f.email) && !isEmail(f.email)) e.email = 'Enter an email address like name@example.com, or leave it empty.';
  if (isBlank(f.specialty)) e.specialty = 'Choose a specialty.';
  if (isBlank(f.date)) e.date = 'Choose a preferred date.';
  else if (f.date < todayIso()) e.date = 'Choose today or a later date.';
  if (isBlank(f.time)) e.time = 'Choose a preferred time of day.';
  if (f.message.length > 300) e.message = 'Keep the note under 300 characters.';
  return e;
}

export function Appointment() {
  usePageMeta({ title: 'Book an appointment', description: 'Send an appointment request to SaraDev. In this demonstration nothing is booked.' });
  const [params] = useSearchParams();
  const initialSpecialty = specialtyBySlug(params.get('specialty') ?? '')?.slug ?? '';
  const initialDoctor = doctorBySlug(params.get('doctor') ?? '')?.slug ?? '';
  const empty: Form = { name: '', phone: '', email: '', specialty: initialSpecialty, doctor: initialDoctor, date: '', time: '', message: '' };
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Errors<Form>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [serverError, setServerError] = useState('');
  const [sentMode, setSentMode] = useState<'demo' | 'sent'>('demo');
  const summaryRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  const doctorOptions = useMemo(() => (form.specialty ? doctors.filter((d) => d.specialtySlug === form.specialty) : doctors), [form.specialty]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'specialty' && next.doctor && doctorBySlug(next.doctor)?.specialtySlug !== v) next.doctor = '';
      return next;
    });
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const message = () => {
    const s = specialtyBySlug(form.specialty);
    const d = doctorBySlug(form.doctor);
    return [
      'Hello SaraDev, I would like to request an appointment.',
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      form.email && `Email: ${form.email}`,
      `Specialty: ${s?.name ?? ''}`,
      d && `Doctor: ${d.name}`,
      form.date && `Preferred date: ${formatDate(form.date)}`,
      `Preferred time: ${form.time}`,
      form.message && `Note: ${form.message}`,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setStatus('sending');
    setServerError('');
    const res = await submitEnquiry('appointment', { ...form });
    if (res.mode === 'error') {
      setServerError(res.message);
      setStatus('idle');
      return;
    }
    setSentMode(res.mode);
    setStatus('done');
    requestAnimationFrame(() => doneRef.current?.focus());
  };

  const errorList = ORDER.filter((k) => errors[k]);

  return (
    <>
      <PageHeader title="Book an appointment" intro="Tell us who the appointment is for and when suits you. The team will call you back to confirm a time." image={HERO.appointment} crumbs={[{ label: 'Home', to: '/' }, { label: 'Book an appointment' }]} />
      <section className="container-x mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[28px] bg-white p-6 shadow-card ring-1 ring-line/60 sm:p-9">
          {status === 'done' ? (
            <div className="text-center">
              <img src={ILLUSTRATION.appointment} alt="" width={480} height={360} className="mx-auto h-auto w-64" />
              <h2 ref={doneRef} tabIndex={-1} className="mt-4 font-display text-3xl font-semibold text-ink outline-none">
                {sentMode === 'sent' ? 'Request sent' : 'Your request is ready to send'}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-slate">{sentMode === 'sent' ? 'The team will call you to confirm a time. Your appointment is not booked until they do.' : 'This is a demo, so nothing has been booked and nothing was sent. You can send the request yourself on WhatsApp.'}</p>
              <dl className="mx-auto mt-6 max-w-md space-y-2 rounded-2xl bg-mist p-5 text-left text-[15px]">
                {[
                  ['Patient', form.name],
                  ['Specialty', specialtyBySlug(form.specialty)?.name],
                  ['Doctor', doctorBySlug(form.doctor)?.name ?? 'Any available'],
                  ['Preferred date', form.date && formatDate(form.date)],
                  ['Preferred time', form.time],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-slate">{k}</dt>
                    <dd className="text-right font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={whatsappUrl(message())} target="_blank" rel="noreferrer" className={buttonClass('primary', 'lg')}>
                  <MessageCircle className="h-5 w-5" aria-hidden /> Send on WhatsApp
                </a>
                <button
                  type="button"
                  className={buttonClass('outline', 'lg')}
                  onClick={() => {
                    setForm(empty);
                    setStatus('idle');
                  }}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden /> Start a new request
                </button>
              </div>
            </div>
          ) : (
            <form noValidate onSubmit={onSubmit} aria-describedby="form-note">
              <h2 className="font-display text-2xl font-semibold text-ink">Appointment request</h2>
              <p id="form-note" className="mt-1 text-sm text-slate">
                Fields marked optional can be left empty. Please don’t include detailed medical information.
              </p>

              {errorList.length > 0 && (
                <div ref={summaryRef} tabIndex={-1} role="alert" className="mt-6 rounded-2xl border border-[#B3261E]/40 bg-[#FCEEEE] p-4 outline-none">
                  <p className="font-semibold text-[#8C1D18]">Check {errorList.length === 1 ? 'this field' : `these ${errorList.length} fields`}:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {errorList.map((k) => (
                      <li key={k}>
                        <a href={`#${k}`} className="text-[#8C1D18] underline">
                          {errors[k]}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {serverError && <Notice className="mt-6">{serverError}</Notice>}

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <TextField id="name" label="Patient name" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
                <TextField id="phone" label="Contact number" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} hint="We’ll call this number to confirm." />
                <TextField id="email" label="Email" type="email" autoComplete="email" optional value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
                <SelectField id="specialty" label="Specialty" value={form.specialty} onChange={(e) => set('specialty', e.target.value)} error={errors.specialty}>
                  <option value="">Choose a specialty</option>
                  {specialties.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField id="doctor" label="Doctor" optional value={form.doctor} onChange={(e) => set('doctor', e.target.value)} hint="Demo profiles. Leave as “Any available” if you have no preference.">
                  <option value="">Any available</option>
                  {doctorOptions.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name}
                    </option>
                  ))}
                </SelectField>
                <TextField id="date" label="Preferred date" type="date" min={todayIso()} value={form.date} onChange={(e) => set('date', e.target.value)} error={errors.date} />
                <div className="sm:col-span-2">
                  <fieldset aria-describedby={errors.time ? 'time-error' : undefined}>
                    <legend id="time" tabIndex={-1} className="text-sm font-semibold text-ink">
                      Preferred time of day
                    </legend>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {TIMES.map((t) => (
                        <label key={t} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[15px] ${form.time === t ? 'border-teal bg-aqua-50' : 'border-line bg-white hover:border-slate-400'}`}>
                          <input type="radio" name="time" value={t} checked={form.time === t} onChange={() => set('time', t)} className="h-4 w-4 accent-teal" />
                          {t}
                        </label>
                      ))}
                    </div>
                    {errors.time && (
                      <p id="time-error" className="mt-1.5 text-sm font-medium text-[#B3261E]">
                        {errors.time}
                      </p>
                    )}
                  </fieldset>
                </div>
                <div className="sm:col-span-2">
                  <TextArea id="message" label="Anything we should know?" optional maxLength={300} rows={3} value={form.message} onChange={(e) => set('message', e.target.value)} error={errors.message} hint={`For example accessibility needs or a language preference. ${300 - form.message.length} characters left.`} />
                </div>
              </div>
              <button type="submit" disabled={status === 'sending'} className={buttonClass('primary', 'lg', 'mt-8 w-full sm:w-auto')}>
                {status === 'sending' ? 'Sending your request…' : 'Send appointment request'}
              </button>
              <p className="mt-4 text-sm text-slate">A request is not a confirmed appointment. In an emergency, call your local emergency number.</p>
            </form>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-[28px] shadow-card ring-1 ring-line/60">
            <Img image={HERO.consultation} sizes="(min-width: 1024px) 34vw, 92vw" className="aspect-[16/11] w-full object-cover" />
          </div>
          <div className="rounded-[28px] bg-white p-6 shadow-card ring-1 ring-line/60">
            <h2 className="font-semibold text-ink">Prefer to talk?</h2>
            <p className="mt-1 text-[15px] text-slate">Call or message the team during opening hours.</p>
            <div className="mt-4 flex flex-col gap-2">
              <a href={telUrl()} className={buttonClass('dark', 'md')}>
                <Phone className="h-4 w-4" aria-hidden /> {site.contact.phoneDisplay}
              </a>
              <a href={whatsappUrl('Hello SaraDev, I would like to request an appointment.')} target="_blank" rel="noreferrer" className={buttonClass('outline', 'md')}>
                <MessageCircle className="h-4 w-4" aria-hidden /> Message on WhatsApp
              </a>
            </div>
          </div>
          <p className="flex gap-2.5 px-2 text-sm text-slate">
            <ShieldCheck className="h-5 w-5 shrink-0 text-teal" aria-hidden /> We only ask for what we need to call you back. This demo stores nothing.
          </p>
        </aside>
      </section>
    </>
  );
}
