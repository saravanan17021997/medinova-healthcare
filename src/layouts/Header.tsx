import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarCheck, Menu, Phone, Search, ShoppingBag, X } from 'lucide-react';
import { useNav, useSite } from '@/state/content';
import { SiteLink } from '@/components/SiteLink';
import { BRAND } from '@/data/img';
import { useCart } from '@/state/cart';
import { telUrl } from '@/services/contact';
import { buttonClass } from '@/components/ui';
import { cx } from '@/lib/format';

export function AnnouncementBar() {
  const site = useSite();
  if (!site.demo) return null;
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
  const site = useSite();
  const nav = useNav();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // A longer menu needs more room: it moves into the menu button until 1280 px. The phone number
  // then appears from 1536 px, or not at all with a full menu (it stays in the phone menu and footer).
  const long = nav.header.length > 5;
  const phoneAt = nav.header.length <= 5 ? 'xl:flex' : nav.header.length === 6 ? '2xl:flex' : '';
  const navLink = ({ isActive }: { isActive: boolean }) => cx('whitespace-nowrap rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors duration-200', isActive ? 'bg-teal-500/10 text-teal-700 ring-1 ring-teal-500/20' : 'text-ink hover:bg-white/80 hover:text-teal-700');

  return (
    // A floating frosted bar: the page shows through it as it scrolls underneath.
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <div className="glass-hero mx-auto flex h-16 max-w-content items-center gap-4 rounded-[20px] px-3 sm:px-5 lg:h-[72px] lg:rounded-[22px] lg:px-6">
        <Link to="/" className="shrink-0" aria-label={`${site.name} home`}>
          <img src={BRAND.logo} alt={site.name} width={220} height={64} className="h-9 w-auto sm:h-10" />
        </Link>

        <nav aria-label="Main" className={cx('ml-4 hidden items-center gap-1', long ? 'xl:flex' : 'lg:flex')}>
          {nav.header.map((n) => (
            <SiteLink key={n.href + n.label} item={n} className={navLink} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <a href={telUrl()} className={cx('hidden h-10 items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm font-medium text-ink transition-colors hover:bg-white/80 hover:text-teal-700', phoneAt)}>
            <Phone className="h-4 w-4 text-teal-500" aria-hidden />
            {site.contact.phoneDisplay}
          </a>
          <Link to="/store" className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-white/80 hover:text-teal-700" aria-label="Search the store">
            <Search className="h-5 w-5" aria-hidden />
          </Link>
          <Link to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-white/80 hover:text-teal-700" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
            <ShoppingBag className="h-5 w-5" aria-hidden />
            {count > 0 && <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal px-1 text-[11px] font-bold text-white ring-2 ring-white">{count}</span>}
          </Link>
          <Link to="/appointment" className={buttonClass('gradient', 'md', 'ml-1 hidden whitespace-nowrap sm:inline-flex')}>
            <CalendarCheck className="h-[18px] w-[18px]" aria-hidden /> Book an appointment
          </Link>
          <button type="button" className={cx('flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-white/80', long ? 'xl:hidden' : 'lg:hidden')} aria-expanded={open} aria-controls="mobile-nav" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      <div id="mobile-nav" className={cx('fixed inset-0 z-50 overflow-hidden', long ? 'xl:hidden' : 'lg:hidden', open ? '' : 'pointer-events-none invisible delay-200')} aria-hidden={!open}>
        <div className={cx('absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
        <div role="dialog" aria-modal="true" aria-label="Menu" className={cx('glass-panel absolute bottom-3 right-3 top-3 flex w-[min(86vw,360px)] flex-col overflow-y-auto rounded-3xl p-5 transition-transform duration-300 ease-out', open ? 'translate-x-0' : 'translate-x-[110%]')}>
          <div className="mb-6 flex items-center justify-between">
            <img src={BRAND.mark} alt="" width={64} height={64} className="h-10 w-10" />
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink/5" aria-label="Close menu" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              <X className="h-6 w-6" aria-hidden />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {[{ href: '/', label: 'Home', newTab: false }, ...nav.header, { href: '/cart', label: `Cart (${count})`, newTab: false }].map((n) => (
              <SiteLink key={n.href + n.label} item={n} end={n.href === '/'} tabIndex={open ? 0 : -1} className={({ isActive }) => cx('rounded-2xl px-4 py-3 text-lg font-medium transition-colors', isActive ? 'bg-teal-500/10 text-teal-700 ring-1 ring-teal-500/20' : 'text-ink hover:bg-white')} />
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2">
            <Link to="/appointment" tabIndex={open ? 0 : -1} className={buttonClass('gradient', 'lg')}>
              <CalendarCheck className="h-5 w-5" aria-hidden /> Book an appointment
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
