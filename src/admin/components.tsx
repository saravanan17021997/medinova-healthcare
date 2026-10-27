import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, PlugZap, ShieldAlert } from 'lucide-react';
import { BRAND } from '@/data/img';
import { buttonClass } from '@/components/ui';
import { useAdminAuth } from './auth';
import { Splash } from './Splash';

export { Splash };

/** Admin pages: set the tab title and keep them out of search engines. */
export function useAdminMeta(title: string) {
  useEffect(() => {
    document.title = `${title} | SaraDev Admin`;
    let tag = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = tag?.content ?? null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'robots';
      document.head.appendChild(tag);
    }
    tag.content = 'noindex, nofollow';
    return () => {
      if (previous !== null) tag!.content = previous;
    };
  }, [title]);
}

/** Centered card used by the login page and the status screens. */
export function AuthCard({ title, children, icon }: { title: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <main id="main" className="flex min-h-screen items-center justify-center bg-mist px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img src={BRAND.mark} alt="" width={64} height={64} className="h-10 w-10" />
          <span className="font-display text-xl font-semibold text-ink">SaraDev Admin</span>
        </div>
        <section aria-labelledby="auth-card-title" className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line/70 sm:p-8">
          {icon && <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-aqua-50 text-teal">{icon}</div>}
          <h1 id="auth-card-title" className="font-display text-2xl font-semibold text-ink">
            {title}
          </h1>
          <div className="mt-3">{children}</div>
        </section>
        <p className="mt-6 text-center text-sm text-slate">
          <a href="/" className="underline-offset-4 hover:underline">
            Back to the website
          </a>
        </p>
      </div>
    </main>
  );
}


export function Unconfigured({ problem }: { problem: string | null }) {
  useAdminMeta('Not connected');
  const secret = problem && problem !== 'missing';
  return (
    <AuthCard title={secret ? 'Unsafe key detected' : 'Admin panel is not connected'} icon={secret ? <AlertTriangle className="h-5 w-5" aria-hidden /> : <PlugZap className="h-5 w-5" aria-hidden />}>
      {secret ? (
        <p className="text-[15px] leading-relaxed text-slate">{problem}</p>
      ) : (
        <>
          <p className="text-[15px] leading-relaxed text-slate">Add these two settings, then rebuild or redeploy:</p>
          <ul className="mt-3 space-y-1 rounded-2xl bg-mist p-4 font-mono text-sm text-ink">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
          <p className="mt-3 text-sm text-slate">Use the publishable (anon) key only. Never use the service_role or secret key.</p>
        </>
      )}
    </AuthCard>
  );
}

function NotAuthorised() {
  const { email, signOut } = useAdminAuth();
  useAdminMeta('No access');
  return (
    <AuthCard title="This account has no admin access" icon={<ShieldAlert className="h-5 w-5" aria-hidden />}>
      <p className="text-[15px] leading-relaxed text-slate">
        You are signed in as <strong className="font-semibold text-ink">{email}</strong>, but this account is not on the SaraDev admin list. Ask an owner to add you.
      </p>
      <button type="button" onClick={signOut} className={buttonClass('dark', 'md', 'mt-6 w-full')}>
        Sign out
      </button>
    </AuthCard>
  );
}

function AccessError() {
  const { problem, retry, signOut } = useAdminAuth();
  useAdminMeta('Access check failed');
  return (
    <AuthCard title="Could not check your access" icon={<AlertTriangle className="h-5 w-5" aria-hidden />}>
      <p className="text-[15px] leading-relaxed text-slate">{problem}</p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={retry} className={buttonClass('primary', 'md', 'flex-1')}>
          Try again
        </button>
        <button type="button" onClick={signOut} className={buttonClass('outline', 'md', 'flex-1')}>
          Sign out
        </button>
      </div>
    </AuthCard>
  );
}

/**
 * Shows admin pages only to accounts on the sd_admins list.
 * This is for the interface only: the database refuses non-admins on its own.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status, problem } = useAdminAuth();
  const location = useLocation();
  if (status === 'loading') return <Splash />;
  if (status === 'unconfigured') return <Unconfigured problem={problem} />;
  if (status === 'signed-out') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (status === 'not-admin') return <NotAuthorised />;
  if (status === 'error') return <AccessError />;
  return <>{children}</>;
}
