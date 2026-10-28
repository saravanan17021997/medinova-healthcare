import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { HeroHighlight, HeroStat, StatSource } from '@/config/hero';
import { useCare } from '@/state/care';
import { useCatalog } from '@/state/catalog';
import { useFacilities } from '@/state/content';
import { FeatureIcon } from './FeatureIcon';
import { cx } from '@/lib/format';

// The pieces of the homepage hero that are not the words or the slider:
// the light behind it, the flowing waves, the curved outlines around the image,
// the floating highlight cards and the row of figures. All decoration is
// aria-hidden and never takes clicks; the cards and figures are real content.

/** The headline, with the clinic's short name picked out in the brand gradient. */
export function HeroHeadline({ text, brand }: { text: string; brand: string }) {
  const at = brand ? text.lastIndexOf(brand) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="text-brand-gradient">{brand}</span>
      {text.slice(at + brand.length)}
    </>
  );
}

/** Ambient light and the flowing aqua waves along the bottom of the hero. */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(1000px_620px_at_76%_34%,rgba(37,197,208,0.2),transparent_62%),radial-gradient(760px_520px_at_4%_0%,rgba(223,247,247,0.95),transparent_70%),linear-gradient(180deg,#ffffff_0%,#f3fbfb_62%,#eaf7f8_100%)]" />
      <div className="orb -left-32 top-28 h-80 w-80 bg-aqua/30" />
      <div className="orb -right-24 top-16 h-[30rem] w-[30rem] bg-[#25C5D0]/20" />
      <div className="orb bottom-10 left-1/3 h-64 w-[36rem] bg-teal-500/10" />
      {/* fade into the page colour, so the hero has no hard lower edge */}
      <div className="absolute inset-x-0 bottom-0 z-[1] h-20 bg-gradient-to-b from-transparent to-[#f6fcfc]" />
      <svg className="absolute inset-x-0 bottom-0 h-[260px] w-full sm:h-[340px] lg:h-[420px]" viewBox="0 0 1440 420" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hero-wave-a" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.55" stopColor="#CFF0EE" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="hero-wave-b" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#25C5D0" stopOpacity="0.05" />
            <stop offset="0.5" stopColor="#25C5D0" stopOpacity="0.42" />
            <stop offset="1" stopColor="#63D1CE" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="hero-wave-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#25C5D0" stopOpacity="0" />
            <stop offset="0.45" stopColor="#25C5D0" stopOpacity="0.75" />
            <stop offset="1" stopColor="#25C5D0" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <g className="wave-drift-slow">
          <path d="M380,420 C640,380 900,300 1080,170 C1200,84 1320,40 1500,30 L1500,92 C1330,96 1220,150 1110,226 C930,348 680,410 470,420 Z" fill="url(#hero-wave-b)" opacity="0.75" />
          <path d="M-60,250 C240,160 540,330 860,250 C1100,190 1280,96 1500,120 L1500,196 C1270,180 1100,268 860,322 C540,396 260,232 -60,318 Z" fill="url(#hero-wave-b)" />
        </g>
        <g className="wave-drift">
          <path d="M-60,300 C300,214 520,384 830,304 C1090,236 1250,182 1500,214 L1500,420 L-60,420 Z" fill="url(#hero-wave-a)" />
          <path d="M-60,286 C300,200 520,370 830,290 C1090,222 1250,168 1500,200" fill="none" stroke="url(#hero-wave-line)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path d="M-60,330 C260,262 560,402 880,336 C1120,286 1280,240 1500,262" fill="none" stroke="url(#hero-wave-line)" strokeOpacity="0.6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
    </div>
  );
}

/** Soft glassy ribbons that curve around the image frame (wide screens only). */
export function HeroArcs() {
  return (
    <svg aria-hidden className="pointer-events-none absolute -inset-x-14 -bottom-10 -top-16 hidden h-[calc(100%+6.5rem)] w-[calc(100%+7rem)] lg:block" viewBox="0 0 700 560" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="hero-arc" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#25C5D0" stopOpacity="0" />
          <stop offset="0.45" stopColor="#25C5D0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="hero-arc-thin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#25C5D0" stopOpacity="0.7" />
          <stop offset="1" stopColor="#25C5D0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M40,330 C24,170 170,52 380,40 C530,32 630,84 690,150" stroke="url(#hero-arc)" strokeWidth="18" strokeLinecap="round" opacity="0.5" />
      <path d="M48,326 C34,176 174,62 380,50 C526,42 624,92 682,156" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" />
      <path d="M22,380 C-2,250 52,150 160,96" stroke="url(#hero-arc-thin)" strokeWidth="2" strokeLinecap="round" />
      <path d="M664,120 C716,230 712,380 620,500" stroke="url(#hero-arc-thin)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Where each floating card sits on wide screens (1280 px and up), and how it drifts.
const CARD_SPOTS = [
  'xl:absolute xl:-left-9 xl:top-2 xl:float-a',
  'xl:absolute xl:-right-9 xl:top-[17%] xl:float-b',
  'xl:absolute xl:-left-11 xl:bottom-[9%] xl:float-c',
  'xl:absolute xl:-right-10 xl:bottom-0 xl:float-d',
];

/** Up to four highlight cards: floating around the image on wide screens, a tidy grid below it on smaller ones. */
export function HeroHighlights({ items, controls = false }: { items: HeroHighlight[]; controls?: boolean }) {
  if (items.length === 0) return null;
  // with slider dots under the image, the lower-left card moves up out of their way
  const spots = controls ? CARD_SPOTS.map((c, i) => (i === 2 ? c.replace('xl:bottom-[9%]', 'xl:bottom-[24%]') : c)) : CARD_SPOTS;
  return (
    <ul className="relative mt-5 grid grid-cols-2 gap-3 xl:static xl:mt-0 xl:block" data-testid="hero-highlights">
      {items.map((h, i) => (
        <li key={i} className={cx('glass-hero z-10 flex items-center gap-3 rounded-[18px] px-3 py-2.5 sm:px-3.5 sm:py-3 xl:pr-5', spots[i])}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-aqua-50 to-white ring-1 ring-teal-500/15 sm:h-10 sm:w-10">
            <FeatureIcon name={h.icon} className="h-5 w-5 text-teal-500" />
          </span>
          <span className="min-w-0 text-[13px] font-semibold leading-snug text-ink sm:text-sm xl:max-w-[9.5rem]">{h.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** The glossy plus mark that floats at the edge of the hero. */
export function HeroPlus({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cx('pointer-events-none hidden h-[84px] w-[84px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_28%,#B8F1F3_0%,#3CCBD5_38%,#0E8F9C_78%,#0A6E72_100%)] shadow-[0_18px_40px_-12px_rgba(14,143,156,0.65),inset_0_2px_6px_rgba(255,255,255,0.55)] ring-[6px] ring-white/50 lg:flex', className)}>
      <Plus className="h-10 w-10 text-white drop-shadow-[0_2px_4px_rgba(10,110,114,0.45)]" strokeWidth={3.2} />
    </span>
  );
}

const STAT_LINKS: Record<Exclude<StatSource, 'custom'>, string> = { specialties: '/specialties', doctors: '/doctors', facilities: '/facilities', products: '/store' };

/** The row of figures under the hero. Automatic figures count what is published right now; a figure of 0 is left out. */
export function HeroStats({ stats }: { stats: HeroStat[] }) {
  const wants = (s: StatSource) => stats.some((x) => x.source === s);
  const care = useCare(wants('specialties') || wants('doctors'));
  const catalog = useCatalog(wants('products'));
  const facilities = useFacilities(wants('facilities'));
  const count = (s: StatSource): number | 'loading' | null => {
    const state = s === 'products' ? catalog.status : s === 'facilities' ? facilities.status : care.status;
    if (state === 'error') return null;
    if (state !== 'ready') return 'loading';
    return s === 'specialties' ? care.specialties.length : s === 'doctors' ? care.doctors.length : s === 'facilities' ? facilities.facilities.length : catalog.products.length;
  };
  const rows = stats
    .map((s) => ({ s, n: s.source === 'custom' ? s.value : count(s.source) }))
    .filter(({ n }) => n !== null && n !== 0);
  if (rows.length === 0) return null;
  return (
    <ul className={cx('relative z-10 grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5', rows.length >= 4 ? 'lg:grid-cols-4' : rows.length === 3 ? 'lg:grid-cols-3' : '')} data-testid="hero-stats">
      {rows.map(({ s, n }, i) => {
        const body = (
          <>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white to-aqua-50 shadow-[0_8px_18px_-10px_rgba(14,143,156,0.6)] ring-1 ring-white sm:h-14 sm:w-14">
              <FeatureIcon name={s.icon} className="h-6 w-6 text-teal-500" />
            </span>
            <span className="min-w-0">
              {n === 'loading' ? (
                <span className="block h-7 w-12 animate-pulse rounded-md bg-ink/10 motion-reduce:animate-none" />
              ) : (
                <span className="block font-sans text-2xl font-bold leading-none tracking-tight text-ink sm:text-[1.75rem]">{n}</span>
              )}
              <span className="mt-1.5 block text-sm leading-snug text-slate sm:text-[15px]">{s.label}</span>
            </span>
          </>
        );
        const box = 'glass-hero flex h-full items-center gap-3 rounded-[22px] p-4 sm:gap-4 sm:p-5';
        return (
          <li key={i}>
            {s.source === 'custom' ? (
              <div className={box}>{body}</div>
            ) : (
              <Link to={STAT_LINKS[s.source]} className={cx(box, 'lift')} aria-busy={n === 'loading' || undefined}>
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
