'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { TopNav } from './TopNav';
import { PageTransition } from './PageTransition';

const SHELLLESS_PATHS = ['/login', '/onboarding'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !SHELLLESS_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!showNav) return <>{children}</>;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bc-bg)',
      }}
    >
      <TopNav />
      <PageTransition>{children}</PageTransition>
    </div>
  );
}
