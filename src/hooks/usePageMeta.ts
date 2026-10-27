import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from '@/state/content';

interface Meta {
  title: string;
  description: string;
  /** Path under /public for the share image (defaults to /og-image.png). */
  image?: string;
}

const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

/** Sets the document title, description, canonical link and Open Graph tags for a page. */
export function usePageMeta({ title, description, image = '/og-image.png' }: Meta) {
  const { pathname } = useLocation();
  const site = useSite();
  useEffect(() => {
    const full = title === site.name ? `${site.name} | ${site.tagline}` : `${title} | ${site.name}`;
    document.title = full;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', full);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:image"]', 'property', 'og:image', `${site.url}${image}`);
    setMeta('meta[property="og:url"]', 'property', 'og:url', `${site.url}${pathname}`);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = `${site.url || window.location.origin}${pathname}`;
  }, [title, description, image, pathname, site]);
}
