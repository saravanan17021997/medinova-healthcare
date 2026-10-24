import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, MapPin, MessageCircle, Phone, Search, ShoppingBag } from 'lucide-react';
import { site } from '@/config/site';
import { HERO } from '@/data/img';
import { specialties } from '@/data/specialties';
import { doctors } from '@/data/doctors';
import { categories, products } from '@/data/products';
import { Img } from '@/components/Img';
import { DoctorCard, ProductCard, SpecialtyCard } from '@/components/cards';
import { SpecialtyIcon } from '@/components/SpecialtyIcon';
import { LinkButton, Notice, SectionHeading, buttonClass } from '@/components/ui';
import { Testimonials } from '@/components/Testimonials';
import { LocationPanel } from '@/components/LocationPanel';
import { usePageMeta } from '@/hooks/usePageMeta';
import { whatsappUrl } from '@/services/contact';

function Hero() {
  const quick = ['general-medicine', 'cardiology', 'paediatrics', 'dentistry'].map((s) => specialties.find((x) => x.slug === s)!);
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-aqua-50/60 to-mist">
      {/* the care pathway: one line that connects the visitor to care */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 1200 640" preserveAspectRatio="none">
        <path className="pathway-line" pathLength={1} d="M-20,560 C180,560 300,600 470,540 C620,486 620,330 760,250 C860,192 930,120 1040,96" fill="none" stroke="#5BC0BE" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="container-x relative grid items-center gap-10 pb-16 pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24 lg:pt-16">
        <div>
          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.01em] text-ink sm:text-6xl lg:text-[4.1rem]">Healthcare that puts you first</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate sm:text-xl">Explore healthcare services, discover medical professionals, request appointments, and browse healthcare essentials in one convenient digital experience.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton to="/appointment" size="lg">
              <CalendarCheck className="h-5 w-5" aria-hidden /> Book an appointment
            </LinkButton>
            <LinkButton to="/specialties" variant="outline" size="lg">
              Explore services
            </LinkButton>
          </div>
          <div className="mt-10">
            <p className="text-sm font-semibold text-ink">Popular specialties</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {quick.map((s) => (
                <li key={s.slug}>
                  <Link to={`/specialties/${s.slug}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-ink shadow-card ring-1 ring-line/70 hover:ring-teal">
                    <SpecialtyIcon name={s.icon} className="h-4 w-4 text-teal" />
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="arch-lg aspect-[5/6] overflow-hidden bg-white shadow-lift ring-1 ring-line/60">
            <Img image={HERO.team} priority sizes="(min-width: 1024px) 46vw, 92vw" className="h-full w-full object-cover object-[50%_40%]" />
          </div>
          <span aria-hidden className="pathway-node absolute -right-1 top-[6%] hidden h-5 w-5 rounded-full bg-aqua ring-8 ring-aqua/20 lg:block" />
        </div>
      </div>
    </section>
  );
}

function AppointmentBand() {
  const steps = ['Choose a specialty, and a doctor if you have one in mind.', 'Pick a day and a time of day that suits you.', 'The team calls you back to confirm a slot.'];
  return (
    <section aria-labelledby="appointment-heading" className="container-x mt-24">
      <div className="grid overflow-hidden rounded-[32px] bg-ink text-white lg:grid-cols-2">
        <div className="relative min-h-[260px]">
          <Img image={HERO.consultation} sizes="(min-width: 1024px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover object-center" />
        </div>
        <div className="p-8 sm:p-12">
          <h2 id="appointment-heading" className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Request an appointment in three steps
          </h2>
          <ol className="mt-8 space-y-5">
            {steps.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aqua text-sm font-bold text-ink">{i + 1}</span>
                <span className="pt-1 text-white/85">{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <LinkButton to="/appointment" variant="light" size="lg">
              Start your request
            </LinkButton>
            <a href={whatsappUrl('Hello SaraDev, I would like to request an appointment.')} target="_blank" rel="noreferrer" className={buttonClass('ghost', 'lg', 'text-white hover:bg-white/10')}>
              <MessageCircle className="h-5 w-5" aria-hidden /> Ask on WhatsApp
            </a>
          </div>
          <p className="mt-6 text-sm text-white/60">Demo: requests are not booked. Nothing is sent unless integrations are switched on.</p>
        </div>
      </div>
    </section>
  );
}

function Essentials() {
  const featured = products.filter((p) => p.featured).slice(0, 4);
  return (
    <section aria-labelledby="essentials-heading" className="container-x mt-24">
      <SectionHeading id="essentials-heading" title="Everyday health essentials" intro="A sample catalogue of home-care items. Prices are illustrative and orders are simulated." action={<LinkButton to="/store" variant="outline">Visit the store</LinkButton>} />
      <ul className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <li key={c.slug} className="shrink-0">
            <Link to={`/store?category=${c.slug}`} className="flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-sm font-medium text-ink ring-1 ring-line/70 hover:ring-teal">
              <img src={c.icon} alt="" width={64} height={64} className="h-8 w-8" loading="lazy" />
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}

function WhyUs() {
  const items = [
    { icon: Search, title: 'Find the right care', body: 'Browse specialties and team profiles, and filter by language and availability.' },
    { icon: CalendarCheck, title: 'Request a time that suits you', body: 'Send an appointment request in a few steps, without waiting on hold.' },
    { icon: MessageCircle, title: 'Talk to us on WhatsApp', body: 'Every page offers a one-tap message with your question already written.' },
    { icon: ShoppingBag, title: 'Order everyday essentials', body: 'Pick up home-care items from the same place you manage your visits.' },
  ];
  return (
    <section aria-labelledby="why-heading" className="container-x mt-24">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="overflow-hidden rounded-[28px] shadow-card ring-1 ring-line/60">
          <Img image={HERO.reception} sizes="(min-width: 1024px) 46vw, 92vw" className="aspect-[16/11] w-full object-cover object-center" />
        </div>
        <div>
          <SectionHeading id="why-heading" title="Why people choose SaraDev" intro="Everything you need before, between and after visits, in one place." />
          <ul className="grid gap-6 sm:grid-cols-2">
            {items.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Icon className="h-6 w-6 text-teal" aria-hidden />
                <h3 className="mt-3 font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-slate">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Visit() {
  return (
    <section aria-labelledby="visit-heading" className="container-x mt-24">
      <SectionHeading id="visit-heading" title="Visit or contact us" />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="overflow-hidden rounded-[28px] shadow-card ring-1 ring-line/60">
          <Img image={HERO.exterior} sizes="(min-width: 1024px) 56vw, 92vw" className="aspect-[16/10] h-full w-full object-cover object-center" />
        </div>
        <div className="flex flex-col gap-4 rounded-[28px] bg-white p-7 shadow-card ring-1 ring-line/60">
          <LocationPanel />
          <div className="border-t border-line/70 pt-4">
            <h3 className="flex items-center gap-2 font-semibold text-ink">
              <Clock className="h-[18px] w-[18px] text-teal" aria-hidden /> Opening hours <span className="text-xs font-normal text-slate">(demo)</span>
            </h3>
            <dl className="mt-3 space-y-1.5 text-[15px]">
              {site.contact.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4">
                  <dt className="text-slate">{h.days}</dt>
                  <dd className="font-medium text-ink">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-auto flex flex-col gap-2 sm:flex-row">
            <a href={`tel:${site.contact.phoneHref}`} className={buttonClass('dark', 'md', 'flex-1')}>
              <Phone className="h-4 w-4" aria-hidden /> Call us
            </a>
            <a href={whatsappUrl('Hello SaraDev, I have a question.')} target="_blank" rel="noreferrer" className={buttonClass('outline', 'md', 'flex-1')}>
              <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Home() {
  usePageMeta({ title: site.name, description: 'Explore healthcare services, discover medical professionals, request appointments and browse healthcare essentials. A SaraDev demonstration website.' });
  return (
    <>
      <Hero />

      <section aria-labelledby="specialties-heading" className="container-x mt-20">
        <SectionHeading id="specialties-heading" title="Find the right specialty" intro="Start with what you need help with. Each specialty page explains what to expect and who you can see." action={<LinkButton to="/specialties" variant="outline">All specialties</LinkButton>} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {specialties.map((s) => (
            <SpecialtyCard key={s.slug} specialty={s} compact />
          ))}
        </div>
      </section>

      <section aria-labelledby="team-heading" className="container-x mt-24">
        <SectionHeading id="team-heading" title="Meet the care team" intro="Browse profiles by specialty, language and the days each person is available." action={<LinkButton to="/doctors" variant="outline">Find a doctor</LinkButton>} />
        <Notice className="mb-6">These are fictional demonstration profiles with illustrated portraits, not real clinicians. Replace them with verified details before publishing.</Notice>
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {doctors.slice(0, 4).map((d) => (
            <DoctorCard key={d.slug} doctor={d} />
          ))}
        </div>
      </section>

      <AppointmentBand />
      <Essentials />
      <WhyUs />
      <Testimonials />
      <Visit />
      <p className="container-x mt-10 flex items-center gap-2 text-sm text-slate">
        <MapPin className="h-4 w-4" aria-hidden /> Location details are placeholders until a verified address is configured.
      </p>
    </>
  );
}
