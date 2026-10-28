import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { CalendarCheck, Clock, HeartPulse, MapPin, MessageCircle, Phone, Stethoscope } from 'lucide-react';
import { HERO } from '@/data/img';
import { hello } from '@/config/live';
import { useSections, useSite } from '@/state/content';
import type { Cta, PageSection } from '@/services/content';
import { careSource } from '@/services/care';
import { isInternal } from '@/lib/links';
import { FeatureIcon } from '@/components/FeatureIcon';
import { HeroSlider } from '@/components/HeroSlider';
import { useCare } from '@/state/care';
import { CardGridSkeleton, CareError } from '@/components/care';
import { useCatalog } from '@/state/catalog';
import { ProductGridSkeleton } from '@/components/store';
import { Img } from '@/components/Img';
import { DoctorCard, ProductCard, SpecialtyCard } from '@/components/cards';
import { SpecialtyIcon } from '@/components/SpecialtyIcon';
import { LinkButton, Notice, SectionHeading, buttonClass } from '@/components/ui';
import { Testimonials } from '@/components/Testimonials';
import { LocationPanel } from '@/components/LocationPanel';
import { usePageMeta } from '@/hooks/usePageMeta';
import { telUrl, whatsappUrl } from '@/services/contact';

/** A button from the admin panel: a router link for pages on this site, a normal link for anything else. */
function CtaButton({ cta, variant = 'primary', className, children }: { cta: Cta; variant?: 'primary' | 'outline' | 'light'; className?: string; children?: ReactNode }) {
  const content = children ?? cta.label;
  if (isInternal(cta.href))
    return (
      <LinkButton to={cta.href} variant={variant} size="lg" className={className}>
        {content}
      </LinkButton>
    );
  return (
    <a href={cta.href} {...(cta.href.startsWith('https://') ? { target: '_blank', rel: 'noreferrer' } : {})} className={buttonClass(variant, 'lg', className)}>
      {content}
    </a>
  );
}

function Hero({ section }: { section: PageSection }) {
  const { specialties } = useCare(true);
  const preferred = ['general-medicine', 'cardiology', 'paediatrics', 'dentistry'].map((s) => specialties.find((x) => x.slug === s)).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const quick = preferred.length >= 2 ? preferred : specialties.slice(0, 4);
  return (
    // Pulled up under the floating header, so the glass bar sits over the hero's soft colour.
    <section className="relative -mt-[76px] overflow-hidden pt-[76px] lg:-mt-[80px] lg:pt-[80px]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_520px_at_78%_18%,rgba(99,209,206,0.24),transparent_62%),linear-gradient(180deg,#ffffff_0%,#f4fbfb_55%,#f2fafa_100%)]" />
      <div aria-hidden className="orb -left-28 top-40 h-72 w-72 bg-aqua/25" />
      <div aria-hidden className="orb -right-24 -top-10 h-[26rem] w-[26rem] bg-teal-500/15" />
      {/* the care pathway: one line that connects the visitor to care */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 1200 640" preserveAspectRatio="none">
        <path className="pathway-line" pathLength={1} d="M-20,560 C180,560 300,600 470,540 C620,486 620,330 760,250 C860,192 930,120 1040,96" fill="none" stroke="#63D1CE" strokeOpacity="0.8" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="container-x relative grid items-center gap-12 pb-16 pt-8 lg:grid-cols-[1fr_1.08fr] lg:gap-14 lg:pb-24 lg:pt-14">
        <div>
          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.015em] text-ink sm:text-6xl lg:text-[4.1rem]">{section.heading}</h1>
          {section.body && <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate sm:text-xl">{section.body}</p>}
          {(section.cta || section.cta2) && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {section.cta && (
                <CtaButton cta={section.cta}>
                  {section.cta.href.startsWith('/appointment') && <CalendarCheck className="h-5 w-5" aria-hidden />} {section.cta.label}
                </CtaButton>
              )}
              {section.cta2 && <CtaButton cta={section.cta2} variant="outline" />}
            </div>
          )}
          <div className="mt-10">
            <p className="text-sm font-semibold text-ink">Popular specialties</p>
            <ul className="mt-3 flex flex-wrap gap-2.5">
              {quick.map((s) => (
                <li key={s.slug}>
                  <Link to={`/specialties/${s.slug}`} className="glass inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-medium text-ink transition duration-200 hover:-translate-y-0.5 hover:text-teal-700 motion-reduce:hover:translate-y-0">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/10">
                      <SpecialtyIcon name={s.icon} className="h-4 w-4 text-teal" />
                    </span>
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[640px]">
          <div aria-hidden className="absolute -inset-8 rounded-[48px] bg-[radial-gradient(closest-side,rgba(99,209,206,0.38),rgba(99,209,206,0)_100%)]" />
          <div className="glass relative rounded-[32px] p-3 sm:p-4">
            <HeroSlider slides={section.slides} fallback={section.image ?? HERO.team} priority />
          </div>
          {/* restrained decorations, only where there is room for them */}
          <span aria-hidden className="glass float-y absolute -left-7 top-10 hidden h-14 w-14 items-center justify-center rounded-2xl lg:flex">
            <Stethoscope className="h-6 w-6 text-teal-500" />
          </span>
          <span aria-hidden className="glass float-y-slow absolute -bottom-5 -right-5 hidden h-14 w-14 items-center justify-center rounded-2xl lg:flex">
            <HeartPulse className="h-6 w-6 text-teal-500" />
          </span>
          <span aria-hidden className="pathway-node absolute -right-1.5 top-[4%] hidden h-5 w-5 rounded-full bg-aqua ring-8 ring-aqua/25 lg:block" />
        </div>
      </div>
    </section>
  );
}

function AppointmentBand({ section }: { section: PageSection }) {
  const steps = section.steps;
  return (
    <section aria-labelledby="appointment-heading" className="container-x mt-24">
      <div className="relative grid overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#102B4E_0%,#163A66_55%,#0B4F5E_100%)] text-white shadow-lift lg:grid-cols-2">
        <div aria-hidden className="orb -right-16 -top-20 h-72 w-72 bg-aqua/25" />
        <div className="relative min-h-[260px]">
          <Img image={section.image ?? HERO.consultation} sizes="(min-width: 1024px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover object-center" />
        </div>
        <div className="relative p-8 sm:p-12">
          <h2 id="appointment-heading" className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {section.heading}
          </h2>
          {section.body && <p className="mt-4 text-white/80">{section.body}</p>}
          {steps.length > 0 && (
          <ol className="mt-8 space-y-5">
            {steps.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-aqua ring-1 ring-white/25 backdrop-blur">{i + 1}</span>
                <span className="pt-1 text-white/85">{s}</span>
              </li>
            ))}
          </ol>
          )}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            {section.cta && <CtaButton cta={section.cta} variant="light" />}
            <a href={whatsappUrl(`${hello()}, I would like to request an appointment.`)} target="_blank" rel="noreferrer" className={buttonClass('ghost', 'lg', 'text-white hover:bg-white/10')}>
              <MessageCircle className="h-5 w-5" aria-hidden /> Ask on WhatsApp
            </a>
          </div>
          <p className="mt-6 text-sm text-white/60">{careSource === 'database' ? 'A request is not a booking: the team calls you to confirm a time.' : 'Demo: requests are not booked. Nothing is sent unless integrations are switched on.'}</p>
        </div>
      </div>
    </section>
  );
}

function Essentials({ section }: { section: PageSection }) {
  const { status, categories, products } = useCatalog(true);
  const featured = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].slice(0, 4);
  return (
    <section aria-labelledby="essentials-heading" className="container-x mt-24">
      <SectionHeading id="essentials-heading" title={section.heading} intro={section.body || undefined} action={<LinkButton to="/store" variant="outline">Visit the store</LinkButton>} />
      <ul className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <li key={c.slug} className="shrink-0">
            <Link to={`/store?category=${c.slug}`} className="surface flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-medium text-ink hover:ring-teal">
              {c.icon ? <img src={c.icon} alt="" width={64} height={64} className="h-8 w-8" loading="lazy" /> : <span className="w-2" />}
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
      {status === 'loading' || status === 'idle' ? (
        <ProductGridSkeleton count={4} />
      ) : status === 'error' ? null : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function WhyUs({ section }: { section: PageSection }) {
  return (
    <section aria-labelledby="why-heading" className="container-x relative isolate mt-24">
      <div aria-hidden className="pointer-events-none absolute inset-x-4 inset-y-0 -z-10 overflow-hidden rounded-[40px]">
        <div className="orb -bottom-16 right-10 h-72 w-72 bg-aqua/25" />
        <div className="orb -top-10 left-1/3 h-56 w-56 bg-teal-500/10" />
      </div>
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="glass rounded-[32px] p-2.5 sm:p-3">
          <div className="overflow-hidden rounded-[24px]">
            <Img image={section.image ?? HERO.reception} sizes="(min-width: 1024px) 46vw, 92vw" className="aspect-[16/11] w-full object-cover object-center" />
          </div>
        </div>
        <div>
          <SectionHeading id="why-heading" title={section.heading} intro={section.body || undefined} />
          {section.features.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2">
              {section.features.map((f) => (
                <li key={f.title} className="glass rounded-2xl p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/15">
                    <FeatureIcon name={f.icon} className="h-5 w-5 text-teal" />
                  </span>
                  <h3 className="mt-3 font-semibold text-ink">{f.title}</h3>
                  {f.body && <p className="mt-1 text-[15px] leading-relaxed text-slate">{f.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Visit({ section }: { section: PageSection }) {
  const site = useSite();
  return (
    <section aria-labelledby="visit-heading" className="container-x mt-24">
      <SectionHeading id="visit-heading" title={section.heading} intro={section.body || undefined} />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="glass rounded-[32px] p-2.5 sm:p-3">
          <div className="h-full overflow-hidden rounded-[24px]">
            <Img image={HERO.exterior} sizes="(min-width: 1024px) 56vw, 92vw" className="aspect-[16/10] h-full w-full object-cover object-center" />
          </div>
        </div>
        <div className="surface flex flex-col gap-4 rounded-[28px] p-7">
          <LocationPanel />
          <div className="border-t border-line/70 pt-4">
            <h3 className="flex items-center gap-2 font-semibold text-ink">
              <Clock className="h-[18px] w-[18px] text-teal" aria-hidden /> Opening hours {site.demo && <span className="text-xs font-normal text-slate">(demo)</span>}
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
            <a href={telUrl()} className={buttonClass('dark', 'md', 'flex-1')}>
              <Phone className="h-4 w-4" aria-hidden /> Call us
            </a>
            <a href={whatsappUrl(`${hello()}, I have a question.`)} target="_blank" rel="noreferrer" className={buttonClass('outline', 'md', 'flex-1')}>
              <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Specialties({ section }: { section: PageSection }) {
  const { status, specialties } = useCare(true);
  return (
    <section aria-labelledby="specialties-heading" className="container-x mt-8 sm:mt-14 lg:mt-20">
      <SectionHeading id="specialties-heading" title={section.heading} intro={section.body || undefined} action={<LinkButton to="/specialties" variant="outline">All specialties</LinkButton>} />
      {status === 'ready' ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {specialties.map((s) => (
            <SpecialtyCard key={s.slug} specialty={s} compact />
          ))}
        </div>
      ) : status === 'error' ? (
        <CareError />
      ) : (
        <CardGridSkeleton count={5} className="lg:grid-cols-5" />
      )}
    </section>
  );
}

function Team({ section }: { section: PageSection }) {
  const { status, doctors } = useCare(true);
  const anyDemo = doctors.some((d) => d.isDemo !== false);
  return (
    <section aria-labelledby="team-heading" className="container-x mt-24">
      <SectionHeading id="team-heading" title={section.heading} intro={section.body || undefined} action={<LinkButton to="/doctors" variant="outline">Find a doctor</LinkButton>} />
      {anyDemo && <Notice className="mb-6">These are fictional demonstration profiles with illustrated portraits, not real clinicians. Replace them with verified details before publishing.</Notice>}
      {status === 'ready' ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {doctors.slice(0, 4).map((d) => (
            <DoctorCard key={d.slug} doctor={d} />
          ))}
        </div>
      ) : status === 'error' ? null : (
        <CardGridSkeleton count={4} tall className="grid-cols-2" />
      )}
    </section>
  );
}

const SECTION_VIEWS: Record<Exclude<PageSection['key'], 'home.hero'>, (p: { section: PageSection }) => JSX.Element> = {
  'home.specialties': Specialties,
  'home.team': Team,
  'home.appointment': AppointmentBand,
  'home.essentials': Essentials,
  'home.why': WhyUs,
  'home.visit': Visit,
};

export function Home() {
  const site = useSite();
  const { sections } = useSections();
  const [hero, ...rest] = sections;
  const showsVisit = rest.some((s) => s.key === 'home.visit');
  usePageMeta({ title: site.name, description: 'Explore healthcare services, discover medical professionals, request appointments and browse healthcare essentials. A SaraDev demonstration website.' });
  return (
    <>
      <Hero section={hero} />
      {rest.map((section) => {
        const View = SECTION_VIEWS[section.key as keyof typeof SECTION_VIEWS];
        return (
          <div key={section.key} data-section={section.key} className="contents">
            {section.key === 'home.visit' && <Testimonials />}
            <View section={section} />
          </div>
        );
      })}
      {!showsVisit && <Testimonials />}
      {showsVisit && !site.location.verified && (
        <p className="container-x mt-10 flex items-center gap-2 text-sm text-slate">
          <MapPin className="h-4 w-4" aria-hidden /> Location details are placeholders until a verified address is configured.
        </p>
      )}
    </>
  );
}
