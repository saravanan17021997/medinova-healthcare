import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ImageOff, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { buttonClass } from '@/components/ui';
import { cx, formatPrice } from '@/lib/format';
import { useAdminMeta } from '../components';
import { ConfirmDialog, LoadError, PageHeader, Toggle, dbError, formatWhen, useToast } from '../ui';
import { removeFiles } from '../storage';

interface Row {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category_id: string;
  price: number;
  discount_price: number | null;
  stock: number;
  low_stock_threshold: number;
  published: boolean;
  featured: boolean;
  updated_at: string;
  sd_product_images: { url: string; small_url: string | null; sort_order: number; storage_path: string | null }[];
}
interface Cat { id: string; name: string }

const PAGE_SIZE = 20;
const SORTS: Record<string, string> = { updated: 'Recently updated', name: 'Name A–Z', 'price-asc': 'Price: low to high', 'price-desc': 'Price: high to low', 'stock-asc': 'Stock: lowest first' };
const field = 'h-11 w-full rounded-xl border border-line bg-white px-3 text-[15px] text-ink';

export function AdminProducts() {
  useAdminMeta('Products');
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [cats, setCats] = useState<Cat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const q = params.get('q') ?? '';
  const cat = params.get('category') ?? '';
  const status = params.get('status') ?? '';
  const stock = params.get('stock') ?? '';
  const sort = SORTS[params.get('sort') ?? ''] ? params.get('sort')! : 'updated';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  const load = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const [p, c] = await Promise.all([
      supabase
        .from('sd_products')
        .select('id,slug,sku,name,category_id,price,discount_price,stock,low_stock_threshold,published,featured,updated_at,sd_product_images(url,small_url,sort_order,storage_path)')
        .order('updated_at', { ascending: false })
        .limit(1000),
      supabase.from('sd_categories').select('id,name').order('sort_order'),
    ]);
    if (p.error || c.error) {
      setError('The products could not be loaded. ' + dbError(p.error ?? c.error));
      return;
    }
    setRows((p.data as Row[]).map((r) => ({ ...r, price: Number(r.price), discount_price: r.discount_price === null ? null : Number(r.discount_price) })));
    setCats(c.data as Cat[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const catName = useMemo(() => new Map(cats.map((c) => [c.id, c.name])), [cats]);

  const list = useMemo(() => {
    if (!rows) return [];
    const t = q.trim().toLowerCase();
    const out = rows.filter(
      (r) =>
        (!t || r.name.toLowerCase().includes(t) || r.sku.toLowerCase().includes(t)) &&
        (!cat || r.category_id === cat) &&
        (!status || (status === 'published' ? r.published : !r.published)) &&
        (!stock || (stock === 'out' ? r.stock === 0 : r.stock <= r.low_stock_threshold)),
    );
    const price = (r: Row) => r.discount_price ?? r.price;
    if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'price-asc') out.sort((a, b) => price(a) - price(b));
    if (sort === 'price-desc') out.sort((a, b) => price(b) - price(a));
    if (sort === 'stock-asc') out.sort((a, b) => a.stock - b.stock);
    return out;
  }, [rows, q, cat, status, stock, sort]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const togglePublished = async (r: Row, value: boolean) => {
    if (!supabase) return;
    setToggling(r.id);
    const { error: e } = await supabase.from('sd_products').update({ published: value }).eq('id', r.id).select('id').single();
    setToggling(null);
    if (e) return toast('error', dbError(e, 'product'));
    setRows((rs) => rs?.map((x) => (x.id === r.id ? { ...x, published: value, updated_at: new Date().toISOString() } : x)) ?? null);
    toast('success', value ? `“${r.name}” is now visible in the store.` : `“${r.name}” is hidden from the store.`);
  };

  const confirmDelete = async () => {
    if (!supabase || !deleting) return;
    setBusy(true);
    const { error: e } = await supabase.from('sd_products').delete().eq('id', deleting.id).select('id').single();
    if (e) {
      setBusy(false);
      return toast('error', dbError(e, 'product'));
    }
    await removeFiles(deleting.sd_product_images.map((i) => i.storage_path));
    setRows((rs) => rs?.filter((x) => x.id !== deleting.id) ?? null);
    toast('success', `“${deleting.name}” was deleted.`);
    setBusy(false);
    setDeleting(null);
  };

  const filtered = Boolean(q || cat || status || stock);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Products"
        description="Everything in the store. Only published products in a published category appear on the website."
        actions={
          <Link to="/admin/products/new" className={buttonClass('primary', 'md')}>
            <Plus className="h-5 w-5" aria-hidden /> Add product
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-line/70 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <label htmlFor="p-q" className="sr-only">
            Search products
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden />
          <input id="p-q" type="search" value={q} onChange={(e) => update({ q: e.target.value })} placeholder="Search name or SKU" className={cx(field, 'pl-9')} />
        </div>
        <div>
          <label htmlFor="p-cat" className="sr-only">
            Category
          </label>
          <select id="p-cat" value={cat} onChange={(e) => update({ category: e.target.value })} className={field}>
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="p-status" className="sr-only">
            Status
          </label>
          <select id="p-status" value={status} onChange={(e) => update({ status: e.target.value })} className={field}>
            <option value="">Any status</option>
            <option value="published">Published</option>
            <option value="draft">Hidden (draft)</option>
          </select>
        </div>
        <div>
          <label htmlFor="p-stock" className="sr-only">
            Stock
          </label>
          <select id="p-stock" value={stock} onChange={(e) => update({ stock: e.target.value })} className={field}>
            <option value="">Any stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
        <div>
          <label htmlFor="p-sort" className="sr-only">
            Sort
          </label>
          <select id="p-sort" value={sort} onChange={(e) => update({ sort: e.target.value === 'updated' ? '' : e.target.value })} className={field}>
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <LoadError message={error} onRetry={load} />
      ) : !rows ? (
        <div role="status" aria-label="Loading products" className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-line/60 motion-reduce:animate-none" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-card ring-1 ring-line/70">
          <p className="font-semibold text-ink">{filtered ? 'No products match these filters' : 'No products yet'}</p>
          <p className="mt-1 text-[15px] text-slate">{filtered ? 'Clear the search or choose different filters.' : 'Add your first product to start the store.'}</p>
          {filtered ? (
            <button type="button" onClick={() => setParams({}, { replace: true })} className={buttonClass('outline', 'md', 'mt-5')}>
              Clear filters
            </button>
          ) : (
            <Link to="/admin/products/new" className={buttonClass('primary', 'md', 'mt-5')}>
              Add product
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate" aria-live="polite">
            Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, list.length)} of {list.length} {list.length === 1 ? 'product' : 'products'}
          </p>
          <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70">
            <ul className="divide-y divide-line">
              {shown.map((r) => {
                const thumb = [...r.sd_product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
                const low = r.stock <= r.low_stock_threshold;
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap sm:px-5" data-testid="product-row">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-mist">
                      {thumb ? <img src={thumb.small_url || thumb.url} alt="" width={56} height={56} loading="lazy" className="h-full w-full object-cover" /> : <ImageOff className="m-auto mt-4 h-6 w-6 text-slate/60" aria-label="No image" />}
                    </div>
                    <div className="min-w-0 flex-1 basis-48">
                      <Link to={`/admin/products/${r.id}`} className="font-semibold text-ink hover:underline">
                        {r.name}
                      </Link>
                      <p className="truncate text-sm text-slate">
                        <span className="font-mono">{r.sku}</span> · {catName.get(r.category_id) ?? 'No category'}
                        {r.featured && ' · Featured'}
                      </p>
                    </div>
                    <div className="w-28 text-right text-[15px]">
                      <p className="font-semibold tabular-nums text-ink">{formatPrice(r.discount_price ?? r.price)}</p>
                      {r.discount_price !== null && <s className="text-xs text-slate">{formatPrice(r.price)}</s>}
                    </div>
                    <div className="w-24 text-right">
                      <span className={cx('inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums', r.stock === 0 ? 'bg-[#B3261E]/10 text-[#B3261E]' : low ? 'bg-signal/25 text-ink' : 'bg-mist text-ink')}>{r.stock} in stock</span>
                    </div>
                    <div className="w-32">
                      <Toggle checked={r.published} disabled={toggling === r.id} onChange={(v) => togglePublished(r, v)} label={r.published ? 'Published' : 'Hidden'} />
                    </div>
                    <p className="hidden w-36 text-right text-xs text-slate xl:block">{formatWhen(r.updated_at)}</p>
                    <div className="ml-auto flex gap-1">
                      <Link to={`/admin/products/${r.id}`} className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-mist" aria-label={`Edit ${r.name}`}>
                        <Pencil className="h-[18px] w-[18px]" aria-hidden />
                      </Link>
                      <button type="button" onClick={() => setDeleting(r)} className="flex h-10 w-10 items-center justify-center rounded-full text-[#B3261E] hover:bg-[#B3261E]/10" aria-label={`Delete ${r.name}`}>
                        <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          {pages > 1 && (
            <nav aria-label="Pages" className="mt-4 flex items-center justify-between">
              <button type="button" disabled={current <= 1} onClick={() => update({ page: String(current - 1) })} className={buttonClass('outline', 'sm')}>
                <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
              </button>
              <span className="text-sm text-slate">
                Page {current} of {pages}
              </span>
              <button type="button" disabled={current >= pages} onClick={() => update({ page: String(current + 1) })} className={buttonClass('outline', 'sm')}>
                Next <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </nav>
          )}
        </>
      )}

      <ConfirmDialog open={Boolean(deleting)} title={`Delete “${deleting?.name}”?`} confirmLabel="Delete product" busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)}>
        <p>This removes the product and its images from the store. Past orders keep their own copy of the name and price. This cannot be undone.</p>
        <p className="mt-2">To hide it for now instead, switch it to Hidden.</p>
      </ConfirmDialog>
    </div>
  );
}
