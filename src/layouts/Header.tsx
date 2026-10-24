import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Phone, Search, ShoppingBag, X } from 'lucide-react';
import { site } from '@/config/site';
import { BRAND } from '@/data/img';
import { useCart } from '@/state/cart';
import { telUrl } from '@/services/contact';
import { buttonClass } from '@/components/ui';
import { cx } from '@/lib/format';

const NAV = [
  { to: '/specialties', label: 'Specialties' },
  { to: '/doctors', label: 'Doctors' },
  { to: '/facilities', label: 'Facilities' },
  { to: '/store', label: 'Store' },
  { to: '/contact', label: 'Contact' },
];

export function AnnouncementBar() {
  return (
    <div className="bg-ink text-white">
      <p className="container-x py-2 text-center text-[13px] leading-snug text-white/90">{site.demoNotice}</p>
    </div>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const navLink = ({ isActive }: { isActive: boolean }) => cx('rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors', isActive ? 'bg-aqua-50 text-teal-700' : 'text-ink hover:bg-mist');

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/95 backdrop-blur">
      <div className="container-x flex h-[72px] items-center gap-4">
        <Link to="/" className="shrink-0" aria-label={`${site.name} home`}>
          <img src={BRAND.logo} alt={site.name} width={220} height={64} className="h-10 w-auto sm:h-11" />
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={navLink}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <a href={telUrl()} className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-ink hover:bg-mist xl:flex">
            <Phone className="h-4 w-4" aria-hidden />
            {site.contact.phoneDisplay}
          </a>
          <Link to="/store" className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-mist" aria-label="Search the store">
            <Search className="h-5 w-5" aria-hidden />
          </Link>
          <Link to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-mist" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
            <ShoppingBag className="h-5 w-5" aria-hidden />
            {count > 0 && <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal px-1 text-[11px] font-bold text-white">{count}</span>}
          </Link>
          <Link to="/appointment" className={buttonClass('primary', 'md', 'hidden sm:inline-flex')}>
            Book an appointment
          </Link>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-mist lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      <div id="mobile-nav" className={cx('fixed inset-0 z-50 overflow-hidden lg:hidden', open ? '' : 'pointer-events-none invisible delay-200')} aria-hidden={!open}>
        <div className={cx('absolute inset-0 bg-ink/40 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
        <div role="dialog" aria-modal="true" aria-label="Menu" className={cx('absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col bg-white p-5 shadow-lift transition-transform duration-200', open ? 'translate-x-0' : 'translate-x-full')}>
          <div className="mb-6 flex items-center justify-between">
            <img src={BRAND.mark} alt="" width={64} height={64} className="h-10 w-10" />
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist" aria-label="Close menu" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              <X className="h-6 w-6" aria-hidden />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {[{ to: '/', label: 'Home' }, ...NAV, { to: '/cart', label: `Cart (${count})` }].map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} tabIndex={open ? 0 : -1} className={({ isActive }) => cx('rounded-xl px-4 py-3 text-lg font-medium', isActive ? 'bg-aqua-50 text-teal-700' : 'text-ink hover:bg-mist')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2">
            <Link to="/appointment" tabIndex={open ? 0 : -1} className={buttonClass('primary', 'lg')}>
              Book an appointment
            </Link>
            <a href={telUrl()} tabIndex={open ? 0 : -1} className={buttonClass('outline', 'lg')}>
              <Phone className="h-4 w-4" aria-hidden /> Call {site.contact.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
