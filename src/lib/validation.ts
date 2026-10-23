export type Errors<T> = Partial<Record<keyof T, string>>;

export const isBlank = (v: string | undefined) => !v || !v.trim();

/** Accepts 10-digit Indian mobile numbers or international numbers with 8–15 digits. */
export const isPhone = (v: string) => {
  const digits = v.replace(/[\s()-]/g, '');
  return /^(\+?91)?[6-9]\d{9}$/.test(digits) || /^\+\d{8,15}$/.test(digits);
};

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export const isPinCode = (v: string) => /^[1-9]\d{5}$/.test(v.trim());
