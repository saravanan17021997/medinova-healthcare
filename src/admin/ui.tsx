import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { buttonClass } from '@/components/ui';
import { cx } from '@/lib/format';

// ---------------------------------------------------------------- toasts
type Toast = { id: number; tone: 'success' | 'error'; text: string };
const ToastCtx = createContext<(tone: Toast['tone'], text: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: Toast['tone'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 8000 : 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
        {toasts.map((t) => (
          <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'} className={cx('pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 text-[15px] shadow-lift ring-1', t.tone === 'error' ? 'bg-white text-ink ring-coral/50' : 'bg-ink text-white ring-ink')}>
            {t.tone === 'error' ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-coral" aria-hidden /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-aqua" aria-hidden />}
            <span className="flex-1">{t.text}</span>
            <button type="button" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} aria-label="Dismiss" className="-mr-1 rounded-full p-1 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

// ---------------------------------------------------------------- confirm dialog
export function ConfirmDialog({
  open, title, children, confirmLabel, onConfirm, onCancel, busy = false, danger = true,
}: { open: boolean; title: string; children: ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void; busy?: boolean; danger?: boolean }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onCancel();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, busy, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lift">
        <h2 id="confirm-title" className="font-display text-xl font-semibold text-ink">
          {title}
        </h2>
        <div id="confirm-body" className="mt-2 text-[15px] leading-relaxed text-slate">
          {children}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className={buttonClass('outline', 'md')}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className={cx(buttonClass(danger ? 'dark' : 'primary', 'md'), danger && 'bg-[#B3261E] hover:bg-[#8C1D18]')}>
            {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- small pieces
export function Toggle({ checked, onChange, label, disabled, hideLabel = false }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean; hideLabel?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={hideLabel ? label : undefined} disabled={disabled} onClick={() => onChange(!checked)} className="inline-flex items-center gap-2.5 disabled:opacity-50">
      <span className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors motion-reduce:transition-none', checked ? 'bg-teal' : 'bg-slate/30')}>
        <span className={cx('absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </span>
      {!hideLabel && <span className="text-[15px] font-medium text-ink">{label}</span>}
    </button>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[15px] text-slate">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title, id }: { children: ReactNode; className?: string; title?: string; id?: string }) {
  return (
    <section aria-labelledby={title ? id : undefined} className={cx('min-w-0 rounded-2xl bg-white shadow-card ring-1 ring-line/70', className)}>
      {title && (
        <h2 id={id} className="border-b border-line px-5 py-4 font-semibold text-ink">
          {title}
        </h2>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-2xl bg-white p-5 ring-1 ring-coral/40 sm:flex-row sm:items-center">
      <AlertTriangle className="h-5 w-5 shrink-0 text-coral" aria-hidden />
      <p className="flex-1 text-[15px] text-ink">{message}</p>
      <button type="button" onClick={onRetry} className={buttonClass('primary', 'sm')}>
        Try again
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- helpers
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface DbError { code?: string; message?: string; details?: string | null }

/** Turns database errors into instructions an admin can act on. */
export function dbError(e: DbError | null | undefined, what = 'item'): string {
  if (!e) return 'Something went wrong. Try again.';
  const text = `${e.message ?? ''} ${e.details ?? ''}`;
  if (e.code === '23505') {
    if (/slug/.test(text)) return 'That web address (slug) is already used. Choose another one.';
    if (/sku/.test(text)) return 'That SKU is already used by another product.';
    return `That ${what} already exists.`;
  }
  if (e.code === '23503') return `This ${what} is still in use, so it cannot be deleted. Move or delete what uses it first.`;
  if (e.code === '23514') return `A value is out of range: ${e.message ?? 'check the form'}.`;
  if (e.code === 'PGRST116') return `This ${what} was not found, or your account is not allowed to change it. Refresh the page and try again.`;
  if (e.code === '42501' || /row-level security|permission denied/i.test(text)) return 'Your account is not allowed to make this change. Ask an owner to check your admin access.';
  if (/fetch|network/i.test(text)) return 'Could not reach the database. Check your connection and try again.';
  return e.message || 'Something went wrong. Try again.';
}

export const formatWhen = (iso: string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(iso));
