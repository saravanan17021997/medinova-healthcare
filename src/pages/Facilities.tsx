import { HERO, ILLUSTRATION } from '@/data/img';
import { Img } from '@/components/Img';
import { PageHeader } from '@/components/PageHeader';
import { CardGridSkeleton } from '@/components/care';
import { EmptyState, Notice, buttonClass } from '@/components/ui';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useFacilities, useSite } from '@/state/content';

export function Facilities() {
  usePageMeta({ title: 'Facilities', description: 'A look inside a SaraDev demonstration clinic: reception, consultation rooms, laboratory, imaging and more.' });
  const site = useSite();
  const { facilities, status, error, reload } = useFacilities();
  return (
    <>
      <PageHeader title="Our facilities" intro="A walk through the spaces you might visit, from the front desk to the laboratory." image={HERO.reception} crumbs={[{ label: 'Home', to: '/' }, { label: 'Facilities' }]} />
      <section className="container-x mt-12">
        {site.demo && <Notice className="mb-8">Illustrations for demonstration. A live site should show only verified facilities, ideally with real photographs.</Notice>}
        {status === 'error' ? (
          <div role="alert" className="surface rounded-3xl p-8 text-center">
            <img src={ILLUSTRATION.error} alt="" width={480} height={360} className="mx-auto h-auto w-48" />
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink">Facilities could not be loaded</h2>
            <p className="mx-auto mt-2 max-w-md text-slate">{error} Check your connection and try again.</p>
            <button type="button" onClick={reload} className={buttonClass('primary', 'md', 'mt-6')}>
              Try again
            </button>
          </div>
        ) : status !== 'ready' ? (
          <CardGridSkeleton count={6} />
        ) : facilities.length === 0 ? (
          <EmptyState image={ILLUSTRATION.emptyCatalogue} title="Facilities are being updated" body="Check back soon, or contact us with any questions about your visit." />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((f) => (
              <li key={f.slug} className="surface overflow-hidden rounded-3xl" data-testid="facility-card">
                <Img image={f.image} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw" className="aspect-[3/2] w-full object-cover" />
                <div className="p-5">
                  <h2 className="font-semibold text-ink">{f.name}</h2>
                  {f.description && <p className="mt-1 text-[15px] leading-relaxed text-slate">{f.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
