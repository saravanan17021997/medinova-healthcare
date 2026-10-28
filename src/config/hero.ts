// The small extras around the homepage hero: the badge above the headline, the
// glass cards floating around the image, and the row of figures underneath.
// Admins edit them in Admin -> Homepage -> Hero highlights; they are saved in
// sd_site_settings under the key "home_hero". Until then these defaults apply.
//
// Figures are never made up: by default each one counts what the website
// actually publishes. An admin can replace one with their own figure.

/** Where a figure comes from: a live count of what is published, or a figure the admin typed. */
export type StatSource = 'specialties' | 'doctors' | 'facilities' | 'products' | 'custom';
export const STAT_SOURCES: StatSource[] = ['specialties', 'doctors', 'facilities', 'products', 'custom'];

export interface HeroHighlight { icon: string; text: string }
export interface HeroStat { icon: string; source: StatSource; value: string; label: string }
export interface HeroExtras { badge: string; highlights: HeroHighlight[]; stats: HeroStat[] }

export const HERO_LIMITS = { badge: 40, highlight: 40, value: 12, label: 40, highlights: 4, stats: 4 } as const;

export const DEFAULT_HERO_EXTRAS: HeroExtras = {
  badge: 'Trusted Healthcare Partner',
  highlights: [
    { icon: 'Users', text: 'Experienced Doctors' },
    { icon: 'HeartHandshake', text: 'Quality Care' },
    { icon: 'ShieldCheck', text: 'Safe & Secure Environment' },
    { icon: 'Building2', text: 'Modern Facilities' },
  ],
  stats: [
    { icon: 'Stethoscope', source: 'specialties', value: '', label: 'Specialties' },
    { icon: 'Users', source: 'doctors', value: '', label: 'Doctor profiles' },
    { icon: 'Building2', source: 'facilities', value: '', label: 'Facilities' },
    { icon: 'ShoppingBag', source: 'products', value: '', label: 'Health essentials' },
  ],
};

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const icon = (v: unknown, fallback: string) => (typeof v === 'string' && /^[A-Za-z0-9]{1,40}$/.test(v) ? v : fallback);

/** Reads the saved value, keeping only well-formed parts. A missing value gives the defaults. */
export function buildHeroExtras(raw: unknown): HeroExtras {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return DEFAULT_HERO_EXTRAS;
  const r = raw as Record<string, unknown>;
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object' && !Array.isArray(x)) : []);
  return {
    badge: text(r.badge, HERO_LIMITS.badge),
    highlights: list(r.highlights)
      .map((h) => ({ icon: icon(h.icon, 'HeartPulse'), text: text(h.text, HERO_LIMITS.highlight) }))
      .filter((h) => h.text)
      .slice(0, HERO_LIMITS.highlights),
    stats: list(r.stats)
      .map((s) => {
        const source = STAT_SOURCES.includes(s.source as StatSource) ? (s.source as StatSource) : 'custom';
        return { icon: icon(s.icon, 'HeartPulse'), source, value: source === 'custom' ? text(s.value, HERO_LIMITS.value) : '', label: text(s.label, HERO_LIMITS.label) };
      })
      .filter((s) => s.label && (s.source !== 'custom' || s.value))
      .slice(0, HERO_LIMITS.stats),
  };
}
