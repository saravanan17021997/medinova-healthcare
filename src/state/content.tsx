import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Facility } from '@/types';
import type { SiteConfig } from '@/config/site';
import { liveSite, setLiveSite } from '@/config/live';
import {
  DEFAULT_NAV, DEFAULT_SECTIONS, buildNav, buildSections, buildSite, contentSource, fetchFacilities, fetchSectionRows, fetchSiteRows, sampleFacilities,
  type NavRow, type PageSection, type SectionRow, type SettingRow, type SiteNav,
} from '@/services/content';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

// The last content this browser loaded is kept so a returning visitor sees the
// current phone number and menus straight away instead of the built-in ones.
// It is only a head start: fresh content is always loaded on each visit.
const CACHE_KEY = 'sd-content-v1';
interface Cached { settings?: SettingRow[]; nav?: NavRow[]; sections?: SectionRow[] }

function readCache(): Cached {
  if (contentSource !== 'database') return {};
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    return {
      settings: Array.isArray(c.settings) ? c.settings : undefined,
      nav: Array.isArray(c.nav) ? c.nav : undefined,
      sections: Array.isArray(c.sections) ? c.sections : undefined,
    };
  } catch {
    return {};
  }
}
function writeCache(patch: Cached) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...readCache(), ...patch }));
  } catch {
    /* private mode or storage full: the site still works without the cache */
  }
}

const cached = readCache();
const initialSite = cached.settings ? buildSite(cached.settings) : liveSite();
setLiveSite(initialSite);

interface ContentValue {
  site: SiteConfig;
  nav: SiteNav;
  siteStatus: LoadStatus;
  sections: PageSection[];
  sectionsStatus: LoadStatus;
  facilities: Facility[];
  facilitiesStatus: LoadStatus;
  facilitiesError: string | null;
  reloadFacilities: () => void;
  requestSections: () => void;
  requestFacilities: () => void;
}

const Ctx = createContext<ContentValue | null>(null);

const withTimeout = <T,>(run: (signal: AbortSignal) => Promise<T>) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  return run(ctrl.signal).finally(() => clearTimeout(timer));
};
const message = (e: Error) => (e.name === 'AbortError' ? 'This took too long to load.' : e.message);

export function ContentProvider({ children }: { children: ReactNode }) {
  const db = contentSource === 'database';
  const [siteState, setSiteState] = useState<{ site: SiteConfig; nav: SiteNav; status: LoadStatus }>(() => ({
    site: initialSite,
    nav: cached.nav ? buildNav(cached.nav) : DEFAULT_NAV,
    status: db ? 'loading' : 'ready',
  }));
  const [sec, setSec] = useState<{ list: PageSection[]; status: LoadStatus }>(() => ({
    list: cached.sections ? buildSections(cached.sections) : DEFAULT_SECTIONS,
    status: db ? 'idle' : 'ready',
  }));
  const [fac, setFac] = useState<{ list: Facility[]; status: LoadStatus; error: string | null }>(() =>
    db ? { list: [], status: 'idle', error: null } : { list: sampleFacilities, status: 'ready', error: null },
  );
  const started = useRef({ sections: false, facilities: false });
  const facRun = useRef(0);

  // Settings and menus appear on every page, so they load straight away.
  useEffect(() => {
    if (!db) return;
    let live = true;
    withTimeout(fetchSiteRows)
      .then((rows) => {
        if (!live) return;
        writeCache({ settings: rows.settings, nav: rows.nav });
        const site = buildSite(rows.settings);
        setLiveSite(site);
        setSiteState({ site, nav: buildNav(rows.nav), status: 'ready' });
      })
      // Keep showing the built-in (or last loaded) details rather than an empty header.
      .catch(() => live && setSiteState((s) => ({ ...s, status: 'error' })));
    return () => {
      live = false;
    };
  }, [db]);

  const requestSections = useCallback(() => {
    if (!db || started.current.sections) return;
    started.current.sections = true;
    setSec((s) => ({ ...s, status: 'loading' }));
    withTimeout(fetchSectionRows)
      .then((rows) => {
        writeCache({ sections: rows });
        setSec({ list: buildSections(rows), status: 'ready' });
      })
      .catch(() => setSec((s) => ({ ...s, status: 'error' })));
  }, [db]);

  const loadFacilities = useCallback(() => {
    if (!db) return;
    const id = ++facRun.current;
    setFac((f) => ({ ...f, status: 'loading', error: null }));
    withTimeout(fetchFacilities)
      .then((list) => id === facRun.current && setFac({ list, status: 'ready', error: null }))
      .catch((e: Error) => id === facRun.current && setFac({ list: [], status: 'error', error: message(e) }));
  }, [db]);

  const requestFacilities = useCallback(() => {
    if (!db || started.current.facilities) return;
    started.current.facilities = true;
    loadFacilities();
  }, [db, loadFacilities]);

  const value = useMemo<ContentValue>(
    () => ({
      site: siteState.site,
      nav: siteState.nav,
      siteStatus: siteState.status,
      sections: sec.list,
      sectionsStatus: sec.status,
      facilities: fac.list,
      facilitiesStatus: fac.status,
      facilitiesError: fac.error,
      reloadFacilities: loadFacilities,
      requestSections,
      requestFacilities,
    }),
    [siteState, sec, fac, loadFacilities, requestSections, requestFacilities],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useContent() {
  const v = useContext(Ctx);
  if (!v) throw new Error('Content hooks must be used inside ContentProvider');
  return v;
}

/** Site settings: name, contact details, hours, address, demo notices. */
export const useSite = () => useContent().site;
export const useNav = () => useContent().nav;

/** Homepage sections in display order (the hero first). */
export function useSections() {
  const v = useContent();
  const { requestSections } = v;
  useEffect(() => requestSections(), [requestSections]);
  return { sections: v.sections, status: v.sectionsStatus };
}

export function useFacilities(needed = true) {
  const v = useContent();
  const { requestFacilities } = v;
  useEffect(() => {
    if (needed) requestFacilities();
  }, [needed, requestFacilities]);
  return { facilities: v.facilities, status: v.facilitiesStatus, error: v.facilitiesError, reload: v.reloadFacilities };
}
