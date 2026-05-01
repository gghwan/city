'use client';

import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { type MouseEvent, type ReactNode } from 'react';
import { useNavigationStore } from '@/stores/navigation.store';

type NavigationLinkProps = LinkProps & {
  className?: string;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  target?: string;
  rel?: string;
};

function hrefToString(href: LinkProps['href']) {
  if (typeof href === 'string') return href;
  const path = href.pathname ?? '';
  let query = '';

  if (typeof href.query === 'string' && href.query.length > 0) {
    query = href.query.startsWith('?') ? href.query : `?${href.query}`;
  } else if (href.query && typeof href.query === 'object') {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(href.query)) {
      if (value == null) continue;
      if (Array.isArray(value)) {
        value.forEach((entry) => params.append(key, String(entry)));
      } else {
        params.set(key, String(value));
      }
    }
    const encoded = params.toString();
    query = encoded ? `?${encoded}` : '';
  }

  const hash = href.hash ? `#${href.hash}` : '';
  return `${path}${query}${hash}`;
}

export function NavigationLink({ href, onClick, target, rel, children, ...props }: NavigationLinkProps) {
  const pathname = usePathname();
  const startRouteLoading = useNavigationStore((state) => state.startRouteLoading);

  const nextPath = hrefToString(href);

  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (target && target !== '_self') return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        if (nextPath === pathname) return;
        startRouteLoading();
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
