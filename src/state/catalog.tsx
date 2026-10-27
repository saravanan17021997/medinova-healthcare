import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Category, Product } from '@/types';
import { catalogSource, fetchCatalog, priceOf, sampleCatalog, type CatalogSource } from '@/services/catalog';

export type CatalogStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CatalogValue {
  status: CatalogStatus;
  source: CatalogSource;
  error: string | null;
  categories: Category[];
  products: Product[];
  productBySlug: (slug: string) => Product | undefined;
  categoryBySlug: (slug: string) => Category | undefined;
  /** Upper bound for the store's price filter, rounded up to the next ₹500. */
  priceMax: number;
  reload: () => void;
  /** Starts loading if nothing has been loaded yet (pages that show products call this). */
  request: () => void;
}

const Ctx = createContext<CatalogValue | null>(null);

/**
 * Loads the catalogue once per visit, and only when a page that shows products
 * asks for it (store, product, cart, checkout, home). Database mode always
 * fetches fresh data on page load, so admin changes appear after a refresh.
 */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: CatalogStatus; error: string | null; categories: Category[]; products: Product[] }>(() =>
    catalogSource === 'sample'
      ? { status: 'ready', error: null, categories: sampleCatalog.categories, products: sampleCatalog.products }
      : { status: 'idle', error: null, categories: [], products: [] },
  );
  const run = useRef(0);

  const load = useCallback(() => {
    if (catalogSource === 'sample') return;
    const id = ++run.current;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    setState((s) => ({ ...s, status: 'loading', error: null }));
    fetchCatalog(ctrl.signal)
      .then((c) => id === run.current && setState({ status: 'ready', error: null, categories: c.categories, products: c.products }))
      .catch((e: Error) => {
        if (id !== run.current) return;
        const msg = e.name === 'AbortError' ? 'The store took too long to load.' : e.message.startsWith('The store') ? e.message : 'The store could not be loaded. Check your connection.';
        setState({ status: 'error', error: msg, categories: [], products: [] });
      })
      .finally(() => clearTimeout(timer));
  }, []);

  const started = useRef(false);
  const request = useCallback(() => {
    if (started.current || catalogSource === 'sample') return;
    started.current = true;
    load();
  }, [load]);

  const value = useMemo<CatalogValue>(() => {
    const bySlug = new Map(state.products.map((p) => [p.slug, p]));
    const catBySlug = new Map(state.categories.map((c) => [c.slug, c]));
    const top = state.products.reduce((m, p) => Math.max(m, priceOf(p)), 0);
    return {
      ...state,
      source: catalogSource,
      productBySlug: (s) => bySlug.get(s),
      categoryBySlug: (s) => catBySlug.get(s),
      priceMax: Math.max(500, Math.ceil(top / 500) * 500),
      reload: load,
      request,
    };
  }, [state, load, request]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Pass true on pages that display products, so the catalogue gets loaded. */
export function useCatalog(needed = false) {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCatalog must be used inside CatalogProvider');
  const { request } = v;
  useEffect(() => {
    if (needed) request();
  }, [needed, request]);
  return v;
}
