'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { BCIcon } from '@/components/bitecheck/icons';
import { ProfilePill, Wordmark } from '@/components/bitecheck/primitives';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/agent', label: 'Agent' },
  { href: '/menu', label: 'Menu' },
  { href: '/profile', label: 'Profile' },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const { profile } = useUser();
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'color-mix(in srgb, var(--bc-bg) 94%, transparent)',
        borderBottom: '1px solid var(--bc-hairline)',
        backdropFilter: 'saturate(140%) blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>
          <Wordmark size={18} />
        </Link>

        <nav
          aria-label="Primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: active ? 700 : 600,
                  color: active ? 'var(--bc-primary-ink)' : 'var(--bc-text-sec)',
                  background: active ? 'var(--bc-primary-fog)' : 'transparent',
                  border: active ? '1px solid transparent' : '1px solid transparent',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {profile && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <ProfilePill
                initial={profile.initial}
                name={profile.name}
                balance={profile.polycard_balance}
                onClick={() => setOpen((current) => !current)}
              />
              {open && (
                <div
                  className="bc-card-in"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    minWidth: 248,
                    padding: 8,
                    borderRadius: 16,
                    background: 'var(--bc-surface)',
                    border: '1px solid var(--bc-hairline)',
                    boxShadow: 'var(--bc-shadow-lg)',
                  }}
                >
                  <div
                    style={{
                      padding: '8px 10px 10px',
                      borderBottom: '1px solid var(--bc-hairline)',
                      marginBottom: 6,
                    }}
                  >
                    <div className="bc-h3" style={{ fontSize: 15 }}>
                      {profile.name}
                    </div>
                    <div className="bc-meta" style={{ color: 'var(--bc-text-ter)', marginTop: 2 }}>
                      PolyCard ${profile.polycard_balance.toFixed(2)}
                    </div>
                  </div>

                  <Link href="/profile" style={menuLinkStyle()}>
                    <span>Profile & settings</span>
                    <BCIcon name="chevron-right" size={14} strokeWidth={2.1} />
                  </Link>

                  <form action="/auth/signout" method="post">
                    <button type="submit" style={menuButtonStyle()}>
                      <span>Sign out</span>
                      <BCIcon name="chevron-right" size={14} strokeWidth={2.1} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function menuLinkStyle(): React.CSSProperties {
  return {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 12,
    textDecoration: 'none',
    color: 'var(--bc-text)',
  };
}

function menuButtonStyle(): React.CSSProperties {
  return {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 12,
    border: 'none',
    background: 'transparent',
    color: 'var(--bc-text)',
    cursor: 'pointer',
    textAlign: 'left',
  };
}
