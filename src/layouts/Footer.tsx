import { Link } from 'react-router-dom';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { hello } from '@/config/live';
import { useNav, useSite } from '@/state/content';
import { SiteLink } from '@/components/SiteLink';
import { BRAND } from '@/data/img';
import { useCare } from '@/state/care';
import { telUrl, whatsappUrl } from '@/services/contact';

export function Footer() {
  const year = new Date().getFullYear();
  const { specialties } = useCare(true);
  const site = useSite();
  const nav = useNav();
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <img src={BRAND.logoWhite} alt={site.name} width={220} height={64} loading="lazy" className="h-11 w-auto" />
          <p className="mt-4 max-w-xs text-white/75">{site.tagline}</p>
          {site.demo && <p className="mt-6 max-w-sm rounded-2xl bg-white/5 p-4 text-sm leading-relaxed text-white/75">{site.demoNotice}</p>}
          {nav.social.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Follow us">
              {nav.social.map((n) => (
                <li key={n.href}>
                  <SiteLink item={{ ...n, newTab: true }} className="inline-flex rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-white/20" />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="font-semibold">Specialties</h2>
          <ul className="mt-4 space-y-2 text-white/75">
            {specialties.slice(0, 6).map((s) => (
              <li key={s.slug}>
                <Link to={`/specialties/${s.slug}`} className="hover:text-white hover:underline">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold">Explore</h2>
          <ul className="mt-4 space-y-2 text-white/75">
            {nav.explore.map((n) => (
              <li key={n.href + n.label}>
                <SiteLink item={n} className="hover:text-white hover:underline" />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold">Get in touch</h2>
          <ul className="mt-4 space-y-3 text-white/75">
            <li>
              <a href={telUrl()} className="flex items-center gap-2.5 hover:text-white">
                <Phone className="h-4 w-4 text-aqua" aria-hidden /> {site.contact.phoneDisplay} {site.demo && <span className="text-xs">(demo)</span>}
              </a>
            </li>
            <li>
              <a href={whatsappUrl(`${hello()}, I have a question.`)} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 hover:text-white">
                <MessageCircle className="h-4 w-4 text-aqua" aria-hidden /> Message us on WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${site.contact.email}`} className="flex items-center gap-2.5 hover:text-white">
                <Mail className="h-4 w-4 text-aqua" aria-hidden /> {site.contact.email}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-aqua" aria-hidden />
              <span>{site.location.addressLines.join(', ')}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-sm text-white/60 sm:flex-row sm:justify-between">
          <p>
            © {year} {site.name}.{site.demo && ' Demonstration website.'}
          </p>
          {site.credit && <p>{site.credit}</p>}
        </div>
      </div>
    </footer>
  );
}
