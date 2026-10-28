import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarCheck, Check, Search } from 'lucide-react';
import { HERO, ILLUSTRATION } from '@/data/img';
import { useCare } from '@/state/care';
import { CardGridSkeleton, CareError } from '@/components/care';
import { Img } from '@/components/Img';
import { DoctorCard, SpecialtyCard } from '@/components/cards';
import { PageHeader, Breadcrumbs } from '@/components/PageHeader';
import { EmptyState, LinkButton, Notice, SectionHeading } from '@/components/ui';
import { SpecialtyIcon } from '@/components/SpecialtyIcon';
import { usePageMeta } from '@/hooks/usePageMeta';
import { NotFound } from './NotFound';

export function Specialties() {
  usePageMeta({ title: 'Specialties', description: 'Browse SaraDev’s demonstration specialties, from general medicine to diagnostics, and see who you can book with.' });
  const { status, specialties } = useCare(true);
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? specialties.filter((s) => [s.name, s.summary, ...s.reasons].join(' ').toLowerCase().includes(t)) : specialties;
  }, [q, specialties]);

  return (
    <>
      <PageHeader title="Specialties" intro="Choose a specialty to see what it covers, common reasons people visit and the team members you can request." image={HERO.collaboration} crumbs={[{ label: 'Home', to: '/' }, { label: 'Specialties' }]}>
        <label htmlFor="specialty-search" className="sr-only">
          Search specialties
        </label>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate" aria-hidden />
          <input id="specialty-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, for example “skin” or “heart”" className="h-12 w-full rounded-full border border-line bg-white pl-12 pr-4 text-base" />
        </div>
      </PageHeader>
      <section className="container-x mt-12">
        <Notice className="mb-8">Demonstration categories only. A real site should list only the services the organisation has confirmed.</Notice>
        {status === 'idle' || status === 'loading' ? (
          <CardGridSkeleton count={8} />
        ) : status === 'error' ? (
          <CareError />
        ) : list.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((s) => (
              <SpecialtyCard key={s.slug} specialty={s} />
            ))}
          </div>
        ) : (
          <EmptyState image={ILLUSTRATION.emptySearch} title="No specialties match your search" body={`Nothing matches “${q}”. Try a broader word, or browse the full list.`} action={<button type="button" onClick={() => setQ('')} className="font-semibold text-teal-700 underline">Clear the search</button>} />
        )}
      </section>
    </>
  );
}

export function SpecialtyDetail() {
  const { slug = '' } = useParams();
  const { status, specialties, specialtyBySlug, doctorsForSpecialty } = useCare(true);
  const s = specialtyBySlug(slug);
  usePageMeta({ title: s ? s.name : status === 'ready' ? 'Specialty not found' : 'Loading specialty', description: s ? s.description : 'This specialty could not be found.', image: s?.image.src });
  if (status === 'idle' || status === 'loading') return <section className="container-x py-10"><CardGridSkeleton count={2} tall /></section>;
  if (status === 'error') return <section className="container-x py-10"><CareError /></section>;
  if (!s) return <NotFound />;
  const team = doctorsForSpecialty(s.slug);
  const others = specialties.filter((x) => x.slug !== s.slug).slice(0, 4);

  return (
    <>
      <header className="bg-gradient-to-b from-aqua-50 to-mist">
        <div className="container-x grid items-center gap-8 py-10 lg:grid-cols-[1fr_1fr] lg:py-14">
          <div>
            <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Specialties', to: '/specialties' }, { label: s.name }]} />
            <p className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal shadow-card">
              <SpecialtyIcon name={s.icon} className="h-6 w-6" />
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">{s.name}</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate">{s.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton to={`/appointment?specialty=${s.slug}`} size="lg">
                <CalendarCheck className="h-5 w-5" aria-hidden /> Request an appointment
              </LinkButton>
            </div>
          </div>
          <div className="surface overflow-hidden rounded-[28px]">
            <Img image={s.image} priority sizes="(min-width: 1024px) 46vw, 92vw" className="aspect-[4/3] w-full object-cover" />
          </div>
        </div>
      </header>

      <section className="container-x mt-12 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div className="surface rounded-3xl p-7">
          <h2 className="font-display text-2xl font-semibold text-ink">Common reasons to visit</h2>
          <ul className="mt-4 space-y-3">
            {s.reasons.map((r) => (
              <li key={r} className="flex gap-3">
                <Check className="mt-1 h-5 w-5 shrink-0 text-teal" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-slate">General information only, not medical advice. In an emergency, call your local emergency number.</p>
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">Who you can see</h2>
          {team.length ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:max-w-md">
              {team.map((d) => (
                <DoctorCard key={d.slug} doctor={d} />
              ))}
            </div>
          ) : (
            <p className="surface mt-4 rounded-2xl p-5 text-[15px] text-slate">No profiles are listed for this specialty yet. You can still request an appointment and the team will find someone for you.</p>
          )}
        </div>
      </section>

      <section className="container-x mt-20">
        <SectionHeading title="Other specialties" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((o) => (
            <SpecialtyCard key={o.slug} specialty={o} compact />
          ))}
        </div>
      </section>
    </>
  );
}
