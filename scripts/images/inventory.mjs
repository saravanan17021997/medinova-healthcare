// The complete MediNova image inventory. One entry per asset.
// build.mjs renders every entry; manifest.mjs documents every entry;
// check-images.mjs verifies every path the app references exists on disk.
import * as heroes from './scenes/heroes.mjs';
import * as fac from './scenes/facilities.mjs';
import * as spec from './scenes/specialties.mjs';
import { portrait } from './scenes/doctors.mjs';
import { PRODUCTS, productImage } from './scenes/products.mjs';
import * as ill from './scenes/illustrations.mjs';
import * as brand from './scenes/branding.mjs';

const hero = (file, render, section, usage, description, alt) => ({ file: `images/hero/${file}.webp`, kind: 'webp', width: 1600, height: 1000, small: 800, section, usage, description, alt, render });
const facility = (file, render, description, alt) => ({ file: `images/facilities/${file}.webp`, kind: 'webp', width: 1200, height: 800, small: 600, section: 'D. Facilities', usage: 'Facilities page grid', description, alt, render });
const specialty = (slug, render, description, alt) => ({ file: `images/specialties/specialty-${slug}.webp`, kind: 'webp', width: 1200, height: 900, small: 600, section: 'B. Specialties', usage: 'Specialty cards (home, specialties page) and specialty detail header', description, alt, render });

export const DOCTORS = [
  ['arjun-mehta', 'Arjun Mehta', 'General medicine'],
  ['nisha-varghese', 'Nisha Varghese', 'Cardiology'],
  ['rahul-iyer', 'Rahul Iyer', 'Orthopaedics'],
  ['fatima-sheikh', 'Fatima Sheikh', 'Dermatology'],
  ['kavya-reddy', 'Kavya Reddy', 'Paediatrics'],
  ['daniel-thomas', 'Daniel Thomas', 'Neurology'],
  ['priya-nair', 'Priya Nair', 'Ophthalmology'],
  ['vikram-singh', 'Vikram Singh', 'Dentistry'],
  ['anita-das', 'Anita Das', 'Gynaecology'],
  ['samuel-okafor', 'Samuel Okafor', 'Diagnostics and laboratory'],
];

const VIEW_TEXT = {
  main: ['on a display podium', ''],
  detail: ['close-up detail view', ', close-up'],
  box: ['shown with its demo packaging', ' with its box'],
};

export const inventory = [
  // ---------------- A. hero and banner images
  hero('medinova-hero-healthcare-team', heroes.heroTeam, 'A. Hero', 'Home page hero', 'Four healthcare professionals standing together in a bright atrium with arched windows.', 'Four healthcare professionals in a bright, modern clinic atrium'),
  hero('doctor-patient-consultation', heroes.heroConsultation, 'A. Hero', 'Home appointment section; appointment page side panel', 'A doctor and a patient talking across a consultation desk.', 'A doctor talking with a patient across a consultation desk'),
  hero('healthcare-professional', heroes.heroProfessional, 'A. Hero', 'Doctors directory page header', 'A smiling nurse in teal scrubs holding a tablet.', 'A smiling healthcare professional holding a tablet'),
  hero('hospital-reception-welcome', heroes.heroReception, 'A. Hero', 'Home "why choose us" section; facilities page header', 'A receptionist greeting a parent and child at a reception desk.', 'A receptionist welcoming a parent and child at the front desk'),
  hero('hospital-exterior', heroes.heroExterior, 'A. Hero', 'Home location and contact section; contact page header', 'A modern clinic building with a glass facade, trees and an entrance canopy.', 'The exterior of a modern clinic building with trees and a glass entrance'),
  hero('healthcare-team-collaboration', heroes.heroCollaboration, 'A. Hero', 'Specialties page header', 'A clinician presenting a chart on a wall screen to three seated colleagues.', 'A healthcare team reviewing charts together in a meeting room'),
  hero('patient-appointment-booking', heroes.heroAppointment, 'A. Hero', 'Appointment page header', 'A person on a sofa choosing an appointment slot on a phone, with a calendar card beside them.', 'A person choosing an appointment time on their phone'),

  // ---------------- B. specialties
  specialty('general-medicine', spec.generalMedicine, 'A doctor behind a desk with a stethoscope, notes and a thermometer.', 'A general physician at a desk with a stethoscope and notes'),
  specialty('cardiology', spec.cardiology, 'An illustrated heart beside an ECG monitor.', 'An illustrated heart next to a heart-rhythm monitor'),
  specialty('orthopaedics', spec.orthopaedics, 'A knee X-ray on a lightbox, a knee model and a crutch.', 'A knee X-ray on a lightbox beside a joint model and crutch'),
  specialty('dermatology', spec.dermatology, 'A cross-section of skin layers under a magnifying glass.', 'Layers of skin under a magnifying glass'),
  specialty('paediatrics', spec.paediatrics, 'A child at a height chart with a teddy bear and building blocks.', 'A child beside a height chart, a teddy bear and toy blocks'),
  specialty('neurology', spec.neurology, 'A brain illustration with a network of connected nodes and two scan screens.', 'An illustrated brain with connected nerve pathways'),
  specialty('ophthalmology', spec.ophthalmology, 'A letter eye-test chart, a large eye and a pair of glasses.', 'An eye-test chart, an illustrated eye and glasses'),
  specialty('dentistry', spec.dentistry, 'A friendly tooth model with a toothbrush and dental mirror.', 'A tooth model with a toothbrush and dental mirror'),
  specialty('gynaecology', spec.gynaecology, "A doctor with a tablet beside an ultrasound unit and a calendar.", 'A doctor beside an ultrasound unit in a women’s health clinic'),
  specialty('diagnostics', spec.diagnostics, 'A microscope, sample tubes, petri dishes and a DNA helix.', 'Laboratory equipment: a microscope, sample tubes and petri dishes'),

  // ---------------- C. doctors (fictional demo profiles)
  ...DOCTORS.map(([slug, name, field]) => ({
    file: `images/doctors/doctor-${slug}-demo.webp`,
    kind: 'webp',
    width: 800,
    height: 1000,
    small: 400,
    section: 'C. Doctors',
    usage: 'Doctor cards (home, doctors directory, specialty pages) and doctor profile page',
    description: `Portrait illustration for the fictional demo profile "${name}" (${field}).`,
    alt: `Illustrated portrait of ${name}, a fictional demo profile`,
    render: () => portrait(slug),
  })),

  // ---------------- D. facilities
  facility('reception-waiting-area', fac.receptionWaiting, 'A waiting area with seated visitors, a wall screen, plants and a water dispenser.', 'A calm waiting area with seated visitors'),
  facility('consultation-room', fac.consultationRoom, 'An examination bed, privacy curtain, desk and computer.', 'A consultation room with an examination bed and desk'),
  facility('hospital-corridor', fac.corridor, 'A corridor in perspective with doors, handrails and staff.', 'A hospital corridor with doors and handrails'),
  facility('patient-room', fac.patientRoom, 'A patient resting in bed with a visitor, IV stand and vitals monitor.', 'A patient resting in a bed while a visitor sits nearby'),
  facility('laboratory', fac.laboratory, 'A technician at a lab bench with a microscope, tubes and a centrifuge.', 'A laboratory technician working at a bench'),
  facility('diagnostic-imaging', fac.diagnosticImaging, 'A scanner with a patient table and a technician with a tablet.', 'A diagnostic imaging scanner with a technician'),
  facility('medical-equipment', fac.medicalEquipment, 'A vitals monitor, infusion pumps, defibrillator trolley and ECG cart.', 'Medical equipment including a monitor, infusion pumps and a defibrillator'),
  facility('staff-at-work', fac.staffAtWork, 'A nurse at a station computer talking with a doctor holding a clipboard.', 'A nurse and a doctor working at a nurses’ station'),

  // ---------------- E. products (3 gallery views each)
  ...Object.entries(PRODUCTS).flatMap(([slug, p]) =>
    ['main', 'detail', 'box'].map((view) => ({
      file: `images/products/product-${slug}${view === 'main' ? '' : '-' + view}.webp`,
      kind: 'webp',
      width: 1000,
      height: 1000,
      small: 500,
      section: 'E. Products',
      usage: view === 'main' ? 'Product cards (home, store) and product page gallery' : 'Product page gallery',
      description: `${p.name}, ${VIEW_TEXT[view][0]}.`,
      alt: `${p.name}${VIEW_TEXT[view][1]}`,
      productSlug: slug,
      productView: view,
      render: (bbox) => productImage(slug, view, bbox),
    })),
  ),

  // ---------------- F. illustrations (SVG)
  ...[
    ['appointment', ill.appointment, 'Appointment page confirmation state; home appointment section', 'Calendar with a confirmed slot and a clock.', 'Calendar with a confirmed appointment slot', false],
    ['contact', ill.contact, 'Contact page message panel', 'Chat bubbles and a phone handset.', 'Chat bubbles and a phone', false],
    ['location', ill.location, 'Contact page and home location panel (map placeholder until a verified address is set)', 'A folded map with a dotted route to a pin.', 'A map with a route to a location pin', false],
    ['empty-cart', ill.emptyCart, 'Cart page when empty', 'An empty shopping cart.', '', true],
    ['empty-search', ill.emptySearch, 'Doctors, specialties and store searches with no results', 'A magnifying glass over an empty list.', '', true],
    ['empty-catalogue', ill.emptyCatalogue, 'Store category with no products', 'Empty shelves with dashed outlines.', '', true],
    ['error', ill.error, 'Not-found page and image error fallback', 'A two-way signpost.', '', true],
    ['order-placed', ill.orderPlaced, 'Simulated order confirmation page', 'A parcel with a check mark.', '', true],
  ].map(([n, render, usage, description, alt, decorative]) => ({ file: `images/illustrations/illustration-${n}.svg`, kind: 'svg', width: 480, height: 360, section: 'F. Illustrations', usage, description, alt, decorative, render })),

  // ---------------- F. category icons
  ...[
    ['monitoring', 'Monitoring devices'],
    ['first-aid', 'First aid and care'],
    ['protective', 'Protective supplies'],
    ['diagnostic', 'Diagnostic tools'],
    ['storage', 'Storage and daily living'],
    ['mobility', 'Mobility and support'],
  ].map(([n, label]) => ({ file: `images/icons/category-${n}.svg`, kind: 'svg', width: 64, height: 64, section: 'F. Category icons', usage: 'Store category navigation and home product section', description: `Category icon: ${label}.`, alt: '', decorative: true, render: ill.categoryIcons[n] })),

  // ---------------- F. branding
  { file: 'images/branding/medinova-logo.svg', kind: 'svg', section: 'F. Branding', usage: 'Header logo', description: 'Horizontal logo: arched-doorway mark with a cross and connected node, MediNova wordmark (outlined).', alt: 'MediNova Healthcare', render: brand.logo },
  { file: 'images/branding/medinova-logo-white.svg', kind: 'svg', section: 'F. Branding', usage: 'Footer logo on navy', description: 'Reversed logo for dark backgrounds.', alt: 'MediNova Healthcare', render: brand.logoWhite },
  { file: 'images/branding/medinova-mark.svg', kind: 'svg', width: 64, height: 64, section: 'F. Branding', usage: 'Compact logo (mobile menu, packaging)', description: 'Logo mark only.', alt: 'MediNova', render: brand.logoMark },
  { file: 'favicon.svg', kind: 'svg', width: 64, height: 64, section: 'F. Branding', usage: 'Browser tab icon', description: 'Favicon: logo mark on a navy tile.', alt: '', decorative: true, render: brand.favicon },
  { file: 'favicon-32.png', kind: 'png', width: 32, height: 32, section: 'F. Branding', usage: 'Fallback browser tab icon', description: 'PNG favicon.', alt: '', decorative: true, render: brand.favicon },
  { file: 'apple-touch-icon.png', kind: 'png', width: 180, height: 180, section: 'F. Branding', usage: 'iOS home-screen icon', description: 'Apple touch icon.', alt: '', decorative: true, render: brand.appIcon },
  { file: 'icons/icon-192.png', kind: 'png', width: 192, height: 192, section: 'F. Branding', usage: 'Web app manifest icon', description: 'App icon 192 px.', alt: '', decorative: true, render: brand.appIcon },
  { file: 'icons/icon-512.png', kind: 'png', width: 512, height: 512, section: 'F. Branding', usage: 'Web app manifest icon', description: 'App icon 512 px.', alt: '', decorative: true, render: brand.appIcon },
  {
    file: 'og-image.png',
    kind: 'png',
    width: 1200,
    height: 630,
    section: 'F. Branding',
    usage: 'Open Graph / Twitter link preview',
    description: 'Navy share card with the logo, tagline, a "Demonstration website" label and the hero illustration in an arch.',
    alt: 'MediNova Healthcare: Better Care. Connected Healthcare.',
    render: () => brand.ogImage(heroes.heroTeam().replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')),
  },
];
