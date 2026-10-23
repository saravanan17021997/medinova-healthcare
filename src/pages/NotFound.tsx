import { ILLUSTRATION } from '@/data/img';
import { EmptyState, LinkButton } from '@/components/ui';
import { usePageMeta } from '@/hooks/usePageMeta';

export function NotFound() {
  usePageMeta({ title: 'Page not found', description: 'The page you were looking for does not exist.' });
  return (
    <section className="container-x py-12">
      <EmptyState
        image={ILLUSTRATION.error}
        title="This page doesn’t exist"
        body="The link may be out of date or mistyped. Go back to the home page, or find a specialty or doctor from there."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <LinkButton to="/">Go to the home page</LinkButton>
            <LinkButton to="/specialties" variant="outline">
              Browse specialties
            </LinkButton>
          </div>
        }
      />
    </section>
  );
}
