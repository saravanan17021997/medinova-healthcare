export interface ImageAsset {
  /** Path under /public, e.g. /images/hero/x.webp */
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Width of the "-sm" variant for srcset; omit for SVG. */
  smallWidth?: number;
}

export interface Specialty {
  slug: string;
  name: string;
  summary: string;
  description: string;
  reasons: string[];
  icon: string;
  image: ImageAsset;
}

export interface Doctor {
  slug: string;
  name: string;
  specialtySlug: string;
  role: string;
  languages: string[];
  availability: string[];
  modes: ('In person' | 'Video')[];
  focus: string[];
  image: ImageAsset;
}

export interface Facility {
  slug: string;
  name: string;
  description: string;
  image: ImageAsset;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export interface Product {
  slug: string;
  name: string;
  categorySlug: string;
  /** Illustrative demo price in INR. */
  price: number;
  summary: string;
  description: string;
  features: string[];
  inTheBox: string[];
  images: ImageAsset[];
  featured?: boolean;
}
