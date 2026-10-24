import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CalendarCheck, Languages, MessageCircle, Search, Video, Building2 } from 'lucide-react';
import { HERO, ILLUSTRATION } from '@/data/img';
import { doctors, doctorBySlug, allLanguages } from '@/data/doctors';
import { specialties, specialtyBySlug } from '@/data/specialties';
import { Img } from '@/components/Img';
import { DoctorCard } from '@/components/cards';
import { PageHeader, Breadcrumbs } from '@/components/PageHeader';
import { DemoBadge, EmptyState, LinkButton, Notice, buttonClass } from '@/components/ui';
import { usePageMeta } from '@/hooks/usePageMeta';
import { whatsappUrl } from '@/services/contact';
import { NotFound } from './NotFound';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Doctors() {
  usePageMeta({ title: 'Find a doctor', description: 'Search SaraDev’s fictional demo team profiles by name, specialty, language and availability.' });
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const specialty = params.get('specialty') ?? '';
  const language = params.get('language') ?? '';
  const day = params.get('day') ?? '';

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const list = useMemo(
    () =>
      doctors.filter(
        (d) =>
          (!q || d.name.toLowerCase().includes(q.toLowerCase()) || d.role.toLowerCase().includes(q.toLowerCase())) &&
          (!specialty || d.specialtySlug === specialty) &&
          (!language || d.languages.includes(language)) &&
          (!day || d.availability.includes(day)),
      ),
    [q, specialty, language, day],
  );

  const selectClass = 'h-12 w-full rounded-xl border border-line bg-white px-4 text-base';

  return (
    <>
      <PageHeader title="Find a doctor" intro="Filter the team by specialty, language or day, then request an appointment with the person you’d like to see." image={HERO.professional} crumbs={[{ label: 'Home', to: '/' }, { label: 'Doctors' }]} />
      <section className="container-x mt-10">
        <Notice className="mb-6">Every profile here is a fictional demonstration with an illustrated portrait. They are not real people or licensed practitioners.</Notice>
        <form role="search" className="grid gap-3 rounded-3xl bg-white p-4 shadow-card ring-1 ring-line/60 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <label htmlFor="doctor-q" className="sr-only">
              Search by name
            </label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate" aria-hidden />
            <input id="doctor-q" type="search" value={q} onChange={(e) => update('q', e.target.value)} placeholder="Search by name" className={`${selectClass} pl-12`} />
          </div>
          <div>
            <label htmlFor="doctor-specialty" className="sr-only">
              Specialty
            </label>
            <select id="doctor-specialty" value={specialty} onChange={(e) => update('specialty', e.target.value)} className={selectClass}>
              <option value="">All specialties</option>
              {specialties.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="doctor-language" className="sr-only">
              Language
            </label>
            <select id="doctor-language" value={language} onChange={(e) => update('language', e.target.value)} className={selectClass}>
              <option value="">Any language</option>
              {allLanguages.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="doctor-day" className="sr-only">
              Available on
            </label>
            <select id="doctor-day" value={day} onChange={(e) => update('day', e.target.value)} className={selectClass}>
              <option value="">Any day</option>
              {DAYS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </form>
        <p className="mt-6 text-sm text-slate" aria-live="polite">
          Showing {list.length} of {doctors.length} profiles
        </p>
        {list.length ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
            {list.map((d) => (
              <DoctorCard key={d.slug} doctor={d} />
            ))}
          </div>
        ) : (
          <EmptyState image={ILLUSTRATION.emptySearch} title="No profiles match these filters" body="Try removing a filter, or choose a different day or language." action={<button type="button" className="font-semibold text-teal-700 underline" onClick={() => setParams({}, { replace: true })}>Clear all filters</button>} />
        )}
      </section>
    </>
  );
}

export function DoctorProfile() {
  const { slug = '' } = useParams();
  const d = doctorBySlug(slug);
  const s = d ? specialtyBySlug(d.specialtySlug) : undefined;
  usePageMeta({ title: d ? `${d.name} (demo profile)` : 'Profile not found', description: d ? `${d.role}, ${s?.name}. A fictional demonstration profile.` : 'This profile could not be found.', image: d?.image.src });
  if (!d || !s) return <NotFound />;

  return (
    <section className="container-x py-10 lg:py-14">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Doctors', to: '/doctors' }, { label: d.name }]} />
      <div className="grid gap-10 lg:grid-cols-[380px_1fr] lg:gap-14">
        <div>
          <div className="arch aspect-[4/5] overflow-hidden bg-aqua-50 shadow-card ring-1 ring-line/60">
            <Img image={d.image} priority sizes="(min-width: 1024px) 380px, 92vw" className="h-full w-full object-cover object-top" />
          </div>
        </div>
        <div>
          <DemoBadge>Fictional demo profile</DemoBadge>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">{d.name}</h1>
          <p className="mt-2 text-lg text-slate">
            {d.role},{' '}
            <Link to={`/specialties/${s.slug}`} className="font-medium text-teal-700 underline">
              {s.name}
            </Link>
          </p>
          <Notice className="mt-6">This profile is a sample for demonstration. It has no qualifications or registration because it does not describe a real clinician. Replace it with verified details.</Notice>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Languages className="h-4 w-4 text-teal" aria-hidden /> Languages
              </dt>
              <dd className="mt-1 text-slate">{d.languages.join(', ')}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm font-semibold text-ink">
                {d.modes.includes('Video') ? <Video className="h-4 w-4 text-teal" aria-hidden /> : <Building2 className="h-4 w-4 text-teal" aria-hidden />} Consultations
              </dt>
              <dd className="mt-1 text-slate">{d.modes.join(' and ')}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold text-ink">Usually available</dt>
              <dd className="mt-2">
                <ul className="flex flex-wrap gap-2" aria-label="Available days">
                  {DAYS.map((day) => (
                    <li key={day} className={d.availability.includes(day) ? 'rounded-full bg-teal px-3 py-1 text-sm font-semibold text-white' : 'rounded-full bg-mist-200 px-3 py-1 text-sm text-slate line-through decoration-slate/50'}>
                      <span className="sr-only">{d.availability.includes(day) ? 'Available ' : 'Not available '}</span>
                      {day}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold text-ink">Areas of focus</dt>
              <dd className="mt-1 text-slate">{d.focus.join(', ')}</dd>
            </div>
          </dl>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <LinkButton to={`/appointment?specialty=${s.slug}&doctor=${d.slug}`} size="lg">
              <CalendarCheck className="h-5 w-5" aria-hidden /> Request an appointment
            </LinkButton>
            <a href={whatsappUrl(`Hello SaraDev, I would like to request an appointment with ${d.name} (${s.name}).`)} target="_blank" rel="noreferrer" className={buttonClass('outline', 'lg')}>
              <MessageCircle className="h-5 w-5" aria-hidden /> Ask on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
