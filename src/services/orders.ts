import { SUPABASE_KEY, SUPABASE_URL, supabaseReady } from '@/lib/supabaseConfig';
import { integrations } from '@/integrations';
import { submitEnquiry } from './enquiry';

// Orders and contact messages from the public website.
// Database mode: each goes through a database function (sd_place_order,
// sd_submit_contact) that checks every field again. The order function also
// reads the price and stock of every product itself, so nothing the browser
// sends about prices is trusted. Visitors can never read orders or messages back.
// Sample mode (no Supabase settings) keeps the earlier demo behaviour.

export const ordersSource: 'database' | 'sample' = supabaseReady ? 'database' : 'sample';

async function rpc<T>(name: string, args: Record<string, unknown>, what: string): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(args),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, message: (body && typeof body.message === 'string' && body.message) || `The ${what} could not be sent (error ${res.status}). Try again, or call or message us.` };
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, message: `The ${what} could not be sent because the connection failed. Check your internet connection, or call or message us.` };
  }
}

export interface OrderInput { name: string; phone: string; email: string; address: string; city: string; pin: string; items: { slug: string; qty: number }[] }
export type OrderResult =
  | { mode: 'saved'; reference: string; subtotal: number; itemCount: number }
  | { mode: 'demo' | 'sent'; reference: string }
  | { mode: 'error'; message: string; stock: boolean };

export async function placeOrder(o: OrderInput): Promise<OrderResult> {
  if (ordersSource === 'sample') {
    const reference = `DEMO-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const r = await submitEnquiry('order', { reference, customer: { ...o, items: undefined }, lines: o.items });
    return r.mode === 'error' ? { ...r, stock: false } : { mode: r.mode, reference };
  }
  const r = await rpc<{ reference: string; subtotal: number | string; item_count: number }>(
    'sd_place_order',
    { p_name: o.name, p_phone: o.phone, p_address: o.address, p_city: o.city, p_pin: o.pin, p_items: o.items, p_email: o.email || null },
    'order',
  );
  if (!r.ok) return { mode: 'error', message: r.message, stock: /only \d+ left|no longer available/i.test(r.message) };
  if (integrations.enquiries.enabled) submitEnquiry('order', { reference: r.data.reference, customer: { name: o.name, phone: o.phone }, lines: o.items }).catch(() => undefined);
  return { mode: 'saved', reference: r.data.reference, subtotal: Number(r.data.subtotal), itemCount: r.data.item_count };
}

export interface MessageInput { name: string; phone: string; email: string; message: string }
export type MessageResult = { mode: 'saved'; reference: string } | { mode: 'demo' | 'sent'; reference?: string } | { mode: 'error'; message: string };

export async function sendMessage(m: MessageInput): Promise<MessageResult> {
  if (ordersSource === 'sample') return submitEnquiry('contact', { ...m });
  const r = await rpc<string>('sd_submit_contact', { p_name: m.name, p_message: m.message, p_phone: m.phone || null, p_email: m.email || null }, 'message');
  if (!r.ok) return { mode: 'error', message: r.message };
  if (integrations.enquiries.enabled) submitEnquiry('contact', { ...m, reference: r.data }).catch(() => undefined);
  return { mode: 'saved', reference: String(r.data) };
}
