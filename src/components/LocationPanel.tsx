import { MapPin, Navigation } from 'lucide-react';
import { useSite } from '@/state/content';
import { directionsUrl } from '@/services/contact';
import { buttonClass } from './ui';

export function LocationPanel() {
  const site = useSite();
  const url = directionsUrl();
  return (
    <div>
      <h3 className="flex items-center gap-2 font-semibold text-ink">
        <MapPin className="h-[18px] w-[18px] text-teal" aria-hidden /> {site.location.name}
      </h3>
      <address className="mt-2 not-italic leading-relaxed text-slate">
        {site.location.addressLines.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </address>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className={buttonClass('primary', 'sm', 'mt-4')}>
          <Navigation className="h-4 w-4" aria-hidden /> Get directions
        </a>
      ) : (
        <p className="mt-3 text-sm text-slate">Directions appear here once the clinic address has been confirmed.</p>
      )}
    </div>
  );
}
