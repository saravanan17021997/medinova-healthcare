// Intentionally empty. Add only authentic testimonials with written permission,
// then set site.features.testimonials = true. Do not invent patient quotes.
export interface Testimonial {
  quote: string;
  attribution: string;
}

export const testimonials: Testimonial[] = [];
