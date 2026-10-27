import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Doctor, Specialty } from '@/types';
import { careSource, fetchCare, sampleCare } from '@/services/care';

export type CareStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CareValue {
  status: CareStatus;
  error: string | null;
  specialties: Specialty[];
  doctors: Doctor[];
  specialtyBySlug: (slug: string) => Specialty | undefined;
  doctorBySlug: (slug: string) => Doctor | undefined;
  doctorsForSpecialty: (slug: string) => Doctor[];
  allLanguages: string[];
  reload: () => void;
  request: () => void;
}

const Ctx = createContext<CareValue | null>(null);

/** Specialties and doctors, loaded once per visit when a page needs them (always fresh on page load). */
export function CareProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: CareStatus; error: string | null; specialties: Specialty[]; doctors: Doctor[] }>(() =>
    careSource === 'sample' ? { status: 'ready', error: null, ...sampleCare } : { status: 'idle', error: null, specialties: [], doctors: [] },
  );
  const run = useRef(0);
  const started = useRef(false);

  const load = useCallback(() => {
    if (careSource === 'sample') return;
    const id = ++run.current;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    setState((s) => ({ ...s, status: 'loading', error: null }));
    fetchCare(ctrl.signal)
      .then((c) => id === run.current && setState({ status: 'ready', error: null, ...c }))
      .catch((e: Error) => id === run.current && setState({ status: 'error', error: e.name === 'AbortError' ? 'This took too long to load.' : e.message, specialties: [], doctors: [] }))
      .finally(() => clearTimeout(timer));
  }, []);

  const request = useCallback(() => {
    if (started.current || careSource === 'sample') return;
    started.current = true;
    load();
  }, [load]);

  const value = useMemo<CareValue>(() => {
    const sBy = new Map(state.specialties.map((s) => [s.slug, s]));
    const dBy = new Map(state.doctors.map((d) => [d.slug, d]));
    return {
      ...state,
      specialtyBySlug: (s) => sBy.get(s),
      doctorBySlug: (s) => dBy.get(s),
      doctorsForSpecialty: (s) => state.doctors.filter((d) => d.specialtySlug === s),
      allLanguages: Array.from(new Set(state.doctors.flatMap((d) => d.languages))).sort(),
      reload: load,
      request,
    };
  }, [state, load, request]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Pass true on pages that display specialties or doctors, so the data gets loaded. */
export function useCare(needed = false) {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCare must be used inside CareProvider');
  const { request } = v;
  useEffect(() => {
    if (needed) request();
  }, [needed, request]);
  return v;
}
