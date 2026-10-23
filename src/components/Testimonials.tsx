import { site } from '@/config/site';
import { testimonials } from '@/data/testimonials';
import { SectionHeading } from './ui';

/**
 * Off by default (site.features.testimonials). Only switch on with authentic
 * testimonials you have written permission to publish.
 */
export function Testimonials() {
  if (!site.features.testimonials || testimonials.length === 0) return null;
  return (
    <section aria-labelledby="testimonials-heading" className="container-x mt-24">
      <SectionHeading id="testimonials-heading" title="What people say" />
      <ul className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t) => (
          <li key={t.quote} className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line/60">
            <blockquote className="font-display text-lg leading-snug text-ink">“{t.quote}”</blockquote>
            <p className="mt-4 text-sm text-slate">{t.attribution}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
