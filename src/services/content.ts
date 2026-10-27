import type { Facility, ImageAsset } from '@/types';
import { site as builtIn, type SiteConfig } from '@/config/site';
import { HERO } from '@/data/img';
import { facilities as sampleFacilities } from '@/data/facilities';
import { SUPABASE_KEY, SUPABASE_URL, supabaseReady } from '@/lib/supabaseConfig';
import { isSafeHref } from '@/lib/links';

// Site-wide content for the public website: settings (name, contact details,
// hours, address), menus, homepage sections and facilities. Read from Supabase
// with the publishable key; Row Level Security only returns PUBLISHED rows.
// Every value is checked before use, and anything missing or malformed falls
// back to the built-in content, so a bad row can never blank the page.

export type ContentSource = 'database' | 'sample';
export const contentSource: ContentSource = supabaseReady ? 'database' : 'sample';

// ---------------------------------------------------------------- raw rows
export interface SettingRow { key: string; value: unknown }
export interface NavRow { location: string; label: string; href: string; new_tab: boolean; sort_order: number }
export interface SectionRow {
  key: string; heading: string; body: string; image_url: string | null; image_small_url: string | null; image_alt: string;
  cta_label: string | null; cta_href: string | null; cta2_label: string | null; cta2_href: string | null; items: unknown; sort_order: number;
}
interface FacilityRow { slug: string; name: string; description: string; image_url: string | null; image_small_url: string | null; image_alt: string; image_width: number | null; image_height: number | null }

async function rest<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_KEY, Accept: 'application/json' }, signal });
  if (!res.ok) throw new Error(`This information could not be loaded (error ${res.status}).`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------- value guards
const str = (v: unknown, fallback: string, max = 500) => (typeof v === 'string' && v.trim() && v.length <= max ? v.trim() : fallback);
const optStr = (v: unknown, max = 500) => (typeof v === 'string' && v.length <= max ? v.trim() : '');
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const safeImageUrl = (v: unknown): v is string => typeof v === 'string' && /^(\/(?!\/)|https:\/\/[^/])/.test(v) && !/[\s\\\u0000-\u001f]/.test(v);

// ---------------------------------------------------------------- settings
/** Builds the site settings from the saved rows, keeping the built-in value wherever a saved one is missing or invalid. */
export function buildSite(rows: SettingRow[]): SiteConfig {
  const by = new Map(rows.map((r) => [r.key, r.value]));
  const brand = obj(by.get('brand'));
  const contact = obj(by.get('contact'));
  const location = obj(by.get('location'));
  const footer = obj(by.get('footer'));
  const features = obj(by.get('features'));
  const rawHours = by.get('hours');
  const hours = Array.isArray(rawHours)
    ? rawHours.map(obj).map((h) => ({ days: optStr(h.days, 60), time: optStr(h.time, 60) })).filter((h) => h.days && h.time).slice(0, 7)
    : [];
  const lines = Array.isArray(location.addressLines) ? location.addressLines.map((l) => optStr(l, 120)).filter(Boolean).slice(0, 4) : [];
  const phoneHref = typeof contact.phoneHref === 'string' && /^\+?[0-9]{6,15}$/.test(contact.phoneHref) ? contact.phoneHref : builtIn.contact.phoneHref;
  const wa = typeof contact.whatsappNumber === 'string' && /^[0-9]{11,15}$/.test(contact.whatsappNumber) ? contact.whatsappNumber : builtIn.contact.whatsappNumber;
  const email = typeof contact.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email) ? contact.email : builtIn.contact.email;
  return {
    ...builtIn,
    name: str(brand.name, builtIn.name, 80),
    shortName: str(brand.shortName, builtIn.shortName, 30),
    tagline: str(brand.tagline, builtIn.tagline, 120),
    demo: bool(brand.demo, builtIn.demo),
    demoNotice: str(brand.demoNotice, builtIn.demoNotice, 300),
    contact: { phoneDisplay: str(contact.phoneDisplay, builtIn.contact.phoneDisplay, 30), phoneHref, whatsappNumber: wa, email, hours: hours.length ? hours : builtIn.contact.hours },
    location: {
      verified: bool(location.verified, builtIn.location.verified) && lines.length > 0,
      name: str(location.name, builtIn.location.name, 100),
      addressLines: lines.length ? lines : builtIn.location.addressLines,
      mapsQuery: optStr(location.mapsQuery, 200),
    },
    features: { testimonials: bool(features.testimonials, builtIn.features.testimonials) },
    credit: typeof footer.credit === 'string' ? optStr(footer.credit, 160) : builtIn.credit,
  };
}

// ---------------------------------------------------------------- menus
export interface NavItem { label: string; href: string; newTab: boolean }
export interface SiteNav { header: NavItem[]; explore: NavItem[]; social: NavItem[] }

export const DEFAULT_NAV: SiteNav = {
  header: [
    { label: 'Specialties', href: '/specialties', newTab: false },
    { label: 'Doctors', href: '/doctors', newTab: false },
    { label: 'Facilities', href: '/facilities', newTab: false },
    { label: 'Store', href: '/store', newTab: false },
    { label: 'Contact', href: '/contact', newTab: false },
  ],
  explore: [
    { label: 'Find a doctor', href: '/doctors', newTab: false },
    { label: 'Book an appointment', href: '/appointment', newTab: false },
    { label: 'Facilities', href: '/facilities', newTab: false },
    { label: 'Health essentials', href: '/store', newTab: false },
    { label: 'Contact us', href: '/contact', newTab: false },
  ],
  social: [],
};

export function buildNav(rows: NavRow[]): SiteNav {
  const pick = (loc: string, max: number) =>
    rows
      .filter((r) => r.location === loc && typeof r.label === 'string' && r.label.trim() && isSafeHref(r.href) && (loc !== 'footer_social' || r.href.startsWith('https://')))
      .sort((a, b) => a.sort_order - b.sort_order)
      .slice(0, max)
      .map((r) => ({ label: r.label.trim().slice(0, 60), href: r.href, newTab: Boolean(r.new_tab) }));
  return { header: pick('header', 7), explore: pick('footer_explore', 8), social: pick('footer_social', 6) };
}

// ---------------------------------------------------------------- homepage sections
export const SECTION_KEYS = ['home.hero', 'home.specialties', 'home.team', 'home.appointment', 'home.essentials', 'home.why', 'home.visit'] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export interface Cta { label: string; href: string }
export interface Feature { icon: string; title: string; body: string }
/** One picture in the homepage hero slider. */
export interface Slide { id: string; image: ImageAsset; title: string; description: string }
export interface PageSection { key: SectionKey; heading: string; body: string; image: ImageAsset | null; cta: Cta | null; cta2: Cta | null; steps: string[]; features: Feature[]; slides: Slide[] }

/**
 * Hero slides are stored in the "items" list of the home.hero section:
 * { id, image_url, image_small_url, image_alt, image_width, image_height, title, description, enabled }.
 * Only enabled slides with a safe image address are shown, in list order (up to 8).
 */
export const MAX_SLIDES = 8;
export function buildSlides(items: unknown): Slide[] {
  if (!Array.isArray(items)) return [];
  return items
    .map(obj)
    .filter((x) => x.enabled === true && safeImageUrl(x.image_url))
    .slice(0, MAX_SLIDES)
    .map((x, i) => {
      const w = Number(x.image_width), h = Number(x.image_height);
      const width = Number.isFinite(w) && w > 0 ? Math.round(w) : 1600;
      const height = Number.isFinite(h) && h > 0 ? Math.round(h) : 1000;
      const title = optStr(x.title, 80);
      return {
        id: optStr(x.id, 60) || `slide-${i}`,
        image: { src: x.image_url as string, alt: optStr(x.image_alt, 200) || title, width, height, ...(safeImageUrl(x.image_small_url) ? { smallSrc: x.image_small_url, smallWidth: Math.round(width / 2) } : {}) },
        title,
        description: optStr(x.description, 200),
      };
    });
}

/** The built-in homepage, used until the saved one has loaded and whenever a value is missing. */
export const DEFAULT_SECTIONS: PageSection[] = [
  {
    key: 'home.hero', heading: 'Healthcare that puts you first',
    body: 'Explore healthcare services, discover medical professionals, request appointments, and browse healthcare essentials in one convenient digital experience.',
    image: HERO.team, cta: { label: 'Book an appointment', href: '/appointment' }, cta2: { label: 'Explore services', href: '/specialties' }, steps: [], features: [], slides: [],
  },
  { key: 'home.specialties', heading: 'Find the right specialty', body: 'Start with what you need help with. Each specialty page explains what to expect and who you can see.', image: null, cta: null, cta2: null, steps: [], features: [], slides: [] },
  { key: 'home.team', heading: 'Meet the care team', body: 'Browse profiles by specialty, language and the days each person is available.', image: null, cta: null, cta2: null, steps: [], features: [], slides: [] },
  {
    key: 'home.appointment', heading: 'Request an appointment in three steps', body: '', image: HERO.consultation, cta: { label: 'Start your request', href: '/appointment' }, cta2: null,
    steps: ['Choose a specialty, and a doctor if you have one in mind.', 'Pick a day and a time of day that suits you.', 'The team calls you back to confirm a slot.'], features: [], slides: [],
  },
  { key: 'home.essentials', heading: 'Everyday health essentials', body: 'A sample catalogue of home-care items. Prices are illustrative and orders are simulated.', image: null, cta: null, cta2: null, steps: [], features: [], slides: [] },
  {
    key: 'home.why', heading: 'Why people choose SaraDev', body: 'Everything you need before, between and after visits, in one place.', image: HERO.reception, cta: null, cta2: null, steps: [], slides: [],
    features: [
      { icon: 'Search', title: 'Find the right care', body: 'Browse specialties and team profiles, and filter by language and availability.' },
      { icon: 'CalendarCheck', title: 'Request a time that suits you', body: 'Send an appointment request in a few steps, without waiting on hold.' },
      { icon: 'MessageCircle', title: 'Talk to us on WhatsApp', body: 'Every page offers a one-tap message with your question already written.' },
      { icon: 'ShoppingBag', title: 'Order everyday essentials', body: 'Pick up home-care items from the same place you manage your visits.' },
    ],
  },
  { key: 'home.visit', heading: 'Visit or contact us', body: '', image: null, cta: null, cta2: null, steps: [], features: [], slides: [] },
];
const DEFAULT_BY_KEY = new Map(DEFAULT_SECTIONS.map((s) => [s.key, s]));

const cta = (label: string | null, href: string | null): Cta | null => (label && label.trim() && isSafeHref(href) ? { label: label.trim().slice(0, 60), href } : null);

/** The published sections in display order. The hero always comes first and is never missing. */
export function buildSections(rows: SectionRow[]): PageSection[] {
  const out: PageSection[] = [];
  for (const r of [...rows].sort((a, b) => a.sort_order - b.sort_order)) {
    const d = DEFAULT_BY_KEY.get(r.key as SectionKey);
    if (!d || out.some((s) => s.key === d.key)) continue;
    const items = Array.isArray(r.items) ? r.items : [];
    let image = d.image;
    if (safeImageUrl(r.image_url)) {
      const alt = optStr(r.image_alt, 200) || (d.image && d.image.src === r.image_url ? d.image.alt : '');
      image = { src: r.image_url, alt, width: 1600, height: 1000, ...(safeImageUrl(r.image_small_url) ? { smallSrc: r.image_small_url, smallWidth: 800 } : {}) };
    }
    out.push({
      key: d.key,
      heading: str(r.heading, d.heading, 200),
      body: optStr(r.body, 4000),
      image,
      cta: cta(r.cta_label, r.cta_href),
      cta2: cta(r.cta2_label, r.cta2_href),
      steps: d.key === 'home.appointment' ? items.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim().slice(0, 200)).slice(0, 5) : [],
      features:
        d.key === 'home.why'
          ? items.map(obj).map((f) => ({ icon: optStr(f.icon, 40), title: optStr(f.title, 80), body: optStr(f.body, 300) })).filter((f) => f.title).slice(0, 6)
          : [],
      slides: d.key === 'home.hero' ? buildSlides(items) : [],
    });
  }
  const hero = out.find((s) => s.key === 'home.hero') ?? DEFAULT_SECTIONS[0];
  return [hero, ...out.filter((s) => s.key !== 'home.hero')];
}

// ---------------------------------------------------------------- fetching
export interface SiteRows { settings: SettingRow[]; nav: NavRow[] }

export async function fetchSiteRows(signal?: AbortSignal): Promise<SiteRows> {
  const [settings, nav] = await Promise.all([
    rest<SettingRow[]>('sd_site_settings?select=key,value', signal),
    rest<NavRow[]>('sd_nav_links?select=location,label,href,new_tab,sort_order&published=eq.true&order=sort_order.asc', signal),
  ]);
  return { settings, nav };
}

export const fetchSectionRows = (signal?: AbortSignal) =>
  rest<SectionRow[]>('sd_page_sections?select=key,heading,body,image_url,image_small_url,image_alt,cta_label,cta_href,cta2_label,cta2_href,items,sort_order&published=eq.true&order=sort_order.asc', signal);

export async function fetchFacilities(signal?: AbortSignal): Promise<Facility[]> {
  const rows = await rest<FacilityRow[]>('sd_facilities?select=slug,name,description,image_url,image_small_url,image_alt,image_width,image_height&published=eq.true&order=sort_order.asc,name.asc', signal);
  return rows.map((f) => {
    const width = f.image_width && f.image_width > 0 ? f.image_width : 1200;
    const height = f.image_height && f.image_height > 0 ? f.image_height : 800;
    const image: ImageAsset = safeImageUrl(f.image_url)
      ? { src: f.image_url, alt: f.image_alt || f.name, width, height, ...(safeImageUrl(f.image_small_url) ? { smallSrc: f.image_small_url, smallWidth: Math.round(width / 2) } : {}) }
      : { src: '/images/illustrations/illustration-empty-catalogue.svg', alt: `${f.name} (photo coming soon)`, width: 480, height: 360 };
    return { slug: f.slug, name: f.name, description: f.description ?? '', image };
  });
}

export { sampleFacilities };
