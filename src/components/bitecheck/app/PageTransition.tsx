'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

/**
 * Wraps page content and plays a subtle fade + slide-up animation
 * whenever the route changes. Respects prefers-reduced-motion via
 * the bc-page-enter CSS class.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = React.useState(children);
  const [animKey, setAnimKey] = React.useState(pathname);

  React.useEffect(() => {
    setDisplayChildren(children);
    setAnimKey(pathname);
  }, [pathname, children]);

  return (
    <div key={animKey} className="bc-page-enter">
      {displayChildren}
    </div>
  );
}
