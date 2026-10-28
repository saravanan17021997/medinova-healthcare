import { useRef, useState, type FormEvent } from 'react';
import { AlertCircle, Loader2, Mail, MessageCircle, Phone } from 'lucide-react';
import { HERO, ILLUSTRATION } from '@/data/img';
import { useSite } from '@/state/content';
import { hello } from '@/config/live';
import { PageHeader } from '@/components/PageHeader';
import { LocationPanel } from '@/components/LocationPanel';
import { TextArea, TextField, buttonClass } from '@/components/ui';
import { usePageMeta } from '@/hooks/usePageMeta';
import { ordersSource, sendMessage } from '@/services/orders';
import { telUrl, whatsappUrl } from '@/services/contact';
import { isBlank, isEmail, isPhone, type Errors } from '@/lib/validation';

interface Form {
  name: string;
  phone: string;
  email: string;
  message: string;
}

export function Contact() {
  usePageMeta({ title: 'Contact us', description: 'Call, message or write to SaraDev. Demonstration contact details.' });
  const site = useSite();
  const [form, setForm] = useState<Form>({ name: '', phone: '', email: '', message: '' });
  const [errors, setErrors] = useState<Errors<Form>>({});
  const [done, setDone] = useState<null | 'demo' | 'sent' | 'saved'>(null);
  const [reference, setReference] = useState('');
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [trap, setTrap] = useState('');
  const live = ordersSource === 'database';
  const firstError = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err: Errors<Form> = {};
    if (isBlank(form.name)) err.name = 'Enter your name.';
    if (isBlank(form.phone) && isBlank(form.email)) err.phone = 'Enter a phone number or an email address so we can reply.';
    if (!isBlank(form.phone) && !isPhone(form.phone)) err.phone = 'Enter a 10-digit mobile number, or an international number starting with +.';
    if (!isBlank(form.email) && !isEmail(form.email)) err.email = 'Enter an email address like name@example.com.';
    if (isBlank(form.message)) err.message = 'Write a short message.';
    else if (form.message.length > 600) err.message = 'Keep the message under 600 characters.';
    setErrors(err);
    if (Object.keys(err).length) {
      requestAnimationFrame(() => firstError.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    if (busy) return;
    setServerError('');
    if (trap) {
      // an automated form filler: show the usual confirmation, send nothing
      setDone(live ? 'saved' : 'demo');
      return;
    }
    setBusy(true);
    const res = await sendMessage({ ...form, name: form.name.trim() });
    setBusy(false);
    if (res.mode === 'error') {
      setServerError(res.message);
      return;
    }
    setReference(res.reference ?? '');
    setDone(res.mode);
    requestAnimationFrame(() => doneRef.current?.focus());
  };

  const methods = [
    { icon: Phone, title: 'Call us', body: site.demo ? `${site.contact.phoneDisplay} (demo number)` : site.contact.phoneDisplay, href: telUrl(), label: 'Call now', external: false },
    { icon: MessageCircle, title: 'WhatsApp', body: 'A quick message is often the fastest way to reach us.', href: whatsappUrl(`${hello()}, I have a question.`), label: 'Open WhatsApp', external: true },
    { icon: Mail, title: 'Email', body: site.contact.email, href: `mailto:${site.contact.email}`, label: 'Write an email', external: false },
  ];

  return (
    <>
      <PageHeader title="Contact us" intro="Questions about a visit, a product or this demo? Choose whichever way suits you." image={HERO.exterior} crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]} />
      <section className="container-x mt-12">
        <ul className="grid gap-5 md:grid-cols-3">
          {methods.map(({ icon: Icon, title, body, href, label, external }) => (
            <li key={title} className="surface flex flex-col rounded-3xl p-6">
              <Icon className="h-6 w-6 text-teal" aria-hidden />
              <h2 className="mt-3 font-semibold text-ink">{title}</h2>
              <p className="mt-1 text-[15px] text-slate">{body}</p>
              <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} className={buttonClass('outline', 'sm', 'mt-4 self-start')}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-x mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="glass-panel rounded-[28px] p-6 sm:p-9" ref={firstError}>
          {done ? (
            <div className="text-center">
              <img src={ILLUSTRATION.contact} alt="" width={480} height={360} className="mx-auto h-auto w-56" />
              <h2 ref={doneRef} tabIndex={-1} className="mt-4 font-display text-3xl font-semibold text-ink outline-none">
                {done === 'demo' ? 'Message ready' : 'Message sent'}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-slate">{done === 'demo' ? 'This is a demo, so your message was not sent anywhere. You can send it on WhatsApp instead.' : 'Thanks. The team will reply using the details you gave.'}</p>
              {reference && (
                <p className="mt-3 text-sm text-slate">
                  Your reference: <span className="font-semibold text-ink" data-testid="message-ref">{reference}</span>
                </p>
              )}
              {done === 'demo' && (
                <a href={whatsappUrl(`${hello()}, this is ${form.name}.\n${form.message}`)} target="_blank" rel="noreferrer" className={buttonClass('primary', 'lg', 'mt-6')}>
                  <MessageCircle className="h-5 w-5" aria-hidden /> Send on WhatsApp
                </a>
              )}
            </div>
          ) : (
            <form noValidate onSubmit={onSubmit}>
              <h2 className="font-display text-2xl font-semibold text-ink">Send us a message</h2>
              {serverError && (
                <div role="alert" id="contact-error" className="mt-4 flex gap-2.5 rounded-2xl border border-[#B3261E]/40 bg-[#FCEEEE] p-4 text-[15px] text-[#8C1D18]">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                  <span>{serverError}</span>
                </div>
              )}
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField id="c-name" label="Your name" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
                </div>
                <TextField id="c-phone" label="Phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} hint="Phone or email, whichever you prefer." />
                <TextField id="c-email" label="Email" type="email" autoComplete="email" optional value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
                <div className="sm:col-span-2">
                  <TextArea id="c-message" label="Message" rows={5} maxLength={600} value={form.message} onChange={(e) => set('message', e.target.value)} error={errors.message} hint="Please don’t include detailed medical information." />
                </div>
              </div>
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="c-website">Leave this empty</label>
                <input id="c-website" name="website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
              </div>
              <button type="submit" disabled={busy} className={buttonClass('primary', 'lg', 'mt-7')}>
                {busy && <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />}
                {busy ? 'Sending…' : 'Send message'}
              </button>
              {live && <p className="mt-3 text-sm text-slate">Only the clinic team can read your message.</p>}
            </form>
          )}
        </div>
        <div className="glass-panel flex flex-col gap-5 rounded-[28px] p-6 sm:p-8">
          <img src={ILLUSTRATION.location} alt="A map with a route to a location pin" width={480} height={360} loading="lazy" className="mx-auto h-auto w-full max-w-[320px]" />
          <LocationPanel />
        </div>
      </section>
    </>
  );
}
