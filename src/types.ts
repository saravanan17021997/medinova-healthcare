export interface ImageAsset {
  /** Path under /public, e.g. /images/hero/x.webp */
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Width of the "-sm" variant for srcset; omit for SVG. */
  smallWidth?: number;
  /** Explicit URL of the small variant (database images). Defaults to "<name>-sm.webp". */
  smallSrc?: string;
}

export interface Specialty {
  /** Database id (absent for the built-in sample data). */
  id?: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  reasons: string[];
  icon: string;
  image: ImageAsset;
}

export interface Doctor {
  id?: string;
  slug: string;
  name: string;
  specialtySlug: string;
  role: string;
  languages: string[];
  availability: string[];
  modes: ('In person' | 'Video')[];
  focus: string[];
  image: ImageAsset;
  /** Verified details, entered in the admin panel. */
  qualifications?: string | null;
  registrationNo?: string | null;
  bio?: string | null;
  /** Fictional sample profile: shown with a "Fictional demo profile" label. Sample data is always demo. */
  isDemo?: boolean;
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
  /** Database id (absent for the built-in sample catalogue). */
  id?: string;
  sku?: string;
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
  /** Units available. Undefined = not tracked (built-in sample catalogue). */
  stock?: number;
  lowStockThreshold?: number;
  /** Sale price, lower than price. */
  discountPrice?: number | null;
}
