import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { Product } from '@/types';
import { priceOf, stockLabel } from '@/services/catalog';
import { useCatalog } from '@/state/catalog';
import { cx, formatPrice } from '@/lib/format';
import { buttonClass } from './ui';

/** Price with the sale price and the original struck through, when on sale. */
export function PriceTag({ product, size = 'md', note }: { product: Product; size?: 'md' | 'lg'; note?: string }) {
  const now = priceOf(product);
  const sale = now < product.price;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={cx('font-semibold text-ink', size === 'lg' ? 'text-3xl' : 'text-lg')}>{formatPrice(now)}</span>
      {sale && (
        <>
          <s className={cx('text-slate', size === 'lg' ? 'text-lg' : 'text-sm')}>
            <span className="sr-only">Was </span>
            {formatPrice(product.price)}
          </s>
          <span className="rounded-full bg-teal/10 px-2 py-0.5 text-xs font-semibold text-teal-700">Save {Math.round((1 - now / product.price) * 100)}%</span>
        </>
      )}
      {note && <span className={cx('font-normal text-slate', size === 'lg' ? 'text-sm' : 'text-xs')}>{note}</span>}
    </span>
  );
}

export function StockBadge({ product, className }: { product: Product; className?: string }) {
  const s = stockLabel(product);
  if (!s) return null;
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', s.tone === 'out' ? 'bg-[#B3261E]/10 text-[#B3261E]' : 'bg-signal/25 text-ink', className)}>
      {s.text}
    </span>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading products" className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface overflow-hidden rounded-3xl">
          <div className="aspect-square animate-pulse bg-mist motion-reduce:animate-none" />
          <div className="space-y-2 p-5">
            <div className="h-3 w-1/3 animate-pulse rounded bg-mist motion-reduce:animate-none" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-mist motion-reduce:animate-none" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-mist motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Shown when the database could not be reached. Never falls back to stale prices. */
export function CatalogError({ className }: { className?: string }) {
  const { error, reload } = useCatalog();
  return (
    <div role="alert" className={cx('flex flex-col items-start gap-4 rounded-3xl bg-white p-6 ring-1 ring-coral/40 sm:flex-row sm:items-center', className)}>
      <AlertTriangle className="h-6 w-6 shrink-0 text-coral" aria-hidden />
      <div className="flex-1">
        <p className="font-semibold text-ink">The store is not available right now</p>
        <p className="mt-0.5 text-[15px] text-slate">{error} Try again in a moment.</p>
      </div>
      <button type="button" onClick={reload} className={buttonClass('primary', 'md')}>
        <RefreshCw className="h-4 w-4" aria-hidden /> Try again
      </button>
    </div>
  );
}
