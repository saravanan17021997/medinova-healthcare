# MediNova photo prompts (optional upgrade)

Every image slot already has a **finished original illustration** (see [IMAGE_MANIFEST.md](IMAGE_MANIFEST.md)), so none of these prompts is needed for the site to work. Use them only if you want photographs instead, either as briefs for a photographer or as prompts for an image generator whose output you are licensed to use commercially.

**Rules for real photographs**
- People must be **your own staff or models with signed consent**. Do not present AI-generated people as real doctors. Fictional profiles stay labelled "Fictional demo profile".
- Never use images from other hospitals' websites, scraped galleries or watermarked stock.
- Keep the filename and dimensions shown, export WebP at about 80% quality, and also export the `-sm` variant at half width. Run `npm run build`: the image check will reject a file with the wrong size.

**Shared style:** Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.

**Shared negative prompt:** Avoid: blood, needles in skin, distressed patients, stethoscopes worn incorrectly, extra fingers, distorted hands or faces, fake text, recognisable real hospitals or brands, celebrity likeness.

## A. Hero (7), 1600×1000 (16:10)

Framing: Wide editorial photograph, 35 mm, eye level, generous negative space on the left for a headline.

### `images/hero/medinova-hero-healthcare-team.webp`
- **Used on:** Home page hero
- **Prompt:** Four healthcare professionals standing together in a bright atrium with arched windows, in a modern Indian clinic. Wide editorial photograph, 35 mm, eye level, generous negative space on the left for a headline. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Four healthcare professionals in a bright, modern clinic atrium

### `images/hero/doctor-patient-consultation.webp`
- **Used on:** Home appointment section; appointment page side panel
- **Prompt:** A doctor and a patient talking across a consultation desk, in a modern Indian clinic. Wide editorial photograph, 35 mm, eye level, generous negative space on the left for a headline. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A doctor talking with a patient across a consultation desk

### `images/hero/healthcare-professional.webp`
- **Used on:** Doctors directory page header
- **Prompt:** A smiling nurse in teal scrubs holding a tablet, in a modern Indian clinic. Wide editorial photograph, 35 mm, eye level, generous negative space on the left for a headline. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A smiling healthcare professional holding a tablet

### `images/hero/hospital-reception-welcome.webp`
- **Used on:** Home "why choose us" section; facilities page header
- **Prompt:** A receptionist greeting a parent and child at a reception desk, in a modern Indian clinic. Wide editorial photograph, 35 mm, eye level, generous negative space on the left for a headline. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A receptionist welcoming a parent and child at the front desk

### `images/hero/hospital-exterior.webp`
- **Used on:** Home location and contact section; contact page header
- **Prompt:** A modern clinic building with a glass facade, trees and an entrance canopy, in a modern Indian clinic. Wide editorial photograph, 35 mm, eye level, generous negative space on the left for a headline. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** The exterior of a modern clinic building with trees and a glass entrance

### `images/hero/healthcare-team-collaboration.webp`
- **Used on:** Specialties page header
- **Prompt:** A clinician presenting a chart on a wall screen to three seated colleagues, in a modern Indian clinic. Wide editorial photograph, 35 mm, eye level, generous negative space on the left for a headline. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A healthcare team reviewing charts together in a meeting room

### `images/hero/patient-appointment-booking.webp`
- **Used on:** Appointment page header
- **Prompt:** A person on a sofa choosing an appointment slot on a phone, with a calendar card beside them, in a modern Indian clinic. Wide editorial photograph, 35 mm, eye level, generous negative space on the left for a headline. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A person choosing an appointment time on their phone

## B. Specialties (10), 1200×900 (4:3)

Framing: Still-life or in-context photograph, 50 mm, centred subject, soft background.

### `images/specialties/specialty-general-medicine.webp`
- **Used on:** Specialty cards (home, specialties page) and specialty detail header
- **Prompt:** A doctor behind a desk with a stethoscope, notes and a thermometer. Still-life or in-context photograph, 50 mm, centred subject, soft background. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A general physician at a desk with a stethoscope and notes

### `images/specialties/specialty-cardiology.webp`
- **Used on:** Specialty cards (home, specialties page) and specialty detail header
- **Prompt:** An illustrated heart beside an ECG monitor. Still-life or in-context photograph, 50 mm, centred subject, soft background. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** An illustrated heart next to a heart-rhythm monitor

### `images/specialties/specialty-orthopaedics.webp`
- **Used on:** Specialty cards (home, specialties page) and specialty detail header
- **Prompt:** A knee X-ray on a lightbox, a knee model and a crutch. Still-life or in-context photograph, 50 mm, centred subject, soft background. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A knee X-ray on a lightbox beside a joint model and crutch

### `images/specialties/specialty-dermatology.webp`
- **Used on:** Specialty cards (home, specialties page) and specialty detail header
- **Prompt:** A cross-section of skin layers under a magnifying glass. Still-life or in-context photograph, 50 mm, centred subject, soft background. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Layers of skin under a magnifying glass

### `images/specialties/specialty-paediatrics.webp`
- **Used on:** Specialty cards (home, specialties page) and specialty detail header
- **Prompt:** A child at a height chart with a teddy bear and building blocks. Still-life or in-context photograph, 50 mm, centred subject, soft background. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A child beside a height chart, a teddy bear and toy blocks

### `images/specialties/specialty-neurology.webp`
- **Used on:** Specialty cards (home, specialties page) and specialty detail header
- **Prompt:** A brain illustration with a network of connected nodes and two scan screens. Still-life or in-context photograph, 50 mm, centred subject, soft background. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** An illustrated brain with connected nerve pathways

### `images/specialties/specialty-ophthalmology.webp`
- **Used on:** Specialty cards (home, specialties page) and specialty detail header
- **Prompt:** A letter eye-test chart, a large eye and a pair of glasses. Still-life or in-context photograph, 50 mm, centred subject, soft background. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** An eye-test chart, an illustrated eye and glasses

### `images/specialties/specialty-dentistry.webp`
- **Used on:** Specialty cards (home, specialties page) and specialty detail header
- **Prompt:** A friendly tooth model with a toothbrush and dental mirror. Still-life or in-context photograph, 50 mm, centred subject, soft background. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A tooth model with a toothbrush and dental mirror

### `images/specialties/specialty-gynaecology.webp`
- **Used on:** Specialty cards (home, specialties page) and specialty detail header
- **Prompt:** A doctor with a tablet beside an ultrasound unit and a calendar. Still-life or in-context photograph, 50 mm, centred subject, soft background. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A doctor beside an ultrasound unit in a women’s health clinic

### `images/specialties/specialty-diagnostics.webp`
- **Used on:** Specialty cards (home, specialties page) and specialty detail header
- **Prompt:** A microscope, sample tubes, petri dishes and a DNA helix. Still-life or in-context photograph, 50 mm, centred subject, soft background. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Laboratory equipment: a microscope, sample tubes and petri dishes

## C. Doctors (10), 800×1000 (4:5)

Framing: Head-and-shoulders portrait, 85 mm, plain light aqua backdrop, friendly direct gaze, subject centred with headroom.

### `images/doctors/doctor-arjun-mehta-demo.webp`
- **Used on:** Doctor cards (home, doctors directory, specialty pages) and doctor profile page
- **Prompt:** Portrait of a consenting staff member who practises general medicine, in a clean white coat or scrubs, with a warm, professional expression. Replace the fictional name "Arjun Mehta" with the real person's verified details at the same time. Head-and-shoulders portrait, 85 mm, plain light aqua backdrop, friendly direct gaze, subject centred with headroom. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Illustrated portrait of Arjun Mehta, a fictional demo profile

### `images/doctors/doctor-nisha-varghese-demo.webp`
- **Used on:** Doctor cards (home, doctors directory, specialty pages) and doctor profile page
- **Prompt:** Portrait of a consenting staff member who practises cardiology, in a clean white coat or scrubs, with a warm, professional expression. Replace the fictional name "Nisha Varghese" with the real person's verified details at the same time. Head-and-shoulders portrait, 85 mm, plain light aqua backdrop, friendly direct gaze, subject centred with headroom. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Illustrated portrait of Nisha Varghese, a fictional demo profile

### `images/doctors/doctor-rahul-iyer-demo.webp`
- **Used on:** Doctor cards (home, doctors directory, specialty pages) and doctor profile page
- **Prompt:** Portrait of a consenting staff member who practises orthopaedics, in a clean white coat or scrubs, with a warm, professional expression. Replace the fictional name "Rahul Iyer" with the real person's verified details at the same time. Head-and-shoulders portrait, 85 mm, plain light aqua backdrop, friendly direct gaze, subject centred with headroom. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Illustrated portrait of Rahul Iyer, a fictional demo profile

### `images/doctors/doctor-fatima-sheikh-demo.webp`
- **Used on:** Doctor cards (home, doctors directory, specialty pages) and doctor profile page
- **Prompt:** Portrait of a consenting staff member who practises dermatology, in a clean white coat or scrubs, with a warm, professional expression. Replace the fictional name "Fatima Sheikh" with the real person's verified details at the same time. Head-and-shoulders portrait, 85 mm, plain light aqua backdrop, friendly direct gaze, subject centred with headroom. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Illustrated portrait of Fatima Sheikh, a fictional demo profile

### `images/doctors/doctor-kavya-reddy-demo.webp`
- **Used on:** Doctor cards (home, doctors directory, specialty pages) and doctor profile page
- **Prompt:** Portrait of a consenting staff member who practises paediatrics, in a clean white coat or scrubs, with a warm, professional expression. Replace the fictional name "Kavya Reddy" with the real person's verified details at the same time. Head-and-shoulders portrait, 85 mm, plain light aqua backdrop, friendly direct gaze, subject centred with headroom. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Illustrated portrait of Kavya Reddy, a fictional demo profile

### `images/doctors/doctor-daniel-thomas-demo.webp`
- **Used on:** Doctor cards (home, doctors directory, specialty pages) and doctor profile page
- **Prompt:** Portrait of a consenting staff member who practises neurology, in a clean white coat or scrubs, with a warm, professional expression. Replace the fictional name "Daniel Thomas" with the real person's verified details at the same time. Head-and-shoulders portrait, 85 mm, plain light aqua backdrop, friendly direct gaze, subject centred with headroom. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Illustrated portrait of Daniel Thomas, a fictional demo profile

### `images/doctors/doctor-priya-nair-demo.webp`
- **Used on:** Doctor cards (home, doctors directory, specialty pages) and doctor profile page
- **Prompt:** Portrait of a consenting staff member who practises ophthalmology, in a clean white coat or scrubs, with a warm, professional expression. Replace the fictional name "Priya Nair" with the real person's verified details at the same time. Head-and-shoulders portrait, 85 mm, plain light aqua backdrop, friendly direct gaze, subject centred with headroom. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Illustrated portrait of Priya Nair, a fictional demo profile

### `images/doctors/doctor-vikram-singh-demo.webp`
- **Used on:** Doctor cards (home, doctors directory, specialty pages) and doctor profile page
- **Prompt:** Portrait of a consenting staff member who practises dentistry, in a clean white coat or scrubs, with a warm, professional expression. Replace the fictional name "Vikram Singh" with the real person's verified details at the same time. Head-and-shoulders portrait, 85 mm, plain light aqua backdrop, friendly direct gaze, subject centred with headroom. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Illustrated portrait of Vikram Singh, a fictional demo profile

### `images/doctors/doctor-anita-das-demo.webp`
- **Used on:** Doctor cards (home, doctors directory, specialty pages) and doctor profile page
- **Prompt:** Portrait of a consenting staff member who practises gynaecology, in a clean white coat or scrubs, with a warm, professional expression. Replace the fictional name "Anita Das" with the real person's verified details at the same time. Head-and-shoulders portrait, 85 mm, plain light aqua backdrop, friendly direct gaze, subject centred with headroom. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Illustrated portrait of Anita Das, a fictional demo profile

### `images/doctors/doctor-samuel-okafor-demo.webp`
- **Used on:** Doctor cards (home, doctors directory, specialty pages) and doctor profile page
- **Prompt:** Portrait of a consenting staff member who practises diagnostics and laboratory, in a clean white coat or scrubs, with a warm, professional expression. Replace the fictional name "Samuel Okafor" with the real person's verified details at the same time. Head-and-shoulders portrait, 85 mm, plain light aqua backdrop, friendly direct gaze, subject centred with headroom. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Illustrated portrait of Samuel Okafor, a fictional demo profile

## D. Facilities (8), 1200×800 (3:2)

Framing: Architectural interior photograph, 24 mm, verticals corrected, tidy and uncluttered.

### `images/facilities/reception-waiting-area.webp`
- **Used on:** Facilities page grid
- **Prompt:** A waiting area with seated visitors, a wall screen, plants and a water dispenser, in a modern Indian clinic. Architectural interior photograph, 24 mm, verticals corrected, tidy and uncluttered. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A calm waiting area with seated visitors

### `images/facilities/consultation-room.webp`
- **Used on:** Facilities page grid
- **Prompt:** An examination bed, privacy curtain, desk and computer, in a modern Indian clinic. Architectural interior photograph, 24 mm, verticals corrected, tidy and uncluttered. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A consultation room with an examination bed and desk

### `images/facilities/hospital-corridor.webp`
- **Used on:** Facilities page grid
- **Prompt:** A corridor in perspective with doors, handrails and staff, in a modern Indian clinic. Architectural interior photograph, 24 mm, verticals corrected, tidy and uncluttered. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A hospital corridor with doors and handrails

### `images/facilities/patient-room.webp`
- **Used on:** Facilities page grid
- **Prompt:** A patient resting in bed with a visitor, IV stand and vitals monitor, in a modern Indian clinic. Architectural interior photograph, 24 mm, verticals corrected, tidy and uncluttered. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A patient resting in a bed while a visitor sits nearby

### `images/facilities/laboratory.webp`
- **Used on:** Facilities page grid
- **Prompt:** A technician at a lab bench with a microscope, tubes and a centrifuge, in a modern Indian clinic. Architectural interior photograph, 24 mm, verticals corrected, tidy and uncluttered. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A laboratory technician working at a bench

### `images/facilities/diagnostic-imaging.webp`
- **Used on:** Facilities page grid
- **Prompt:** A scanner with a patient table and a technician with a tablet, in a modern Indian clinic. Architectural interior photograph, 24 mm, verticals corrected, tidy and uncluttered. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A diagnostic imaging scanner with a technician

### `images/facilities/medical-equipment.webp`
- **Used on:** Facilities page grid
- **Prompt:** A vitals monitor, infusion pumps, defibrillator trolley and ECG cart, in a modern Indian clinic. Architectural interior photograph, 24 mm, verticals corrected, tidy and uncluttered. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Medical equipment including a monitor, infusion pumps and a defibrillator

### `images/facilities/staff-at-work.webp`
- **Used on:** Facilities page grid
- **Prompt:** A nurse at a station computer talking with a doctor holding a clipboard, in a modern Indian clinic. Architectural interior photograph, 24 mm, verticals corrected, tidy and uncluttered. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** A nurse and a doctor working at a nurses’ station

## E. Products (36), 1000×1000 (1:1)

Framing: Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins.

### `images/products/product-digital-thermometer.webp`
- **Used on:** Product cards (home, store) and product page gallery
- **Prompt:** Digital Thermometer, on a display podium. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Digital Thermometer

### `images/products/product-digital-thermometer-detail.webp`
- **Used on:** Product page gallery
- **Prompt:** Digital Thermometer, close-up detail view. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Digital Thermometer, close-up

### `images/products/product-digital-thermometer-box.webp`
- **Used on:** Product page gallery
- **Prompt:** Digital Thermometer, shown with its demo packaging. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Digital Thermometer with its box

### `images/products/product-blood-pressure-monitor.webp`
- **Used on:** Product cards (home, store) and product page gallery
- **Prompt:** Digital Blood Pressure Monitor, on a display podium. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Digital Blood Pressure Monitor

### `images/products/product-blood-pressure-monitor-detail.webp`
- **Used on:** Product page gallery
- **Prompt:** Digital Blood Pressure Monitor, close-up detail view. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Digital Blood Pressure Monitor, close-up

### `images/products/product-blood-pressure-monitor-box.webp`
- **Used on:** Product page gallery
- **Prompt:** Digital Blood Pressure Monitor, shown with its demo packaging. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Digital Blood Pressure Monitor with its box

### `images/products/product-pulse-oximeter.webp`
- **Used on:** Product cards (home, store) and product page gallery
- **Prompt:** Fingertip Pulse Oximeter, on a display podium. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Fingertip Pulse Oximeter

### `images/products/product-pulse-oximeter-detail.webp`
- **Used on:** Product page gallery
- **Prompt:** Fingertip Pulse Oximeter, close-up detail view. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Fingertip Pulse Oximeter, close-up

### `images/products/product-pulse-oximeter-box.webp`
- **Used on:** Product page gallery
- **Prompt:** Fingertip Pulse Oximeter, shown with its demo packaging. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Fingertip Pulse Oximeter with its box

### `images/products/product-first-aid-kit.webp`
- **Used on:** Product cards (home, store) and product page gallery
- **Prompt:** First-Aid Kit, on a display podium. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** First-Aid Kit

### `images/products/product-first-aid-kit-detail.webp`
- **Used on:** Product page gallery
- **Prompt:** First-Aid Kit, close-up detail view. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** First-Aid Kit, close-up

### `images/products/product-first-aid-kit-box.webp`
- **Used on:** Product page gallery
- **Prompt:** First-Aid Kit, shown with its demo packaging. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** First-Aid Kit with its box

### `images/products/product-stethoscope.webp`
- **Used on:** Product cards (home, store) and product page gallery
- **Prompt:** Stethoscope, on a display podium. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Stethoscope

### `images/products/product-stethoscope-detail.webp`
- **Used on:** Product page gallery
- **Prompt:** Stethoscope, close-up detail view. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Stethoscope, close-up

### `images/products/product-stethoscope-box.webp`
- **Used on:** Product page gallery
- **Prompt:** Stethoscope, shown with its demo packaging. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Stethoscope with its box

### `images/products/product-examination-gloves.webp`
- **Used on:** Product cards (home, store) and product page gallery
- **Prompt:** Medical Examination Gloves (box of 100), on a display podium. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Medical Examination Gloves (box of 100)

### `images/products/product-examination-gloves-detail.webp`
- **Used on:** Product page gallery
- **Prompt:** Medical Examination Gloves (box of 100), close-up detail view. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Medical Examination Gloves (box of 100), close-up

### `images/products/product-examination-gloves-box.webp`
- **Used on:** Product page gallery
- **Prompt:** Medical Examination Gloves (box of 100), shown with its demo packaging. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Medical Examination Gloves (box of 100) with its box

### `images/products/product-surgical-face-masks.webp`
- **Used on:** Product cards (home, store) and product page gallery
- **Prompt:** Surgical Face Masks (pack of 50), on a display podium. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Surgical Face Masks (pack of 50)

### `images/products/product-surgical-face-masks-detail.webp`
- **Used on:** Product page gallery
- **Prompt:** Surgical Face Masks (pack of 50), close-up detail view. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Surgical Face Masks (pack of 50), close-up

### `images/products/product-surgical-face-masks-box.webp`
- **Used on:** Product page gallery
- **Prompt:** Surgical Face Masks (pack of 50), shown with its demo packaging. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Surgical Face Masks (pack of 50) with its box

### `images/products/product-digital-weighing-scale.webp`
- **Used on:** Product cards (home, store) and product page gallery
- **Prompt:** Digital Weighing Scale, on a display podium. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Digital Weighing Scale

### `images/products/product-digital-weighing-scale-detail.webp`
- **Used on:** Product page gallery
- **Prompt:** Digital Weighing Scale, close-up detail view. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Digital Weighing Scale, close-up

### `images/products/product-digital-weighing-scale-box.webp`
- **Used on:** Product page gallery
- **Prompt:** Digital Weighing Scale, shown with its demo packaging. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Digital Weighing Scale with its box

### `images/products/product-hot-cold-therapy-pack.webp`
- **Used on:** Product cards (home, store) and product page gallery
- **Prompt:** Reusable Hot and Cold Therapy Pack, on a display podium. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Reusable Hot and Cold Therapy Pack

### `images/products/product-hot-cold-therapy-pack-detail.webp`
- **Used on:** Product page gallery
- **Prompt:** Reusable Hot and Cold Therapy Pack, close-up detail view. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Reusable Hot and Cold Therapy Pack, close-up

### `images/products/product-hot-cold-therapy-pack-box.webp`
- **Used on:** Product page gallery
- **Prompt:** Reusable Hot and Cold Therapy Pack, shown with its demo packaging. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Reusable Hot and Cold Therapy Pack with its box

### `images/products/product-weekly-pill-organiser.webp`
- **Used on:** Product cards (home, store) and product page gallery
- **Prompt:** Weekly Pill Organiser, on a display podium. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Weekly Pill Organiser

### `images/products/product-weekly-pill-organiser-detail.webp`
- **Used on:** Product page gallery
- **Prompt:** Weekly Pill Organiser, close-up detail view. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Weekly Pill Organiser, close-up

### `images/products/product-weekly-pill-organiser-box.webp`
- **Used on:** Product page gallery
- **Prompt:** Weekly Pill Organiser, shown with its demo packaging. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Weekly Pill Organiser with its box

### `images/products/product-adjustable-walking-stick.webp`
- **Used on:** Product cards (home, store) and product page gallery
- **Prompt:** Adjustable Walking Stick, on a display podium. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Adjustable Walking Stick

### `images/products/product-adjustable-walking-stick-detail.webp`
- **Used on:** Product page gallery
- **Prompt:** Adjustable Walking Stick, close-up detail view. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Adjustable Walking Stick, close-up

### `images/products/product-adjustable-walking-stick-box.webp`
- **Used on:** Product page gallery
- **Prompt:** Adjustable Walking Stick, shown with its demo packaging. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Adjustable Walking Stick with its box

### `images/products/product-knee-support-sleeve.webp`
- **Used on:** Product cards (home, store) and product page gallery
- **Prompt:** Knee Support Sleeve, on a display podium. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Knee Support Sleeve

### `images/products/product-knee-support-sleeve-detail.webp`
- **Used on:** Product page gallery
- **Prompt:** Knee Support Sleeve, close-up detail view. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Knee Support Sleeve, close-up

### `images/products/product-knee-support-sleeve-box.webp`
- **Used on:** Product page gallery
- **Prompt:** Knee Support Sleeve, shown with its demo packaging. Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins. Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.
- **Alt text to keep:** Knee Support Sleeve with its box

## Illustrations, icons and branding

These are final vector artwork and are not meant to be replaced with photographs: the logo, favicon, app icons, share image, state illustrations and category icons.
