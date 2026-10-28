import { Link } from 'react-router-dom';
import { CalendarCheck, MessageCircle, ShoppingBag } from 'lucide-react';
import type { Doctor, Product, Specialty } from '@/types';
import { Img } from './Img';
import { DemoBadge } from './ui';
import { SpecialtyIcon } from './SpecialtyIcon';
import { useCare } from '@/state/care';
import { useCatalog } from '@/state/catalog';
import { isOrderable } from '@/services/catalog';
import { PriceTag, StockBadge } from './store';
import { cx } from '@/lib/format';
import { useCart } from '@/state/cart';
import { whatsappUrl } from '@/services/contact';
import { hello } from '@/config/live';
import { useSite } from '@/state/content';

export function SpecialtyCard({ specialty, compact = false }: { specialty: Specialty; compact?: boolean }) {
  return (
    <Link to={`/specialties/${specialty.slug}`} className="surface group flex flex-col overflow-hidden rounded-3xl lift">
      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-aqua-50 to-white">
        <Img image={specialty.image} decorative sizes="(min-width: 1024px) 20vw, (min-width: 640px) 45vw, 92vw" className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]" />
      </div>
      <div className={cx('flex flex-1 flex-col gap-1.5', compact ? 'p-4' : 'p-5')}>
        <h3 className="flex items-center gap-2.5 font-semibold text-ink transition-colors group-hover:text-teal-700">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/15">
            <SpecialtyIcon name={specialty.icon} className="h-[18px] w-[18px] text-teal" />
          </span>
          {specialty.name}
        </h3>
        <p className="text-sm leading-relaxed text-slate">{specialty.summary}</p>
      </div>
    </Link>
  );
}

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const { specialtyBySlug } = useCare();
  const specialty = specialtyBySlug(doctor.specialtySlug);
  return (
    <article className="surface group flex flex-col items-center rounded-3xl p-4 text-center lift sm:p-5">
      <Link to={`/doctors/${doctor.slug}`} className="flex w-full flex-col items-center rounded-2xl">
        <div className="arch aspect-[4/5] w-full max-w-[220px] overflow-hidden bg-gradient-to-b from-aqua-100 to-aqua-50">
          <Img image={doctor.image} sizes="(min-width: 1024px) 220px, 45vw" className="h-full w-full object-cover object-top" />
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold text-ink transition-colors group-hover:text-teal-700 sm:text-xl">{doctor.name}</h3>
        <p className="text-sm text-slate">{specialty?.name}</p>
      </Link>
      {doctor.isDemo !== false && <DemoBadge className="mt-3 text-center">Fictional demo profile</DemoBadge>}
      <Link
        to={`/appointment?specialty=${doctor.specialtySlug}&doctor=${doctor.slug}`}
        aria-label={`Request an appointment with ${doctor.name}`}
        className="mt-4 inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-teal-500/10 px-3.5 text-sm font-semibold text-teal-700 ring-1 ring-teal-500/20 transition-colors hover:bg-teal hover:text-white sm:px-4"
      >
        <CalendarCheck className="h-4 w-4" aria-hidden /> Request<span className="hidden sm:inline"> appointment</span>
      </Link>
    </article>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const demo = useSite().demo;
  const { add } = useCart();
  const { categoryBySlug } = useCatalog();
  const category = categoryBySlug(product.categorySlug);
  const orderable = isOrderable(product);
  return (
    <article className="surface group flex flex-col overflow-hidden rounded-3xl lift">
      <Link to={`/store/${product.slug}`} className="block aspect-square overflow-hidden bg-gradient-to-br from-aqua-50 to-white">
        <Img image={product.images[0]} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 92vw" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-teal">{category?.name}</p>
          <StockBadge product={product} />
        </div>
        <h3 className="mt-1 font-semibold leading-snug text-ink">
          <Link to={`/store/${product.slug}`} className="transition-colors hover:text-teal-700">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-slate">{product.summary}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <p>
            <PriceTag product={product} note={demo ? 'demo price' : undefined} />
          </p>
          <div className="flex gap-1.5">
            <a href={whatsappUrl(`${hello()}, I have a question about the ${product.name}${demo ? ' (demo product)' : ''}.`)} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-teal-500/10 hover:text-teal-700" aria-label={`Ask about ${product.name} on WhatsApp`}>
              <MessageCircle className="h-5 w-5" aria-hidden />
            </a>
            <button type="button" onClick={() => add(product.slug)} disabled={!orderable} className="flex h-10 w-10 items-center justify-center rounded-full bg-teal text-white shadow-glow transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate/30 disabled:shadow-none" aria-label={orderable ? `Add ${product.name} to cart` : `${product.name} is out of stock`}>
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
