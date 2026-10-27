// Links that come from the database (menus, buttons) are checked twice: when an
// admin saves them, and again before the website renders them.

// Browsers treat a backslash like "/", so "/" + backslash + "evil.example" would leave the site: backslashes and
// control characters are never allowed.
const UNSAFE_CHARS = /[\s\\\u0000-\u001f\u007f]/;

/** A site path ("/doctors", not "//elsewhere"), a secure web address, an email or a phone link. */
export const isSafeHref = (href: unknown): href is string => typeof href === 'string' && !UNSAFE_CHARS.test(href) && /^(\/(?!\/)|https:\/\/[^/]|mailto:.|tel:\+?[0-9])/.test(href);

export const isInternal = (href: string) => href.startsWith('/') && !href.startsWith('//') && !UNSAFE_CHARS.test(href);

/** Pages a menu or button can point to. */
export const SITE_PAGES: { path: string; label: string }[] = [
  { path: '/', label: 'Home' },
  { path: '/specialties', label: 'Specialties' },
  { path: '/doctors', label: 'Doctors' },
  { path: '/facilities', label: 'Facilities' },
  { path: '/appointment', label: 'Book an appointment' },
  { path: '/store', label: 'Store' },
  { path: '/cart', label: 'Cart' },
  { path: '/contact', label: 'Contact' },
];

const DETAIL = /^\/(specialties|doctors|store)\/[a-z0-9]+(-[a-z0-9]+)*$/;

/** Returns a problem to show the admin, or null when the link is fine. */
export function checkLink(raw: string, { webOnly = false }: { webOnly?: boolean } = {}): string | null {
  const href = raw.trim();
  if (!href) return 'Enter a link.';
  if (/\s/.test(href)) return 'A link cannot contain spaces.';
  if (UNSAFE_CHARS.test(href)) return 'A link cannot contain backslashes (\\) or hidden characters.';
  if (href.length > 500) return 'Keep the link under 500 characters.';
  if (webOnly) return /^https:\/\/[^/\s]+\.[^/\s]+/.test(href) ? null : 'Use a full web address starting with https://';
  if (href.startsWith('//')) return 'Start with a single / for a page on this website, or with https:// for another website.';
  if (href.startsWith('/')) {
    const path = href.split(/[?#]/)[0].replace(/\/$/, '') || '/';
    if (SITE_PAGES.some((p) => p.path === path) || DETAIL.test(path)) return null;
    return `There is no page at ${path} on this website. Choose a page from the list, or use a full https:// address.`;
  }
  if (href.startsWith('https://')) return /^https:\/\/[^/\s]+\.[^/\s]+/.test(href) ? null : 'Check the web address, for example https://example.com';
  if (href.startsWith('mailto:')) return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(href) ? null : 'Use mailto: followed by an email address.';
  if (href.startsWith('tel:')) return /^tel:\+?[0-9]{6,15}$/.test(href) ? null : 'Use tel: followed by the phone number, digits only.';
  if (href.startsWith('http://')) return 'Use a secure address starting with https://';
  return 'Start with / for a page on this website, or https:// for another website.';
}
