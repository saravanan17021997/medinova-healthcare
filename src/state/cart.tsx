import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { productBySlug } from '@/data/products';
import type { Product } from '@/types';

export interface CartItem {
  slug: string;
  qty: number;
}
export interface CartLine {
  product: Product;
  qty: number;
  lineTotal: number;
}

export const MAX_QTY = 10;
const STORAGE_KEY = 'medinova-demo-cart';

type Action =
  | { type: 'add'; slug: string; qty: number }
  | { type: 'set'; slug: string; qty: number }
  | { type: 'remove'; slug: string }
  | { type: 'clear' };

const clamp = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.round(n) || 1));

function reducer(state: CartItem[], a: Action): CartItem[] {
  switch (a.type) {
    case 'add': {
      const found = state.find((i) => i.slug === a.slug);
      if (found) return state.map((i) => (i.slug === a.slug ? { ...i, qty: clamp(i.qty + a.qty) } : i));
      return [...state, { slug: a.slug, qty: clamp(a.qty) }];
    }
    case 'set':
      return state.map((i) => (i.slug === a.slug ? { ...i, qty: clamp(a.qty) } : i));
    case 'remove':
      return state.filter((i) => i.slug !== a.slug);
    case 'clear':
      return [];
  }
}

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return parsed.filter((i) => productBySlug(i.slug)).map((i) => ({ slug: i.slug, qty: clamp(i.qty) }));
  } catch {
    return [];
  }
}

interface CartValue {
  items: CartItem[];
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable (private mode): the cart still works for this visit */
    }
  }, [items]);

  const add = useCallback((slug: string, qty = 1) => dispatch({ type: 'add', slug, qty }), []);
  const setQty = useCallback((slug: string, qty: number) => dispatch({ type: 'set', slug, qty }), []);
  const remove = useCallback((slug: string) => dispatch({ type: 'remove', slug }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo<CartValue>(() => {
    const lines = items
      .map((i) => {
        const product = productBySlug(i.slug);
        return product ? { product, qty: i.qty, lineTotal: product.price * i.qty } : null;
      })
      .filter((l): l is CartLine => l !== null);
    return {
      items,
      lines,
      count: lines.reduce((a, l) => a + l.qty, 0),
      subtotal: lines.reduce((a, l) => a + l.lineTotal, 0),
      add,
      setQty,
      remove,
      clear,
    };
  }, [items, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
