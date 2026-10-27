import type { Doctor, ImageAsset, Specialty } from '@/types';
import { SUPABASE_KEY, SUPABASE_URL, supabaseReady } from '@/lib/supabaseConfig';
import { specialties as sampleSpecialties } from '@/data/specialties';
import { doctors as sampleDoctors } from '@/data/doctors';
import { submitEnquiry } from './enquiry';
import { integrations } from '@/integrations';

// Specialties and doctor profiles for the public site, read from Supabase with
// the publishable key. Row Level Security only returns PUBLISHED rows. A doctor
// whose specialty is hidden (or missing) is not shown either.
// Without Supabase settings the built-in sample data is used.

export type CareSource = 'database' | 'sample';
export const careSource: CareSource = supabaseReady ? 'database' : 'sample';
export const sampleCare = { specialties: sampleSpecialties, doctors: sampleDoctors.map((d) => ({ ...d, isDemo: true })) };

interface SpecialtyRow {
  id: string; slug: string; name: string; summary: string | null; description: string | null; reasons: string[] | null; icon: string | null;
  image_url: string | null; image_small_url: string | null; image_alt: string | null; image_width: number | null; image_height: number | null;
}
interface DoctorRow {
  id: string; slug: string; name: string; specialty_id: string | null; role: string | null; qualifications: string | null; registration_no: string | null; bio: string | null;
  languages: string[] | null; availability: string[] | null; modes: string[] | null; focus: string[] | null;
  photo_url: string | null; photo_small_url: string | null; photo_alt: string | null; photo_width: number | null; photo_height: number | null; is_demo: boolean;
}

async function rest<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_KEY, Accept: 'application/json' }, signal });
  if (!res.ok) throw new Error(`This information could not be loaded (error ${res.status}).`);
  return res.json() as Promise<T>;
}

function image(url: string | null, small: string | null, alt: string, w: number | null, h: number | null, fallback: ImageAsset): ImageAsset {
  if (!url) return fallback;
  const width = w && w > 0 ? w : fallback.width;
  const height = h && h > 0 ? h : fallback.height;
  return { src: url, alt, width, height, ...(small ? { smallSrc: small, smallWidth: Math.round(width / 2) } : {}) };
}

export async function fetchCare(signal?: AbortSignal): Promise<{ specialties: Specialty[]; doctors: Doctor[] }> {
  const [sRows, dRows] = await Promise.all([
    rest<SpecialtyRow[]>('sd_specialties?select=id,slug,name,summary,description,reasons,icon,image_url,image_small_url,image_alt,image_width,image_height&published=eq.true&order=sort_order.asc,name.asc', signal),
    rest<DoctorRow[]>(
      'sd_doctors?select=id,slug,name,specialty_id,role,qualifications,registration_no,bio,languages,availability,modes,focus,photo_url,photo_small_url,photo_alt,photo_width,photo_height,is_demo&published=eq.true&order=sort_order.asc,name.asc',
      signal,
    ),
  ]);
  const slugById = new Map(sRows.map((s) => [s.id, s.slug]));
  const specialties: Specialty[] = sRows.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    summary: s.summary ?? '',
    description: s.description ?? '',
    reasons: s.reasons ?? [],
    icon: s.icon ?? 'Stethoscope',
    image: image(s.image_url, s.image_small_url, s.image_alt || s.name, s.image_width, s.image_height, { src: '/images/illustrations/illustration-empty-catalogue.svg', alt: s.name, width: 480, height: 360 }),
  }));
  const doctors: Doctor[] = dRows
    .filter((d) => d.specialty_id && slugById.has(d.specialty_id))
    .map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      specialtySlug: slugById.get(d.specialty_id!)!,
      role: d.role ?? '',
      languages: d.languages ?? [],
      availability: d.availability ?? [],
      modes: (d.modes ?? []) as Doctor['modes'],
      focus: d.focus ?? [],
      qualifications: d.qualifications,
      registrationNo: d.registration_no,
      bio: d.bio,
      isDemo: d.is_demo,
      image: image(d.photo_url, d.photo_small_url, d.photo_alt || `Photo of ${d.name}`, d.photo_width, d.photo_height, { src: '/images/illustrations/illustration-contact.svg', alt: `${d.name} (photo coming soon)`, width: 480, height: 360 }),
    }));
  return { specialties, doctors };
}

export interface AppointmentInput {
  name: string; phone: string; email: string; specialty: string; doctor: string; date: string; time: string; message: string;
}
export type AppointmentResult = { mode: 'saved'; reference: string } | { mode: 'demo' | 'sent'; reference?: string } | { mode: 'error'; message: string };

/**
 * Database mode: saves the request through the database function
 * sd_submit_appointment, which re-checks every field. Visitors can never read
 * requests back. Sample mode keeps the earlier demo / webhook behaviour.
 */
export async function requestAppointment(f: AppointmentInput): Promise<AppointmentResult> {
  if (careSource === 'sample') {
    const r = await submitEnquiry('appointment', { ...f });
    return r.mode === 'error' ? r : r.mode === 'sent' ? { mode: 'sent', reference: r.reference } : { mode: 'demo' };
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sd_submit_appointment`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        p_name: f.name,
        p_phone: f.phone,
        p_specialty_slug: f.specialty,
        p_time_of_day: f.time,
        p_email: f.email || null,
        p_doctor_slug: f.doctor || null,
        p_preferred_date: f.date || null,
        p_notes: f.message || null,
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { mode: 'error', message: (body && typeof body.message === 'string' && body.message) || `The request could not be sent (error ${res.status}). Try again, or call or message us.` };
    // also notify n8n / Power Automate when that integration is switched on
    if (integrations.enquiries.enabled) submitEnquiry('appointment', { ...f, reference: body }).catch(() => undefined);
    return { mode: 'saved', reference: String(body) };
  } catch {
    return { mode: 'error', message: 'The request could not be sent because the connection failed. Check your internet connection, or call or message us.' };
  }
}
