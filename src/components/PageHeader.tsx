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
              <Link to={c.to} className="hover:text-ink hover:underline">
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
    <header className="bg-gradient-to-b from-aqua-50 to-mist">
      <div className="container-x grid items-center gap-8 py-10 lg:grid-cols-[1.05fr_1fr] lg:py-14">
        <div>
          <Breadcrumbs items={crumbs} />
          <h1 className="font-display text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate">{intro}</p>
          {children && <div className="mt-6">{children}</div>}
        </div>
        {image && (
          <div className="overflow-hidden rounded-[28px] bg-white shadow-card ring-1 ring-line/60">
            <Img image={image} priority sizes="(min-width: 1024px) 46vw, 92vw" className="aspect-[16/10] h-full w-full object-cover object-center" />
          </div>
        )}
      </div>
    </header>
  );
}
