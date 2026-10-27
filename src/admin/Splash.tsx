import { Loader2 } from 'lucide-react';

/** Full-screen loading state. Kept free of Supabase imports so the public bundle stays small. */
export function Splash({ label = 'Checking your access…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center gap-3 bg-mist text-slate">
      <Loader2 className="h-5 w-5 animate-spin text-teal motion-reduce:animate-none" aria-hidden />
      {label}
    </div>
  );
}
