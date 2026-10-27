import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Check, MessageCircle, Search, ShoppingBag } from 'lucide-react';
import { ILLUSTRATION } from '@/data/img';
import { useCatalog } from '@/state/catalog';
import { isOrderable, maxQtyFor, priceOf } from '@/services/catalog';
import { CatalogError, PriceTag, ProductGridSkeleton, StockBadge } from '@/components/store';
import { Img } from '@/components/Img';
import { ProductCard } from '@/components/cards';
import { Breadcrumbs } from '@/components/PageHeader';
import { EmptyState, LinkButton, Notice, QuantityStepper, buttonClass } from '@/components/ui';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useCart } from '@/state/cart';
import { whatsappUrl } from '@/services/contact';
import { hello } from '@/config/live';
import { ordersSource } from '@/services/orders';
import { useSite } from '@/state/content';
import { cx } from '@/lib/format';
import { NotFound } from './NotFound';

const SORTS = {
  featured: 'Featured',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  name: 'Name: A to Z',
};
type SortKey = keyof typeof SORTS;

export function Store() {
  usePageMeta({ title: 'Health essentials', description: 'A sample catalogue of home-care essentials with illustrative prices. Orders on this demonstration site are simulated.' });
  const site = useSite();
  const { status, categories, products, categoryBySlug, priceMax } = useCatalog(true);
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const category = categoryBySlug(params.get('category') ?? '')?.slug ?? '';
  const min = Number(params.get('min') ?? '') || 0;
  const max = Number(params.get('max') ?? '') || priceMax;
  const sort = (params.get('sort') as SortKey) in SORTS ? (params.get('sort') as SortKey) : 'featured';

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const filtered = products.filter(
      (p) =>
        (!category || p.categorySlug === category) &&
        priceOf(p) >= min &&
        priceOf(p) <= max &&
        (!t || [p.name, p.summary, p.description].join(' ').toLowerCase().includes(t)),
    );
    const sorted = [...filtered];
    if (sort === 'price-asc') sorted.sort((a, b) => priceOf(a) - priceOf(b));
    if (sort === 'price-desc') sorted.sort((a, b) => priceOf(b) - priceOf(a));
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'featured') sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    return sorted;
  }, [products, q, category, min, max, sort]);
  const heroProducts = products.filter((p) => p.images[0]?.src.endsWith('.webp')).slice(0, 3);

  const field = 'h-11 w-full rounded-xl border border-line bg-white px-3 text-base';

  return (
    <>
      <header className="bg-gradient-to-b from-aqua-50 to-mist">
        <div className="container-x grid items-center gap-8 py-10 lg:grid-cols-[1.2fr_1fr] lg:py-12">
          <div>
            <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Store' }]} />
            <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">Health essentials</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate">Everyday monitoring, first-aid and comfort products for home. Search, filter and add items to your cart.</p>
            <div className="relative mt-6 max-w-md">
              <label htmlFor="store-q" className="sr-only">
                Search products
              </label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate" aria-hidden />
              <input id="store-q" type="search" value={q} onChange={(e) => update({ q: e.target.value })} placeholder="Search products" className="h-12 w-full rounded-full border border-line bg-white pl-12 pr-4 text-base" />
            </div>
          </div>
          <div className="hidden grid-cols-3 gap-3 lg:grid" aria-hidden>
            {heroProducts.map((hp, i) => (
              <div key={hp.slug} className={cx('overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line/60', i === 1 && 'translate-y-6')}>
                <Img image={hp.images[0]} decorative priority sizes="14vw" className="aspect-square w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="container-x mt-10">
        <Notice className="mb-6">
          {ordersSource === 'sample'
            ? 'Sample catalogue for demonstration. Prices are illustrative and checkout is simulated: no payment is taken and nothing is delivered.'
            : site.demo
              ? 'Demonstration store: products and prices are examples. No payment is taken online; the team calls to confirm any order you send.'
              : 'No payment is taken online. After you send an order, the team calls you to confirm it and arrange payment and delivery.'}
        </Notice>

        <nav aria-label="Product categories">
          <ul className="flex gap-2 overflow-x-auto pb-2">
            <li className="shrink-0">
              <button type="button" onClick={() => update({ category: '' })} aria-pressed={!category} className={cx('h-11 rounded-full px-4 text-sm font-medium ring-1', !category ? 'bg-ink text-white ring-ink' : 'bg-white text-ink ring-line/70 hover:ring-teal')}>
                All products
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.slug} className="shrink-0">
                <button type="button" onClick={() => update({ category: c.slug })} aria-pressed={category === c.slug} className={cx('flex h-11 items-center gap-2 rounded-full py-1 pl-1.5 pr-4 text-sm font-medium ring-1', category === c.slug ? 'bg-ink text-white ring-ink' : 'bg-white text-ink ring-line/70 hover:ring-teal')}>
                  {c.icon ? <img src={c.icon} alt="" width={64} height={64} className="h-8 w-8 rounded-[10px]" /> : <span className="w-2" />}
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-line/60 sm:grid-cols-3 lg:max-w-3xl">
          <div>
            <label htmlFor="price-min" className="text-sm font-semibold text-ink">
              Min price (₹)
            </label>
            <input id="price-min" type="number" inputMode="numeric" min={0} step={100} value={min || ''} placeholder="0" onChange={(e) => update({ min: e.target.value })} className={cx(field, 'mt-1')} />
          </div>
          <div>
            <label htmlFor="price-max" className="text-sm font-semibold text-ink">
              Max price (₹)
            </label>
            <input id="price-max" type="number" inputMode="numeric" min={0} step={100} value={max === priceMax ? '' : max} placeholder={String(priceMax)} onChange={(e) => update({ max: e.target.value })} className={cx(field, 'mt-1')} />
          </div>
          <div>
            <label htmlFor="sort" className="text-sm font-semibold text-ink">
              Sort by
            </label>
            <select id="sort" value={sort} onChange={(e) => update({ sort: e.target.value === 'featured' ? '' : e.target.value })} className={cx(field, 'mt-1')}>
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {status === 'loading' || status === 'idle' ? (
          <ProductGridSkeleton />
        ) : status === 'error' ? (
          <CatalogError className="mt-6" />
        ) : (
        <>
        <p className="mt-6 text-sm text-slate" aria-live="polite">
          {list.length} {list.length === 1 ? 'product' : 'products'}
          {category && ` in ${categoryBySlug(category)?.name}`}
        </p>

        {list.length ? (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        ) : q.trim() ? (
          <EmptyState image={ILLUSTRATION.emptySearch} title="No products match your search" body={`Nothing matches “${q}”. Check the spelling or try a more general word.`} action={<button type="button" className="font-semibold text-teal-700 underline" onClick={() => setParams({}, { replace: true })}>Clear search and filters</button>} />
        ) : (
          <EmptyState image={ILLUSTRATION.emptyCatalogue} title="Nothing in this range" body="No products match this category and price range. Widen the price range or choose another category." action={<button type="button" className="font-semibold text-teal-700 underline" onClick={() => setParams({}, { replace: true })}>Show all products</button>} />
        )}
        </>
        )}
      </section>
    </>
  );
}

export function ProductDetail() {
  const { slug = '' } = useParams();
  const { status, products, productBySlug, categoryBySlug } = useCatalog(true);
  const p = productBySlug(slug);
  usePageMeta({ title: p ? p.name : status === 'loading' ? 'Loading product' : 'Product not found', description: p ? `${p.summary} Demo product with an illustrative price.` : 'This product could not be found.', image: p?.images[0].src });
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { add, items } = useCart();
  if (status === 'loading' || status === 'idle') return <section className="container-x py-10"><ProductGridSkeleton count={2} /></section>;
  if (status === 'error') return <section className="container-x py-10"><CatalogError /></section>;
  if (!p) return <NotFound />;
  const category = categoryBySlug(p.categorySlug);
  const related = products.filter((x) => x.categorySlug === p.categorySlug && x.slug !== p.slug).slice(0, 4);
  const orderable = isOrderable(p);
  const inCart = items.find((i) => i.slug === p.slug)?.qty ?? 0;
  const canAdd = Math.max(0, maxQtyFor(p) - inCart);
  const shown = p.images[active] ?? p.images[0];

  return (
    <>
      <section className="container-x py-10">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Store', to: '/store' }, { label: category?.name ?? '', to: `/store?category=${category?.slug}` }, { label: p.name }]} />
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="overflow-hidden rounded-[28px] bg-white shadow-card ring-1 ring-line/60">
              <Img key={shown.src} image={shown} priority sizes="(min-width: 1024px) 46vw, 92vw" className="aspect-square w-full object-cover" />
            </div>
            {p.images.length > 1 && <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4" aria-label="Product images">
              {p.images.map((im, i) => (
                <li key={im.src + i}>
                  <button type="button" onClick={() => setActive(i)} aria-pressed={active === i} aria-label={`Show image ${i + 1} of ${p.images.length}`} className={cx('block w-full overflow-hidden rounded-2xl bg-white ring-2', active === i ? 'ring-teal' : 'ring-transparent hover:ring-line')}>
                    <Img image={im} decorative sizes="(min-width: 1024px) 14vw, 30vw" className="aspect-square w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>}
          </div>
          <div>
            <p className="flex items-center gap-3 text-sm font-medium text-teal-700">
              {category?.name}
              <StockBadge product={p} />
            </p>
            <h1 className="mt-1 font-display text-4xl font-semibold leading-tight text-ink">{p.name}</h1>
            <p className="mt-4">
              <PriceTag product={p} size="lg" note="illustrative demo price" />
            </p>
            <p className="mt-5 leading-relaxed text-slate">{p.description}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {orderable && <QuantityStepper value={Math.min(qty, Math.max(1, canAdd))} onChange={(n) => setQty(Math.max(1, Math.min(Math.max(1, canAdd), n)))} max={Math.max(1, canAdd)} label="Quantity" />}
              <button
                type="button"
                className={buttonClass('dark', 'lg')}
                disabled={!orderable || canAdd < 1}
                onClick={() => {
                  add(p.slug, Math.min(qty, canAdd));
                  setQty(1);
                  setAdded(true);
                }}
              >
                <ShoppingBag className="h-5 w-5" aria-hidden /> {!orderable ? 'Out of stock' : canAdd < 1 ? 'All available stock is in your cart' : 'Add to cart'}
              </button>
              <a href={whatsappUrl(`${hello()}, I have a question about the ${p.name} (demo product, quantity ${qty}).`)} target="_blank" rel="noreferrer" className={buttonClass('outline', 'lg')}>
                <MessageCircle className="h-5 w-5" aria-hidden /> Ask on WhatsApp
              </a>
            </div>
            <p role="status" className="mt-3 min-h-6 text-sm font-medium text-teal-700">
              {added && (
                <>
                  Added to your cart.{' '}
                  <Link to="/cart" className="underline">
                    View cart
                  </Link>
                </>
              )}
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="font-semibold text-ink">Features</h2>
                <ul className="mt-2 space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 text-[15px] text-slate">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-teal" aria-hidden /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="font-semibold text-ink">In the box</h2>
                <ul className="mt-2 space-y-1.5">
                  {p.inTheBox.map((f) => (
                    <li key={f} className="flex gap-2 text-[15px] text-slate">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-teal" aria-hidden /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Notice className="mt-8">Demo product: not real stock and not available to order. Follow the manufacturer’s instructions for any real device, and speak to a doctor about health readings.</Notice>
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="container-x mt-10">
          <h2 className="mb-6 font-display text-3xl font-semibold text-ink">More in {category?.name}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.slug} product={r} />
            ))}
          </div>
          <div className="mt-8">
            <LinkButton to="/store" variant="outline">
              Back to the store
            </LinkButton>
          </div>
        </section>
      )}
    </>
  );
}
