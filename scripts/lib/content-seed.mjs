// Generated from supabase/02_sd_seed.sql: the site content the database starts with.
export const contentSeed = {
  "settings": [
    {
      "key": "brand",
      "value": {
        "name": "SaraDev Healthcare",
        "tagline": "Better Care. Connected Healthcare.",
        "shortName": "SaraDev",
        "demoNotice": "This is a demonstration website. Doctors, products and prices are fictional: no real appointments, orders or medical services."
      }
    },
    {
      "key": "contact",
      "value": {
        "email": "hello@example.com",
        "phoneHref": "8668026319",
        "phoneDisplay": "8668026319",
        "whatsappNumber": ""
      }
    },
    {
      "key": "features",
      "value": {
        "testimonials": false
      }
    },
    {
      "key": "footer",
      "value": {
        "credit": "Illustrations are original artwork created for this demo."
      }
    },
    {
      "key": "hours",
      "value": [
        {
          "days": "Monday to Friday",
          "time": "8:00 am to 8:00 pm"
        },
        {
          "days": "Saturday",
          "time": "9:00 am to 2:00 pm"
        },
        {
          "days": "Sunday",
          "time": "Closed"
        }
      ]
    },
    {
      "key": "location",
      "value": {
        "name": "SaraDev demo clinic",
        "verified": false,
        "mapsQuery": "",
        "addressLines": [
          "Your clinic address goes here",
          "City, State, PIN code"
        ]
      }
    },
    {
      "key": "social",
      "value": []
    }
  ],
  "nav": [
    {
      "location": "header",
      "label": "Specialties",
      "href": "/specialties",
      "new_tab": false,
      "sort_order": 1,
      "published": true
    },
    {
      "location": "header",
      "label": "Doctors",
      "href": "/doctors",
      "new_tab": false,
      "sort_order": 2,
      "published": true
    },
    {
      "location": "header",
      "label": "Facilities",
      "href": "/facilities",
      "new_tab": false,
      "sort_order": 3,
      "published": true
    },
    {
      "location": "header",
      "label": "Store",
      "href": "/store",
      "new_tab": false,
      "sort_order": 4,
      "published": true
    },
    {
      "location": "header",
      "label": "Contact",
      "href": "/contact",
      "new_tab": false,
      "sort_order": 5,
      "published": true
    },
    {
      "location": "footer_explore",
      "label": "Find a doctor",
      "href": "/doctors",
      "new_tab": false,
      "sort_order": 6,
      "published": true
    },
    {
      "location": "footer_explore",
      "label": "Book an appointment",
      "href": "/appointment",
      "new_tab": false,
      "sort_order": 7,
      "published": true
    },
    {
      "location": "footer_explore",
      "label": "Facilities",
      "href": "/facilities",
      "new_tab": false,
      "sort_order": 8,
      "published": true
    },
    {
      "location": "footer_explore",
      "label": "Health essentials",
      "href": "/store",
      "new_tab": false,
      "sort_order": 9,
      "published": true
    },
    {
      "location": "footer_explore",
      "label": "Contact us",
      "href": "/contact",
      "new_tab": false,
      "sort_order": 10,
      "published": true
    }
  ],
  "sections": [
    {
      "key": "home.hero",
      "heading": "Healthcare that puts you first",
      "body": "Explore healthcare services, discover medical professionals, request appointments, and browse healthcare essentials in one convenient digital experience.",
      "image_url": "/images/hero/medinova-hero-healthcare-team.webp",
      "image_small_url": "/images/hero/medinova-hero-healthcare-team-sm.webp",
      "image_alt": "",
      "cta_label": "Book an appointment",
      "cta_href": "/appointment",
      "cta2_label": "Explore services",
      "cta2_href": "/specialties",
      "items": [],
      "sort_order": 1,
      "published": true
    },
    {
      "key": "home.specialties",
      "heading": "Find the right specialty",
      "body": "Start with what you need help with. Each specialty page explains what to expect and who you can see.",
      "image_url": null,
      "image_small_url": null,
      "image_alt": "",
      "cta_label": null,
      "cta_href": null,
      "cta2_label": null,
      "cta2_href": null,
      "items": [],
      "sort_order": 2,
      "published": true
    },
    {
      "key": "home.appointment",
      "heading": "Request an appointment in three steps",
      "body": "",
      "image_url": "/images/hero/doctor-patient-consultation.webp",
      "image_small_url": "/images/hero/doctor-patient-consultation-sm.webp",
      "image_alt": "",
      "cta_label": "Book an appointment",
      "cta_href": "/appointment",
      "cta2_label": null,
      "cta2_href": null,
      "items": [
        "Choose a specialty, and a doctor if you have one in mind.",
        "Pick a day and a time of day that suits you.",
        "The team calls you back to confirm a slot."
      ],
      "sort_order": 3,
      "published": true
    },
    {
      "key": "home.team",
      "heading": "Meet the care team",
      "body": "Browse profiles by specialty, language and the days each person is available.",
      "image_url": null,
      "image_small_url": null,
      "image_alt": "",
      "cta_label": null,
      "cta_href": null,
      "cta2_label": null,
      "cta2_href": null,
      "items": [],
      "sort_order": 4,
      "published": true
    },
    {
      "key": "home.essentials",
      "heading": "Everyday health essentials",
      "body": "A sample catalogue of home-care items. Prices are illustrative and orders are simulated.",
      "image_url": null,
      "image_small_url": null,
      "image_alt": "",
      "cta_label": null,
      "cta_href": null,
      "cta2_label": null,
      "cta2_href": null,
      "items": [],
      "sort_order": 5,
      "published": true
    },
    {
      "key": "home.why",
      "heading": "Why people choose SaraDev",
      "body": "Everything you need before, between and after visits, in one place.",
      "image_url": "/images/hero/hospital-reception-welcome.webp",
      "image_small_url": "/images/hero/hospital-reception-welcome-sm.webp",
      "image_alt": "",
      "cta_label": null,
      "cta_href": null,
      "cta2_label": null,
      "cta2_href": null,
      "items": [
        {
          "body": "Browse specialties and team profiles, and filter by language and availability.",
          "icon": "Search",
          "title": "Find the right care"
        },
        {
          "body": "Send an appointment request in a few steps, without waiting on hold.",
          "icon": "CalendarCheck",
          "title": "Request a time that suits you"
        },
        {
          "body": "Every page offers a one-tap message with your question already written.",
          "icon": "MessageCircle",
          "title": "Talk to us on WhatsApp"
        },
        {
          "body": "Pick up home-care items from the same place you manage your visits.",
          "icon": "ShoppingBag",
          "title": "Order everyday essentials"
        }
      ],
      "sort_order": 6,
      "published": true
    },
    {
      "key": "home.visit",
      "heading": "Visit or contact us",
      "body": "",
      "image_url": null,
      "image_small_url": null,
      "image_alt": "",
      "cta_label": null,
      "cta_href": null,
      "cta2_label": null,
      "cta2_href": null,
      "items": [],
      "sort_order": 7,
      "published": true
    }
  ],
  "facilities": [
    {
      "slug": "reception-waiting-area",
      "name": "Reception and waiting area",
      "description": "A calm space to check in, with seating, drinking water and a screen showing your place in the queue.",
      "image_url": "/images/facilities/reception-waiting-area.webp",
      "image_small_url": "/images/facilities/reception-waiting-area-sm.webp",
      "image_alt": "A calm waiting area with seated visitors",
      "image_width": 1200,
      "image_height": 800,
      "sort_order": 1,
      "published": true
    },
    {
      "slug": "consultation-room",
      "name": "Consultation rooms",
      "description": "Private rooms with an examination bed, privacy curtain and space for a family member to join you.",
      "image_url": "/images/facilities/consultation-room.webp",
      "image_small_url": "/images/facilities/consultation-room-sm.webp",
      "image_alt": "A consultation room with an examination bed and desk",
      "image_width": 1200,
      "image_height": 800,
      "sort_order": 2,
      "published": true
    },
    {
      "slug": "hospital-corridor",
      "name": "Clear, signposted corridors",
      "description": "Wide corridors with handrails and colour-coded signs to help you find your way.",
      "image_url": "/images/facilities/hospital-corridor.webp",
      "image_small_url": "/images/facilities/hospital-corridor-sm.webp",
      "image_alt": "A hospital corridor with doors and handrails",
      "image_width": 1200,
      "image_height": 800,
      "sort_order": 3,
      "published": true
    },
    {
      "slug": "patient-room",
      "name": "Patient rooms",
      "description": "Rooms with an adjustable bed, a chair for visitors and plenty of natural light.",
      "image_url": "/images/facilities/patient-room.webp",
      "image_small_url": "/images/facilities/patient-room-sm.webp",
      "image_alt": "A patient resting in a bed while a visitor sits nearby",
      "image_width": 1200,
      "image_height": 800,
      "sort_order": 4,
      "published": true
    },
    {
      "slug": "laboratory",
      "name": "Laboratory",
      "description": "Where samples are processed and tests are run, so results can reach your care team.",
      "image_url": "/images/facilities/laboratory.webp",
      "image_small_url": "/images/facilities/laboratory-sm.webp",
      "image_alt": "A laboratory technician working at a bench",
      "image_width": 1200,
      "image_height": 800,
      "sort_order": 5,
      "published": true
    },
    {
      "slug": "diagnostic-imaging",
      "name": "Diagnostic imaging",
      "description": "Scanning rooms where trained staff carry out imaging tests your doctor has requested.",
      "image_url": "/images/facilities/diagnostic-imaging.webp",
      "image_small_url": "/images/facilities/diagnostic-imaging-sm.webp",
      "image_alt": "A diagnostic imaging scanner with a technician",
      "image_width": 1200,
      "image_height": 800,
      "sort_order": 6,
      "published": true
    },
    {
      "slug": "medical-equipment",
      "name": "Medical equipment",
      "description": "Monitoring and support equipment, maintained and checked by the clinical engineering team.",
      "image_url": "/images/facilities/medical-equipment.webp",
      "image_small_url": "/images/facilities/medical-equipment-sm.webp",
      "image_alt": "Medical equipment including a monitor, infusion pumps and a defibrillator",
      "image_width": 1200,
      "image_height": 800,
      "sort_order": 7,
      "published": true
    },
    {
      "slug": "staff-at-work",
      "name": "Care teams",
      "description": "Nurses and doctors working together so information follows you from one visit to the next.",
      "image_url": "/images/facilities/staff-at-work.webp",
      "image_small_url": "/images/facilities/staff-at-work-sm.webp",
      "image_alt": "A nurse and a doctor working at a nurses’ station",
      "image_width": 1200,
      "image_height": 800,
      "sort_order": 8,
      "published": true
    }
  ]
};
