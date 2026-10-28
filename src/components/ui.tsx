import { forwardRef, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { AlertCircle, Info, Minus, Plus } from 'lucide-react';
import { cx } from '@/lib/format';

// ---------------------------------------------------------------- buttons
const base = 'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[color,background-color,border-color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-50';
const variants = {
  primary: 'bg-teal text-white shadow-glow hover:bg-teal-700',
  dark: 'bg-ink text-white hover:bg-navy',
  outline: 'border border-ink/15 bg-white/80 text-ink hover:border-teal/50 hover:bg-white hover:text-teal-700',
  ghost: 'text-ink hover:bg-ink/5',
  light: 'bg-white text-ink hover:bg-aqua-50',
};
const sizes = { md: 'h-11 px-5 text-[15px]', lg: 'h-12 px-6 text-base', sm: 'h-9 px-4 text-sm' };
export type ButtonVariant = keyof typeof variants;

export const buttonClass = (variant: ButtonVariant = 'primary', size: keyof typeof sizes = 'md', extra?: string) => cx(base, variants[variant], sizes[size], extra);

export function LinkButton({ variant = 'primary', size = 'md', className, ...p }: LinkProps & { variant?: ButtonVariant; size?: keyof typeof sizes }) {
  return <Link className={buttonClass(variant, size, className)} {...p} />;
}

// ---------------------------------------------------------------- labels
export function DemoBadge({ children = 'Demo', className }: { children?: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center rounded-full bg-signal/25 px-2.5 py-0.5 text-xs font-semibold text-ink', className)}>{children}</span>;
}

export function Notice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx('flex gap-2.5 rounded-2xl bg-signal/15 px-4 py-3 text-sm leading-relaxed text-ink', className)}>
      <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink/70" />
      <span>{children}</span>
    </p>
  );
}

export function SectionHeading({ title, intro, action, id }: { title: string; intro?: string; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h2 id={id} className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          {title}
        </h2>
        {intro && <p className="mt-3 text-lg leading-relaxed text-slate">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------- form fields
interface FieldShell {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

function Shell({ id, label, error, hint, optional, children }: FieldShell & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional && <span className="font-normal text-slate"> (optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-slate">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-sm font-medium text-[#B3261E]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

const fieldClass = (error?: string) =>
  cx(
    'h-12 w-full rounded-xl border bg-white px-4 text-base text-ink transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 focus:shadow-[0_0_0_4px_rgba(15,139,141,0.15)]',
    error ? 'border-[#B3261E] focus:shadow-[0_0_0_4px_rgba(179,38,30,0.12)]' : 'border-line hover:border-slate-400 focus:border-teal',
  );

const describedBy = (id: string, error?: string, hint?: string) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export const TextField = forwardRef<HTMLInputElement, FieldShell & InputHTMLAttributes<HTMLInputElement>>(function TextField({ id, label, error, hint, optional, className, ...p }, ref) {
  return (
    <Shell id={id} label={label} error={error} hint={hint} optional={optional}>
      <input ref={ref} id={id} name={id} aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} className={cx(fieldClass(error), className)} {...p} />
    </Shell>
  );
});

export const SelectField = forwardRef<HTMLSelectElement, FieldShell & SelectHTMLAttributes<HTMLSelectElement>>(function SelectField({ id, label, error, hint, optional, className, children, ...p }, ref) {
  return (
    <Shell id={id} label={label} error={error} hint={hint} optional={optional}>
      <select ref={ref} id={id} name={id} aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} className={cx(fieldClass(error), 'appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10', className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23102B4E' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...p}>
        {children}
      </select>
    </Shell>
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea({ id, label, error, hint, optional, className, ...p }, ref) {
  return (
    <Shell id={id} label={label} error={error} hint={hint} optional={optional}>
      <textarea ref={ref} id={id} name={id} aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} className={cx(fieldClass(error), 'h-auto min-h-[112px] py-3', className)} {...p} />
    </Shell>
  );
});

// ---------------------------------------------------------------- quantity
export function QuantityStepper({ value, onChange, max = 10, label }: { value: number; onChange: (n: number) => void; max?: number; label: string }) {
  return (
    <div className="inline-flex h-11 items-center rounded-full border border-line bg-white/90" role="group" aria-label={label}>
      <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-mist disabled:opacity-40" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-mist disabled:opacity-40" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- empty state
export function EmptyState({ image, title, body, action }: { image: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
      <img src={image} alt="" width={480} height={360} loading="lazy" className="h-auto w-64" />
      <h2 className="mt-4 font-display text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-slate">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
