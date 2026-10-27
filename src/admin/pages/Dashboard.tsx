import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarCheck, MessageSquare, Package, PackageX, RefreshCw, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { buttonClass } from '@/components/ui';
import { cx } from '@/lib/format';
import { useAdminMeta } from '../components';

// Shape returned by the database function public.sd_admin_dashboard().
// Every number comes from the database: nothing here is estimated or invented.
interface DashboardData {
  published_products: number;
  low_stock: { id: string; name: string; sku: string; stock: number; low_stock_threshold: number }[];
  orders_by_status: Record<string, number>;
  appointments_by_status: Record<string, number>;
  new_messages: number;
  recent_activity: { id: number; admin_email: string | null; action: string; table_name: string; record_id: string | null; created_at: string }[];
}

const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
const APPOINTMENT_STATUSES = ['new', 'contacted', 'confirmed', 'completed', 'cancelled'];
const TABLE_LABEL: Record<string, string> = {
  sd_admins: 'Admin users', sd_categories: 'Categories', sd_products: 'Products', sd_product_images: 'Product images',
  sd_specialties: 'Specialties', sd_doctors: 'Doctors', sd_facilities: 'Facilities', sd_site_settings: 'Site settings',
  sd_nav_links: 'Navigation', sd_page_sections: 'Page sections', sd_appointments: 'Appointments',
  sd_contact_messages: 'Messages', sd_orders: 'Orders',
};
const ACTION_LABEL: Record<string, string> = { INSERT: 'Added', UPDATE: 'Updated', DELETE: 'Deleted' };

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + Number(b), 0);
const when = (iso: string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(iso));
const label = (s: string) => (s === 'pending' ? 'New' : s.charAt(0).toUpperCase() + s.slice(1));

function StatCard({ icon, title, value, note, tone = 'default', to }: { icon: ReactNode; title: string; value: number; note: string; tone?: 'default' | 'warn'; to?: string }) {
  const body = (
    <>
      <div className="flex items-center gap-3">
        <span className={cx('flex h-10 w-10 items-center justify-center rounded-xl', tone === 'warn' && value > 0 ? 'bg-signal/25 text-ink' : 'bg-aqua-50 text-teal')}>{icon}</span>
        <h2 className="text-sm font-semibold text-slate">{title}</h2>
      </div>
      <p className="mt-4 font-display text-4xl font-semibold tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-sm text-slate">{note}</p>
    </>
  );
  const box = 'block rounded-2xl bg-white p-5 shadow-card ring-1 ring-line/70';
  return to ? (
    <Link to={to} className={cx(box, 'hover:ring-teal focus-visible:ring-2 focus-visible:ring-teal')}>
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}

function Panel({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="min-w-0 rounded-2xl bg-white shadow-card ring-1 ring-line/70">
      <h2 id={id} className="border-b border-line px-5 py-4 font-semibold text-ink">
        {title}
      </h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

function StatusList({ statuses, counts, empty }: { statuses: string[]; counts: Record<string, number>; empty: string }) {
  if (sum(counts) === 0) return <p className="text-sm text-slate">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {statuses.map((s) => (
        <li key={s} className="flex items-center justify-between text-[15px]">
          <span className="text-ink">{label(s)}</span>
          <span className="min-w-[2.5rem] rounded-full bg-mist px-2.5 py-0.5 text-center font-semibold tabular-nums text-ink">{Number(counts[s] ?? 0)}</span>
        </li>
      ))}
    </ul>
  );
}

function Skeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-[154px] animate-pulse rounded-2xl bg-white ring-1 ring-line/70 motion-reduce:animate-none" />
      ))}
    </div>
  );
}

export function AdminDashboard() {
  useAdminMeta('Dashboard');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { data: d, error: e } = await supabase.rpc('sd_admin_dashboard');
    if (e) setError(e.message || 'Unknown error');
    else {
      setData(d as DashboardData);
      setLoadedAt(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const orders = data ? sum(data.orders_by_status) : 0;
  const appts = data ? sum(data.appointments_by_status) : 0;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Overview</h1>
          <p className="mt-1 text-[15px] text-slate">Live figures from the SaraDev database.{loadedAt && ` Updated ${when(loadedAt.toISOString())}.`}</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className={buttonClass('outline', 'sm')}>
          <RefreshCw className={cx('h-4 w-4', loading && 'animate-spin motion-reduce:animate-none')} aria-hidden />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-5 ring-1 ring-coral/40 sm:flex-row sm:items-center">
          <AlertTriangle className="h-5 w-5 shrink-0 text-coral" aria-hidden />
          <p className="flex-1 text-[15px] text-ink">
            The dashboard could not be loaded: <span className="text-slate">{error}</span>
          </p>
          <button type="button" onClick={load} className={buttonClass('primary', 'sm')}>
            Try again
          </button>
        </div>
      )}

      {loading && !data ? (
        <Skeleton />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard icon={<Package className="h-5 w-5" aria-hidden />} title="Published products" value={Number(data.published_products)} note="Visible in the store" />
            <StatCard icon={<PackageX className="h-5 w-5" aria-hidden />} title="Low stock" value={data.low_stock.length} note="At or below their alert level" tone="warn" />
            <StatCard icon={<ShoppingBag className="h-5 w-5" aria-hidden />} title="Orders" value={orders} note={`${Number(data.orders_by_status.pending ?? 0)} new`} to="/admin/orders?status=pending" />
            <StatCard icon={<CalendarCheck className="h-5 w-5" aria-hidden />} title="Appointment requests" value={appts} note={`${Number(data.appointments_by_status.new ?? 0)} new`} to="/admin/appointments?status=new" />
            <StatCard icon={<MessageSquare className="h-5 w-5" aria-hidden />} title="New messages" value={Number(data.new_messages)} note="Not yet read" to="/admin/messages?status=new" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel id="orders-heading" title="Orders by status">
              <StatusList statuses={ORDER_STATUSES} counts={data.orders_by_status} empty="No orders yet. Orders placed on the website will appear here." />
              <Link to="/admin/orders" className="mt-4 inline-block text-sm font-semibold text-teal-700 underline-offset-4 hover:underline">
                Open orders
              </Link>
            </Panel>
            <Panel id="appointments-heading" title="Appointment requests by status">
              <StatusList statuses={APPOINTMENT_STATUSES} counts={data.appointments_by_status} empty="No appointment requests yet." />
              <Link to="/admin/appointments" className="mt-4 inline-block text-sm font-semibold text-teal-700 underline-offset-4 hover:underline">
                Open appointment requests
              </Link>
            </Panel>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Panel id="lowstock-heading" title="Low-stock products">
              {data.low_stock.length === 0 ? (
                <p className="text-sm text-slate">Every published product is above its alert level.</p>
              ) : (
                <div className="-mx-5 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-[15px]">
                    <thead className="whitespace-nowrap text-xs font-semibold text-slate">
                      <tr>
                        <th scope="col" className="px-5 pb-2">Product</th>
                        <th scope="col" className="px-5 pb-2">SKU</th>
                        <th scope="col" className="px-5 pb-2 text-right">In stock</th>
                        <th scope="col" className="px-5 pb-2 text-right">Alert at</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.low_stock.map((p) => (
                        <tr key={p.id} className="border-t border-line">
                          <td className="px-5 py-2.5 font-medium text-ink">
                            <Link to={`/admin/products/${p.id}`} className="hover:underline">
                              {p.name}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-5 py-2.5 font-mono text-sm text-slate">{p.sku}</td>
                          <td className={cx('px-5 py-2.5 text-right font-semibold tabular-nums', p.stock === 0 ? 'text-[#B3261E]' : 'text-ink')}>{p.stock}</td>
                          <td className="px-5 py-2.5 text-right tabular-nums text-slate">{p.low_stock_threshold}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
            <Panel id="activity-heading" title="Recent admin activity">
              {data.recent_activity.length === 0 ? (
                <p className="text-sm text-slate">No admin changes recorded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {data.recent_activity.map((a) => (
                    <li key={a.id} className="flex flex-col gap-0.5 border-b border-line pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                      <span className="text-[15px] text-ink">
                        <strong className="font-semibold">{ACTION_LABEL[a.action] ?? a.action}</strong> {TABLE_LABEL[a.table_name] ?? a.table_name}
                        <span className="text-slate"> · {a.admin_email ?? 'SQL Editor'}</span>
                      </span>
                      <time dateTime={a.created_at} className="shrink-0 text-sm text-slate">
                        {when(a.created_at)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  );
}
