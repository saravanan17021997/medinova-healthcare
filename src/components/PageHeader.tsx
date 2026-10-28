import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ImageAsset } from '@/types';
import { Img } from './Img';

interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate">
        {items.map((c, i) => (
          <li key={c.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
            {c.to ? (
              <Link to={c.to} className="transition-colors hover:text-teal-700 hover:underline">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Banner used at the top of inner pages: text left, a wide image right. */
export function PageHeader({ title, intro, image, crumbs, children }: { title: string; intro: string; image?: ImageAsset; crumbs: Crumb[]; children?: ReactNode }) {
  return (
    <header className="relative -mt-[76px] overflow-hidden pt-[76px] lg:-mt-[80px] lg:pt-[80px]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(760px_420px_at_85%_20%,rgba(99,209,206,0.22),transparent_62%),linear-gradient(180deg,#ffffff_0%,#f2fafa_100%)]" />
      <div aria-hidden className="orb -right-24 top-0 h-80 w-80 bg-teal-500/15" />
      <div className="container-x relative grid items-center gap-8 py-10 lg:grid-cols-[1.05fr_1fr] lg:py-14">
        <div>
          <Breadcrumbs items={crumbs} />
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-[-0.01em] text-ink sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate">{intro}</p>
          {children && <div className="mt-6">{children}</div>}
        </div>
        {image && (
          <div className="glass rounded-[32px] p-2.5 sm:p-3">
            <div className="overflow-hidden rounded-[24px]">
              <Img image={image} priority sizes="(min-width: 1024px) 46vw, 92vw" className="aspect-[16/10] h-full w-full object-cover object-center" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
