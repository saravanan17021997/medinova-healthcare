import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useCare } from '@/state/care';
import { cx } from '@/lib/format';
import { buttonClass } from './ui';

export function CardGridSkeleton({ count = 4, className, tall = false }: { count?: number; className?: string; tall?: boolean }) {
  return (
    <div role="status" aria-label="Loading" className={cx('grid gap-5 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cx('animate-pulse rounded-3xl bg-white ring-1 ring-line/60 motion-reduce:animate-none', tall ? 'h-80' : 'h-60')} />
      ))}
    </div>
  );
}

/** Shown when specialties / doctors could not be loaded. */
export function CareError({ className }: { className?: string }) {
  const { error, reload } = useCare();
  return (
    <div role="alert" className={cx('flex flex-col items-start gap-4 rounded-3xl bg-white p-6 ring-1 ring-coral/40 sm:flex-row sm:items-center', className)}>
      <AlertTriangle className="h-6 w-6 shrink-0 text-coral" aria-hidden />
      <div className="flex-1">
        <p className="font-semibold text-ink">This is not available right now</p>
        <p className="mt-0.5 text-[15px] text-slate">{error} Try again in a moment.</p>
      </div>
      <button type="button" onClick={reload} className={buttonClass('primary', 'md')}>
        <RefreshCw className="h-4 w-4" aria-hidden /> Try again
      </button>
    </div>
  );
}
