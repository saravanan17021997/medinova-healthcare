import { Link } from 'react-router-dom';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { site } from '@/config/site';
import { BRAND } from '@/data/img';
import { specialties } from '@/data/specialties';
import { telUrl, whatsappUrl } from '@/services/contact';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <img src={BRAND.logoWhite} alt={site.name} width={246} height={64} loading="lazy" className="h-11 w-auto" />
          <p className="mt-4 max-w-xs text-white/75">{site.tagline}</p>
          <p className="mt-6 max-w-sm rounded-2xl bg-white/5 p-4 text-sm leading-relaxed text-white/75">{site.demoNotice} Doctor profiles, products and prices are fictional samples.</p>
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
            {[
              ['/doctors', 'Find a doctor'],
              ['/appointment', 'Book an appointment'],
              ['/facilities', 'Facilities'],
              ['/store', 'Health essentials'],
              ['/contact', 'Contact us'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="hover:text-white hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold">Get in touch</h2>
          <ul className="mt-4 space-y-3 text-white/75">
            <li>
              <a href={telUrl()} className="flex items-center gap-2.5 hover:text-white">
                <Phone className="h-4 w-4 text-aqua" aria-hidden /> {site.contact.phoneDisplay} <span className="text-xs">(demo)</span>
              </a>
            </li>
            <li>
              <a href={whatsappUrl('Hello MediNova, I have a question.')} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 hover:text-white">
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
            © {year} {site.name}. Demonstration website.
          </p>
          <p>{site.credit || 'Illustrations are original artwork created for this demo.'}</p>
        </div>
      </div>
    </footer>
  );
}
