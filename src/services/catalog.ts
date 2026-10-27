import type { Category, ImageAsset, Product } from '@/types';
import { SUPABASE_KEY, SUPABASE_URL, supabaseReady } from '@/lib/supabaseConfig';
import { categories as sampleCategories, products as sampleProducts } from '@/data/products';

// The public store reads the catalogue straight from Supabase's REST API with
// the publishable key. Row Level Security only returns PUBLISHED categories,
// products and images, so drafts can never reach the website. A plain fetch is
// used (instead of supabase-js) to keep the public download small.
//
// Without Supabase settings (e.g. a local copy with no .env) the built-in
// sample catalogue in src/data/products.ts is shown instead.

export type CatalogSource = 'database' | 'sample';
export interface Catalog {
  categories: Category[];
  products: Product[];
  source: CatalogSource;
}

export const MAX_QTY = 10;
export const catalogSource: CatalogSource = supabaseReady ? 'database' : 'sample';
export const sampleCatalog: Catalog = { categories: sampleCategories, products: sampleProducts, source: 'sample' };

const PLACEHOLDER = '/images/illustrations/illustration-empty-catalogue.svg';

interface CategoryRow { id: string; slug: string; name: string; description: string | null; icon_url: string | null }
interface ImageRow { url: string; small_url: string | null; alt: string | null; width: number | null; height: number | null; sort_order: number | null }
interface ProductRow {
  id: string; slug: string; sku: string; name: string; category_id: string;
  price: number | string; discount_price: number | string | null; stock: number; low_stock_threshold: number;
  summary: string | null; description: string | null; features: string[] | null; in_the_box: string[] | null;
  featured: boolean; images: ImageRow[] | null;
}

async function rest<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_KEY, Accept: 'application/json' }, signal });
  if (!res.ok) throw new Error(`The store could not be loaded (error ${res.status}).`);
  return res.json() as Promise<T>;
}

function toImage(row: ImageRow, productName: string): ImageAsset {
  const width = row.width && row.width > 0 ? row.width : 1000;
  const height = row.height && row.height > 0 ? row.height : 1000;
  return {
    src: row.url,
    alt: row.alt?.trim() || productName,
    width,
    height,
    ...(row.small_url ? { smallSrc: row.small_url, smallWidth: Math.round(width / 2) } : {}),
  };
}

export async function fetchCatalog(signal?: AbortSignal): Promise<Catalog> {
  const [catRows, prodRows] = await Promise.all([
    rest<CategoryRow[]>('sd_categories?select=id,slug,name,description,icon_url&published=eq.true&order=sort_order.asc,name.asc', signal),
    rest<ProductRow[]>(
      'sd_products?select=id,slug,sku,name,category_id,price,discount_price,stock,low_stock_threshold,summary,description,features,in_the_box,featured,' +
        'images:sd_product_images(url,small_url,alt,width,height,sort_order)&published=eq.true&order=sort_order.asc,name.asc',
      signal,
    ),
  ]);
  const slugById = new Map(catRows.map((c) => [c.id, c.slug]));
  const categories: Category[] = catRows.map((c) => ({ slug: c.slug, name: c.name, description: c.description ?? '', icon: c.icon_url ?? '' }));
  const products: Product[] = prodRows
    // a product whose category is hidden is hidden too
    .filter((p) => slugById.has(p.category_id))
    .map((p) => {
      const images = [...(p.images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((im) => toImage(im, p.name));
      const discount = p.discount_price === null || p.discount_price === undefined ? null : Number(p.discount_price);
      return {
        id: p.id,
        sku: p.sku,
        slug: p.slug,
        name: p.name,
        categorySlug: slugById.get(p.category_id)!,
        price: Number(p.price),
        discountPrice: discount !== null && discount < Number(p.price) ? discount : null,
        stock: p.stock,
        lowStockThreshold: p.low_stock_threshold,
        summary: p.summary ?? '',
        description: p.description ?? '',
        features: p.features ?? [],
        inTheBox: p.in_the_box ?? [],
        featured: p.featured,
        images: images.length ? images : [{ src: PLACEHOLDER, alt: `${p.name} (photo coming soon)`, width: 480, height: 360 }],
      };
    });
  return { categories, products, source: 'database' };
}

/** The price a customer pays: the sale price when there is one. */
export const priceOf = (p: Product) => (p.discountPrice != null && p.discountPrice < p.price ? p.discountPrice : p.price);
/** Stock is tracked for database products only. */
export const isOrderable = (p: Product) => p.stock === undefined || p.stock > 0;
export const maxQtyFor = (p: Product) => Math.max(0, Math.min(MAX_QTY, p.stock ?? MAX_QTY));
export function stockLabel(p: Product): { text: string; tone: 'out' | 'low' } | null {
  if (p.stock === undefined) return null;
  if (p.stock <= 0) return { text: 'Out of stock', tone: 'out' };
  if (p.stock <= (p.lowStockThreshold ?? 0)) return { text: `Only ${p.stock} left`, tone: 'low' };
  return null;
}
