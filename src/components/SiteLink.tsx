import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import type { NavItem } from '@/services/content';
import { isInternal } from '@/lib/links';

/** A menu link from the admin panel: a router link for pages on this site, a normal link otherwise. */
export function SiteLink({ item, className, end, tabIndex, children }: { item: NavItem; className: string | ((a: { isActive: boolean }) => string); end?: boolean; tabIndex?: number; children?: ReactNode }) {
  if (isInternal(item.href)) {
    return (
      <NavLink to={item.href} end={end} tabIndex={tabIndex} className={className} {...(item.newTab ? { target: '_blank', rel: 'noreferrer' } : {})}>
        {children ?? item.label}
      </NavLink>
    );
  }
  const cls = typeof className === 'function' ? className({ isActive: false }) : className;
  return (
    <a href={item.href} tabIndex={tabIndex} className={cls} {...(item.newTab ? { target: '_blank', rel: 'noreferrer' } : {})}>
      {children ?? item.label}
    </a>
  );
}
