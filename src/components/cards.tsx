import { Link } from 'react-router-dom';
import { MessageCircle, ShoppingBag } from 'lucide-react';
import type { Doctor, Product, Specialty } from '@/types';
import { Img } from './Img';
import { DemoBadge } from './ui';
import { SpecialtyIcon } from './SpecialtyIcon';
import { specialtyBySlug } from '@/data/specialties';
import { categoryBySlug } from '@/data/products';
import { formatPrice, cx } from '@/lib/format';
import { useCart } from '@/state/cart';
import { whatsappUrl } from '@/services/contact';

export function SpecialtyCard({ specialty, compact = false }: { specialty: Specialty; compact?: boolean }) {
  return (
    <Link to={`/specialties/${specialty.slug}`} className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line/60 transition-shadow hover:shadow-lift">
      <div className="aspect-[4/3] overflow-hidden bg-mist">
        <Img image={specialty.image} decorative sizes="(min-width: 1024px) 20vw, (min-width: 640px) 45vw, 92vw" className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]" />
      </div>
      <div className={cx('flex flex-1 flex-col gap-1.5', compact ? 'p-4' : 'p-5')}>
        <h3 className="flex items-center gap-2 font-semibold text-ink">
          <SpecialtyIcon name={specialty.icon} className="h-[18px] w-[18px] text-teal" />
          {specialty.name}
        </h3>
        <p className="text-sm leading-relaxed text-slate">{specialty.summary}</p>
      </div>
    </Link>
  );
}

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const specialty = specialtyBySlug(doctor.specialtySlug);
  return (
    <Link to={`/doctors/${doctor.slug}`} className="group flex flex-col items-center rounded-3xl bg-white p-5 text-center shadow-card ring-1 ring-line/60 transition-shadow hover:shadow-lift">
      <div className="arch aspect-[4/5] w-full max-w-[220px] overflow-hidden bg-aqua-50">
        <Img image={doctor.image} sizes="(min-width: 1024px) 220px, 45vw" className="h-full w-full object-cover object-top" />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold text-ink">{doctor.name}</h3>
      <p className="text-sm text-slate">{specialty?.name}</p>
      <DemoBadge className="mt-3">Fictional demo profile</DemoBadge>
    </Link>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const category = categoryBySlug(product.categorySlug);
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line/60">
      <Link to={`/store/${product.slug}`} className="block aspect-square overflow-hidden bg-mist">
        <Img image={product.images[0]} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 92vw" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium text-teal">{category?.name}</p>
        <h3 className="mt-1 font-semibold leading-snug text-ink">
          <Link to={`/store/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-slate">{product.summary}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <p className="text-lg font-semibold text-ink">
            {formatPrice(product.price)}
            <span className="ml-1.5 text-xs font-normal text-slate">demo price</span>
          </p>
          <div className="flex gap-1.5">
            <a href={whatsappUrl(`Hello, I have a question about the ${product.name} (demo product).`)} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-mist" aria-label={`Ask about ${product.name} on WhatsApp`}>
              <MessageCircle className="h-5 w-5" aria-hidden />
            </a>
            <button type="button" onClick={() => add(product.slug)} className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white hover:bg-navy" aria-label={`Add ${product.name} to cart`}>
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
