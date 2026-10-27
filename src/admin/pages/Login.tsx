import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { buttonClass, TextField } from '@/components/ui';
import { isEmail } from '@/lib/validation';
import { useAdminAuth } from '../auth';
import { AuthCard, Splash, Unconfigured, useAdminMeta } from '../components';

export function AdminLogin() {
  useAdminMeta('Sign in');
  const { status, problem, signIn } = useAdminAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const target = from && from.startsWith('/admin') && from !== '/admin/login' ? from : '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (status === 'unconfigured') return <Unconfigured problem={problem} />;
  if (status === 'loading' && !busy) return <Splash />;
  // Signed in already (or just now): the guard decides admin or no access.
  if (status === 'admin' || status === 'not-admin' || status === 'error') return <Navigate to={target} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (!isEmail(email)) err.email = 'Enter your email address, like name@example.com.';
    if (!password) err.password = 'Enter your password.';
    setErrors(err);
    setFormError(null);
    if (Object.keys(err).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setBusy(true);
    const message = await signIn(email, password);
    setBusy(false);
    if (message) {
      setFormError(message);
      setPassword('');
    }
  };

  return (
    <AuthCard title="Sign in to the admin panel" icon={<Lock className="h-5 w-5" aria-hidden />}>
      <p className="text-[15px] text-slate">For SaraDev staff with an admin account. There is no public sign-up.</p>
      <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        {formError && (
          <p role="alert" className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-medium text-ink ring-1 ring-coral/30">
            {formError}
          </p>
        )}
        <TextField id="admin-email" label="Email" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <div className="relative">
          <TextField
            id="admin-password"
            label="Password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
            className="absolute right-1 top-[30px] flex h-10 w-10 items-center justify-center rounded-full text-slate hover:bg-mist hover:text-ink"
          >
            {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
          </button>
        </div>
        <button type="submit" disabled={busy} className={buttonClass('primary', 'lg', 'w-full')}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-5 text-sm text-slate">Forgotten your password? An owner can reset it in Supabase → Authentication → Users.</p>
    </AuthCard>
  );
}
