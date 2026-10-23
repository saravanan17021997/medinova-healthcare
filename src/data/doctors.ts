import type { Doctor } from '@/types';
import { img } from './img';

// FICTIONAL DEMO PROFILES. These are not real people or licensed practitioners.
// Names deliberately carry no titles or qualifications. Replace every profile
// with a clinician's verified name, registration and biography before going live.
const p = (slug: string, name: string) => img(`/images/doctors/doctor-${slug}-demo.webp`, `Illustrated portrait of ${name}, a fictional demo profile`, 800, 1000, 400);

export const doctors: Doctor[] = [
  { slug: 'arjun-mehta', name: 'Arjun Mehta', specialtySlug: 'general-medicine', role: 'General physician', languages: ['English', 'Hindi'], availability: ['Mon', 'Wed', 'Fri'], modes: ['In person', 'Video'], focus: ['Routine check-ups', 'Long-term conditions'], image: p('arjun-mehta', 'Arjun Mehta') },
  { slug: 'nisha-varghese', name: 'Nisha Varghese', specialtySlug: 'cardiology', role: 'Cardiology consultant', languages: ['English', 'Malayalam'], availability: ['Tue', 'Thu'], modes: ['In person'], focus: ['Heart rhythm', 'Blood pressure follow-up'], image: p('nisha-varghese', 'Nisha Varghese') },
  { slug: 'rahul-iyer', name: 'Rahul Iyer', specialtySlug: 'orthopaedics', role: 'Orthopaedic consultant', languages: ['English', 'Tamil'], availability: ['Mon', 'Tue', 'Sat'], modes: ['In person'], focus: ['Sports injuries', 'Knee and shoulder'], image: p('rahul-iyer', 'Rahul Iyer') },
  { slug: 'fatima-sheikh', name: 'Fatima Sheikh', specialtySlug: 'dermatology', role: 'Dermatology consultant', languages: ['English', 'Urdu', 'Hindi'], availability: ['Wed', 'Thu', 'Sat'], modes: ['In person', 'Video'], focus: ['Skin conditions', 'Hair and nails'], image: p('fatima-sheikh', 'Fatima Sheikh') },
  { slug: 'kavya-reddy', name: 'Kavya Reddy', specialtySlug: 'paediatrics', role: 'Paediatric consultant', languages: ['English', 'Telugu'], availability: ['Mon', 'Thu', 'Fri'], modes: ['In person', 'Video'], focus: ['Child development', 'Childhood illness'], image: p('kavya-reddy', 'Kavya Reddy') },
  { slug: 'daniel-thomas', name: 'Daniel Thomas', specialtySlug: 'neurology', role: 'Neurology consultant', languages: ['English'], availability: ['Tue', 'Fri'], modes: ['In person'], focus: ['Headache', 'Nerve conditions'], image: p('daniel-thomas', 'Daniel Thomas') },
  { slug: 'priya-nair', name: 'Priya Nair', specialtySlug: 'ophthalmology', role: 'Ophthalmology consultant', languages: ['English', 'Malayalam', 'Tamil'], availability: ['Mon', 'Wed'], modes: ['In person'], focus: ['Vision changes', 'Eye examinations'], image: p('priya-nair', 'Priya Nair') },
  { slug: 'vikram-singh', name: 'Vikram Singh', specialtySlug: 'dentistry', role: 'Dental surgeon', languages: ['English', 'Hindi', 'Punjabi'], availability: ['Tue', 'Wed', 'Sat'], modes: ['In person'], focus: ['Check-ups', 'Gum care'], image: p('vikram-singh', 'Vikram Singh') },
  { slug: 'anita-das', name: 'Anita Das', specialtySlug: 'gynaecology', role: 'Gynaecology consultant', languages: ['English', 'Bengali', 'Hindi'], availability: ['Mon', 'Thu'], modes: ['In person', 'Video'], focus: ['Routine screening', 'Menopause support'], image: p('anita-das', 'Anita Das') },
  { slug: 'samuel-okafor', name: 'Samuel Okafor', specialtySlug: 'diagnostics', role: 'Laboratory medicine lead', languages: ['English'], availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], modes: ['In person'], focus: ['Laboratory tests', 'Results reviews'], image: p('samuel-okafor', 'Samuel Okafor') },
];

export const doctorBySlug = (slug: string) => doctors.find((d) => d.slug === slug);
export const doctorsForSpecialty = (slug: string) => doctors.filter((d) => d.specialtySlug === slug);
export const allLanguages = Array.from(new Set(doctors.flatMap((d) => d.languages))).sort();
