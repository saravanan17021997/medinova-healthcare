import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, Lock, Mail, MessageCircle, Phone, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SelectField, TextArea, buttonClass } from '@/components/ui';
import { cx, formatPrice } from '@/lib/format';
import { liveSite } from '@/config/live';
import { useAdminMeta } from '../components';
import { useAdminAuth } from '../auth';
import { ConfirmDialog, LoadError, PageHeader, dbError, formatWhen, useToast } from '../ui';

type Status = 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
type Payment = 'unpaid' | 'paid' | 'refunded';
interface Item { product_name: string; sku: string | null; unit_price: number | string; qty: number; line_total: number | string }
interface Row {
  id: string; reference: string; customer_name: string; phone: string; email: string | null; address: string; city: string; pin: string;
  status: Status; payment_status: Payment; subtotal: number | string; item_count: number; admin_notes: string | null; created_at: string; updated_at: string;
  sd_order_items: Item[];
}

export const ORDER_STATUS: Record<Status, string> = { pending: 'New', confirmed: 'Confirmed', packed: 'Packed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };
const PAYMENT: Record<Payment, string> = { unpaid: 'Not paid', paid: 'Paid', refunded: 'Refunded' };
const TONE: Record<Status, string> = {
  pending: 'bg-signal/30 text-ink', confirmed: 'bg-aqua-100 text-ink', packed: 'bg-aqua-100 text-ink', shipped: 'bg-teal/15 text-teal-700',
  delivered: 'bg-teal text-white', cancelled: 'bg-[#B3261E]/10 text-[#B3261E]',
};
const PAGE = 20;
const SELECT = 'id,reference,customer_name,phone,email,address,city,pin,status,payment_status,subtotal,item_count,admin_notes,created_at,updated_at,sd_order_items(product_name,sku,unit_price,qty,line_total)';
const field = 'h-11 w-full rounded-xl border border-line bg-white px-3 text-[15px] text-ink';
const money = (v: number | string) => formatPrice(Number(v));
/** wa.me needs the number with country code and no "+". Indian 10-digit numbers get 91. */
export const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  return d.length === 10 ? '91' + d : d;
};

function Detail({ row, onClose, onSaved, onDeleted }: { row: Row; onClose: () => void; onSaved: (r: Row) => void; onDeleted: (id: string) => void }) {
  const toast = useToast();
  const { role } = useAdminAuth();
  const [status, setStatus] = useState<Status>(row.status);
  const [notes, setNotes] = useState(row.admin_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dirty = status !== row.status || notes !== (row.admin_notes ?? '');
  const closed = row.status === 'cancelled';
  const deletable = row.status === 'cancelled' || row.status === 'delivered';

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !confirmCancel && !confirmDelete && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, confirmCancel, confirmDelete]);

  const save = async () => {
    if (!supabase) return;
    if (notes.length > 2000) return toast('error', 'Keep the notes to 2000 characters.');
    setConfirmCancel(false);
    setSaving(true);
    // Only status and notes can be changed from the browser; payment status is locked by the database.
    const { data, error } = await supabase.from('sd_orders').update({ status, admin_notes: notes.trim() || null }).eq('id', row.id).select(SELECT).single();
    setSaving(false);
    if (error) return toast('error', dbError(error, 'order'));
    onSaved(data as unknown as Row);
    toast('success', status === 'cancelled' && row.status !== 'cancelled' ? `${row.reference} was cancelled. Its items are back in stock.` : `${row.reference} saved: ${ORDER_STATUS[status]}.`);
  };

  const remove = async () => {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.from('sd_orders').delete().eq('id', row.id).select('id').single();
    setBusy(false);
    if (error) return toast('error', dbError(error, 'order'));
    toast('success', `${row.reference} was deleted.`);
    onDeleted(row.id);
  };

  const greeting = `Hello ${row.customer_name}, this is ${liveSite().name} about your order ${row.reference}.`;
  return (
    <div className="fixed inset-0 z-[65] flex justify-end bg-ink/40" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="order-title" className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-lift">
        <header className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div>
            <p className="font-mono text-sm text-slate">{row.reference}</p>
            <h2 id="order-title" className="font-display text-2xl font-semibold text-ink">
              {row.customer_name}
            </h2>
            <p className="mt-1 text-sm text-slate">Received {formatWhen(row.created_at)}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <div className="flex-1 space-y-6 p-5">
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${row.phone}`} className={buttonClass('dark', 'sm')}>
              <Phone className="h-4 w-4" aria-hidden /> Call
            </a>
            <a href={`https://wa.me/${waNumber(row.phone)}?text=${encodeURIComponent(greeting)}`} target="_blank" rel="noreferrer" className={buttonClass('outline', 'sm')}>
              <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
            </a>
            {row.email && (
              <a href={`mailto:${row.email}?subject=${encodeURIComponent(`Your order ${row.reference}`)}`} className={buttonClass('outline', 'sm')}>
                <Mail className="h-4 w-4" aria-hidden /> Email
              </a>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">Items</h3>
            <div className="mt-2 overflow-x-auto rounded-2xl ring-1 ring-line">
              <table className="w-full text-sm sm:text-[15px]">
                <thead className="bg-mist text-left text-xs font-semibold text-slate">
                  <tr>
                    <th scope="col" className="px-3 py-2">Product</th>
                    <th scope="col" className="hidden px-3 py-2 text-right sm:table-cell">Price</th>
                    <th scope="col" className="px-3 py-2 text-right">Qty</th>
                    <th scope="col" className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {row.sd_order_items.map((i, k) => (
                    <tr key={k} data-testid="order-item">
                      <td className="px-3 py-2 text-ink">
                        {i.product_name}
                        {i.sku && <span className="block font-mono text-xs text-slate">{i.sku}</span>}
                        <span className="block text-xs text-slate sm:hidden">{money(i.unit_price)} each</span>
                      </td>
                      <td className="hidden px-3 py-2 text-right tabular-nums sm:table-cell">{money(i.unit_price)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{i.qty}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{money(i.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line font-semibold">
                    <td className="px-3 py-2 sm:hidden">Total</td>
                    <td className="hidden px-3 py-2 sm:table-cell" colSpan={2}>Total</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.item_count}</td>
                    <td className="px-3 py-2 text-right tabular-nums" data-testid="order-total">{money(row.subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[15px]">
            <dt className="text-slate">Phone</dt>
            <dd className="text-ink">{row.phone}</dd>
            <dt className="text-slate">Email</dt>
            <dd className="text-ink">{row.email || '—'}</dd>
            <dt className="text-slate">Deliver to</dt>
            <dd className="whitespace-pre-line text-ink">
              {row.address}
              {'\n'}
              {row.city} {row.pin}
            </dd>
          </dl>

          <div className="rounded-2xl bg-mist p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Lock className="h-4 w-4 text-slate" aria-hidden /> Payment: <span data-testid="payment-status">{PAYMENT[row.payment_status]}</span>
            </p>
            <p className="mt-1 text-sm text-slate">Payment status can only be changed by a verified payment process, not from this screen. This site takes no online payments, so record any payment you receive in the team notes.</p>
          </div>

          <div>
            <SelectField id="order-status" label="Status" value={status} disabled={closed} onChange={(e) => setStatus(e.target.value as Status)} hint={closed ? 'A cancelled order cannot be reopened.' : 'Cancelling puts the items back in stock and cannot be undone.'}>
              {Object.entries(ORDER_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </SelectField>
          </div>
          <TextArea id="order-notes" label="Team notes" optional rows={4} hint="Only admins can see these." value={notes} onChange={(e) => setNotes(e.target.value)} />
          <p className="text-xs text-slate">Last updated {formatWhen(row.updated_at)}</p>
        </div>
        <footer className="flex flex-wrap items-center gap-3 border-t border-line p-5">
          <button type="button" onClick={() => (status === 'cancelled' && !closed ? setConfirmCancel(true) : save())} disabled={!dirty || saving} className={buttonClass('primary', 'md')}>
            {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />} Save
          </button>
          {role === 'owner' && (
            <button
              type="button"
              onClick={() => (deletable ? setConfirmDelete(true) : toast('error', 'Only delivered or cancelled orders can be deleted. Cancel this order first, so its items go back into stock.'))}
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-[#B3261E] hover:bg-[#B3261E]/10"
            >
              <Trash2 className="h-4 w-4" aria-hidden /> Delete
            </button>
          )}
        </footer>
      </section>
      <ConfirmDialog open={confirmCancel} title={`Cancel ${row.reference}?`} confirmLabel="Cancel order" busy={saving} onConfirm={save} onCancel={() => setConfirmCancel(false)}>
        The {row.item_count} {row.item_count === 1 ? 'item goes' : 'items go'} back into stock. A cancelled order cannot be reopened; the customer would need to order again.
      </ConfirmDialog>
      <ConfirmDialog open={confirmDelete} title={`Delete ${row.reference}?`} confirmLabel="Delete order" busy={busy} onConfirm={remove} onCancel={() => setConfirmDelete(false)}>
        This permanently removes the order, its items and its notes. Keep it if you may need it for your records.
      </ConfirmDialog>
    </div>
  );
}

export function AdminOrders() {
  useAdminMeta('Orders');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState<Row | null>(null);
  const q = params.get('q') ?? '';
  const status = (params.get('status') ?? '') as Status | '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const update = (patch: Record<string, string>) => {
    const n = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    if (!('page' in patch)) n.delete('page');
    setParams(n, { replace: true });
  };

  const load = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const { data, error: e } = await supabase.from('sd_orders').select(SELECT).order('created_at', { ascending: false }).limit(1000);
    if (e) return setError('Orders could not be loaded. ' + dbError(e));
    setRows(data as unknown as Row[]);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (rows ?? []).forEach((r) => (c[r.status] = (c[r.status] ?? 0) + 1));
    return c;
  }, [rows]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const digits = t.replace(/\D/g, '');
    return (rows ?? []).filter(
      (r) => (!status || r.status === status) && (!t || r.customer_name.toLowerCase().includes(t) || r.reference.toLowerCase().includes(t) || (digits.length >= 3 && r.phone.includes(digits))),
    );
  }, [rows, q, status]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * PAGE, current * PAGE);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Orders"
        description="Orders sent from the store. Call the customer to confirm the order and arrange payment, then update the status as it moves along."
        actions={
          <button type="button" onClick={load} className={buttonClass('outline', 'md')}>
            <RefreshCw className="h-4 w-4" aria-hidden /> Refresh
          </button>
        }
      />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by status">
        {(['', ...Object.keys(ORDER_STATUS)] as (Status | '')[]).map((s) => (
          <button key={s || 'all'} type="button" aria-pressed={status === s} onClick={() => update({ status: s })} className={cx('h-10 shrink-0 rounded-full px-4 text-sm font-medium ring-1', status === s ? 'bg-ink text-white ring-ink' : 'bg-white text-ink ring-line hover:ring-teal')}>
            {s ? ORDER_STATUS[s] : 'All'} <span className="ml-1 tabular-nums opacity-70">{s ? counts[s] ?? 0 : rows?.length ?? 0}</span>
          </button>
        ))}
      </div>
      <div className="relative mb-5 max-w-md">
        <label htmlFor="o-q" className="sr-only">
          Search orders
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden />
        <input id="o-q" type="search" value={q} onChange={(e) => update({ q: e.target.value })} placeholder="Search name, phone or reference" className={cx(field, 'pl-9')} />
      </div>

      {error ? (
        <LoadError message={error} onRetry={load} />
      ) : !rows ? (
        <p role="status" className="text-slate">Loading orders…</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-card ring-1 ring-line/70">
          <p className="font-semibold text-ink">{rows.length ? 'No orders match' : 'No orders yet'}</p>
          <p className="mt-1 text-[15px] text-slate">{rows.length ? 'Clear the search or choose another status.' : 'Orders sent from the store’s checkout will appear here.'}</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70">
            {shown.map((r) => (
              <li key={r.id} data-testid="order-row">
                <button type="button" onClick={() => setOpen(r)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-mist/60 sm:flex-nowrap sm:px-5">
                  <span className={cx('w-24 shrink-0 rounded-full px-2.5 py-0.5 text-center text-xs font-semibold', TONE[r.status])}>{ORDER_STATUS[r.status]}</span>
                  <span className="min-w-0 flex-1 basis-40">
                    <span className="block font-semibold text-ink">{r.customer_name}</span>
                    <span className="block truncate text-sm text-slate">
                      {r.city} {r.pin}
                    </span>
                  </span>
                  <span className="w-32 text-sm text-ink">
                    <span className="font-semibold tabular-nums">{money(r.subtotal)}</span>
                    <span className="block text-xs text-slate">
                      {r.item_count} {r.item_count === 1 ? 'item' : 'items'} · {PAYMENT[r.payment_status]}
                    </span>
                  </span>
                  <span className="hidden w-36 text-right text-xs text-slate md:block">
                    <span className="block font-mono">{r.reference}</span>
                    {formatWhen(r.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
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
      {open && (
        <Detail
          row={open}
          onClose={() => setOpen(null)}
          onSaved={(r) => {
            setRows((rs) => rs?.map((x) => (x.id === r.id ? r : x)) ?? null);
            setOpen(r);
          }}
          onDeleted={(id) => {
            setRows((rs) => rs?.filter((x) => x.id !== id) ?? null);
            setOpen(null);
          }}
        />
      )}
    </div>
  );
}
