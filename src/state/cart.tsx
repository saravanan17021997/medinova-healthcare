import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { Product } from '@/types';
import { MAX_QTY, maxQtyFor, priceOf } from '@/services/catalog';
import { useCatalog } from './catalog';

export { MAX_QTY };

export interface CartItem {
  slug: string;
  qty: number;
}
export interface CartLine {
  product: Product;
  qty: number;
  /** Price per unit actually charged (sale price when there is one). */
  unitPrice: number;
  lineTotal: number;
  /** Most that can be ordered right now (stock, capped at 10). */
  maxQty: number;
  /** Set when this line cannot be checked out as it is. */
  issue?: 'out-of-stock' | 'too-many';
}

const STORAGE_KEY = 'medinova-demo-cart';

type Action =
  | { type: 'add'; slug: string; qty: number; max: number }
  | { type: 'set'; slug: string; qty: number; max: number }
  | { type: 'remove'; slug: string }
  | { type: 'clear' };

const clamp = (n: number, max = MAX_QTY) => Math.max(1, Math.min(max, Math.round(n) || 1));

function reducer(state: CartItem[], a: Action): CartItem[] {
  switch (a.type) {
    case 'add': {
      if (a.max < 1) return state;
      const found = state.find((i) => i.slug === a.slug);
      if (found) return state.map((i) => (i.slug === a.slug ? { ...i, qty: clamp(i.qty + a.qty, a.max) } : i));
      return [...state, { slug: a.slug, qty: clamp(a.qty, a.max) }];
    }
    case 'set':
      return state.map((i) => (i.slug === a.slug ? { ...i, qty: clamp(a.qty, Math.max(1, a.max)) } : i));
    case 'remove':
      return state.filter((i) => i.slug !== a.slug);
    case 'clear':
      return [];
  }
}

// Saved items are kept as they are: whether a product still exists, and its
// price and stock, are checked against the live catalogue once it has loaded.
function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return parsed.filter((i) => i && typeof i.slug === 'string').map((i) => ({ slug: i.slug, qty: clamp(i.qty) }));
  } catch {
    return [];
  }
}

interface CartValue {
  /** False while the catalogue is still loading: lines are not known yet. */
  ready: boolean;
  items: CartItem[];
  lines: CartLine[];
  /** Saved items whose product is no longer sold (deleted or unpublished). */
  missing: CartItem[];
  /** True when something must be fixed before checking out. */
  hasProblems: boolean;
  count: number;
  subtotal: number;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { status, productBySlug } = useCatalog();
  const [items, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable (private mode): the cart still works for this visit */
    }
  }, [items]);

  const maxFor = useCallback((slug: string) => {
    const p = productBySlug(slug);
    return p ? maxQtyFor(p) : 0;
  }, [productBySlug]);
  const add = useCallback((slug: string, qty = 1) => dispatch({ type: 'add', slug, qty, max: maxFor(slug) }), [maxFor]);
  const setQty = useCallback((slug: string, qty: number) => dispatch({ type: 'set', slug, qty, max: maxFor(slug) }), [maxFor]);
  const remove = useCallback((slug: string) => dispatch({ type: 'remove', slug }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo<CartValue>(() => {
    const ready = status === 'ready';
    const lines: CartLine[] = [];
    const missing: CartItem[] = [];
    if (ready) {
      for (const i of items) {
        const product = productBySlug(i.slug);
        if (!product) {
          missing.push(i);
          continue;
        }
        const unitPrice = priceOf(product);
        const maxQty = maxQtyFor(product);
        const issue = maxQty === 0 ? 'out-of-stock' : i.qty > maxQty ? 'too-many' : undefined;
        lines.push({ product, qty: i.qty, unitPrice, lineTotal: unitPrice * i.qty, maxQty, issue });
      }
    }
    return {
      ready,
      items,
      lines,
      missing,
      hasProblems: missing.length > 0 || lines.some((l) => l.issue),
      // while loading, the badge still shows what is saved
      count: ready ? lines.reduce((a, l) => a + l.qty, 0) : items.reduce((a, i) => a + i.qty, 0),
      subtotal: lines.filter((l) => !l.issue).reduce((a, l) => a + l.lineTotal, 0),
      add,
      setQty,
      remove,
      clear,
    };
  }, [status, items, productBySlug, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
