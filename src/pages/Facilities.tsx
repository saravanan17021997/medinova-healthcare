import { HERO } from '@/data/img';
import { facilities } from '@/data/facilities';
import { Img } from '@/components/Img';
import { PageHeader } from '@/components/PageHeader';
import { Notice } from '@/components/ui';
import { usePageMeta } from '@/hooks/usePageMeta';

export function Facilities() {
  usePageMeta({ title: 'Facilities', description: 'A look inside a SaraDev demonstration clinic: reception, consultation rooms, laboratory, imaging and more.' });
  return (
    <>
      <PageHeader title="Our facilities" intro="A walk through the spaces you might visit, from the front desk to the laboratory." image={HERO.reception} crumbs={[{ label: 'Home', to: '/' }, { label: 'Facilities' }]} />
      <section className="container-x mt-12">
        <Notice className="mb-8">Illustrations for demonstration. A live site should show only verified facilities, ideally with real photographs.</Notice>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((f) => (
            <li key={f.slug} className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line/60">
              <Img image={f.image} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw" className="aspect-[3/2] w-full object-cover" />
              <div className="p-5">
                <h2 className="font-semibold text-ink">{f.name}</h2>
                <p className="mt-1 text-[15px] leading-relaxed text-slate">{f.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
