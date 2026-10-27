import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Building2, CalendarCheck, ExternalLink, HeartPulse, House, LayoutDashboard, ListTree, LogOut, Menu, MessageSquare, Package,
  Settings, ShoppingBag, Stethoscope, Tags, UserCog, X, type LucideIcon,
} from 'lucide-react';
import { BRAND } from '@/data/img';
import { cx } from '@/lib/format';
import { useAdminAuth } from './auth';

interface NavItem { label: string; to?: string; icon: LucideIcon; ownerOnly?: boolean }

// Sections that are not built yet are shown as "Soon". Owner-only sections are hidden from editors.
const NAV: { heading: string; items: NavItem[] }[] = [
  { heading: 'Overview', items: [{ label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard }] },
  { heading: 'Catalogue', items: [{ label: 'Products', to: '/admin/products', icon: Package }, { label: 'Categories', to: '/admin/categories', icon: Tags }] },
  { heading: 'Care', items: [{ label: 'Appointments', to: '/admin/appointments', icon: CalendarCheck }, { label: 'Doctors', to: '/admin/doctors', icon: Stethoscope }, { label: 'Specialties', to: '/admin/specialties', icon: HeartPulse }] },
  { heading: 'Sales and enquiries', items: [{ label: 'Orders', to: '/admin/orders', icon: ShoppingBag }, { label: 'Messages', to: '/admin/messages', icon: MessageSquare }] },
  {
    heading: 'Website',
    items: [
      { label: 'Homepage', to: '/admin/homepage', icon: House },
      { label: 'Navigation', to: '/admin/navigation', icon: ListTree },
      { label: 'Facilities', to: '/admin/facilities', icon: Building2 },
      { label: 'Site settings', to: '/admin/settings', icon: Settings },
      { label: 'Admin users', to: '/admin/users', icon: UserCog, ownerOnly: true },
    ],
  },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = useAdminAuth();
  return (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="flex h-16 shrink-0 items-center gap-3 px-5">
        <img src={BRAND.mark} alt="" width={64} height={64} className="h-9 w-9 rounded-lg bg-white p-0.5" />
        <div className="leading-tight">
          <p className="font-display text-lg font-semibold">SaraDev</p>
          <p className="text-xs text-white/60">Admin panel</p>
        </div>
      </div>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-6">
        {NAV.map((group) => (
          <div key={group.heading} className="mt-5">
            <p className="px-3 text-xs font-semibold text-white/50">{group.heading}</p>
            <ul className="mt-2 space-y-0.5">
              {group.items.filter((i) => !i.ownerOnly || role === 'owner').map(({ label, to, icon: Icon }) => (
                <li key={label}>
                  {to ? (
                    <NavLink
                      to={to}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium', isActive ? 'bg-white/10 text-white ring-1 ring-white/15' : 'text-white/80 hover:bg-white/5 hover:text-white')
                      }
                    >
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                      {label}
                    </NavLink>
                  ) : (
                    <span aria-disabled="true" className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-white/40">
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                      <span className="flex-1">{label}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/55">Soon</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-white/80 hover:bg-white/5 hover:text-white">
          <ExternalLink className="h-[18px] w-[18px]" aria-hidden />
          View website
        </a>
      </div>
    </div>
  );
}

const titleFor = (path: string) =>
  path.startsWith('/admin/doctors/new') ? 'Add doctor'
  : path.startsWith('/admin/doctors/') ? 'Edit doctor'
  : path.startsWith('/admin/doctors') ? 'Doctors'
  : path.startsWith('/admin/specialties/new') ? 'Add specialty'
  : path.startsWith('/admin/specialties/') ? 'Edit specialty'
  : path.startsWith('/admin/specialties') ? 'Specialties'
  : path.startsWith('/admin/appointments') ? 'Appointments'
  : path.startsWith('/admin/homepage/') ? 'Edit homepage section'
  : path.startsWith('/admin/homepage') ? 'Homepage'
  : path.startsWith('/admin/navigation') ? 'Navigation'
  : path.startsWith('/admin/facilities/new') ? 'Add facility'
  : path.startsWith('/admin/facilities/') ? 'Edit facility'
  : path.startsWith('/admin/facilities') ? 'Facilities'
  : path.startsWith('/admin/settings') ? 'Site settings'
  : path.startsWith('/admin/orders') ? 'Orders'
  : path.startsWith('/admin/messages') ? 'Messages'
  : path.startsWith('/admin/users') ? 'Admin users'
  : path.startsWith('/admin/products/new') ? 'Add product'
  : path.startsWith('/admin/products/') ? 'Edit product'
  : path.startsWith('/admin/products') ? 'Products'
  : path.startsWith('/admin/categories') ? 'Categories'
  : path.startsWith('/admin/dashboard') ? 'Dashboard'
  : 'Admin';

export function AdminLayout() {
  const { email, role, signOut } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { pathname } = useLocation();
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      menuRef.current?.focus();
    };
  }, [open]);

  const doSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <div className="min-h-screen bg-mist">
      <a href="#admin-main" className="sr-only rounded-lg bg-white px-4 py-2 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]">
        Skip to content
      </a>

      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {/* mobile drawer */}
      <div className={cx('fixed inset-0 z-50 overflow-hidden lg:hidden', open ? '' : 'pointer-events-none invisible delay-200')} aria-hidden={!open}>
        <div className={cx('absolute inset-0 bg-ink/50 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
        <div id="admin-drawer" role="dialog" aria-modal="true" aria-label="Admin menu" className={cx('absolute inset-y-0 left-0 w-[min(84vw,300px)] shadow-lift transition-transform duration-200 motion-reduce:transition-none', open ? 'translate-x-0' : '-translate-x-full')}>
          <Sidebar onNavigate={() => setOpen(false)} />
          <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <button ref={menuRef} type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="admin-drawer" className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-mist lg:hidden">
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <p className="truncate font-display text-xl font-semibold text-ink">{titleFor(pathname)}</p>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="max-w-[220px] truncate text-sm font-medium text-ink" title={email ?? ''}>
                {email}
              </p>
              <p className="text-xs capitalize text-slate">{role}</p>
            </div>
            <button type="button" onClick={doSignOut} disabled={signingOut} className="inline-flex h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink hover:bg-mist disabled:opacity-50">
              <LogOut className="h-4 w-4" aria-hidden />
              <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
            </button>
          </div>
        </header>
        <main id="admin-main" tabIndex={-1} className="px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
