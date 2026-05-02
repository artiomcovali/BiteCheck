"use client";

import { ProfilePill, Wordmark } from "../primitives";
import { BCIcon } from "../icons";

/**
 * Top app bar — wordmark on the left, profile pill on the right.
 * The profile pill is the persistent reminder that recommendations are
 * being filtered against a real user profile (spec 03 — Profile bar).
 */
export function TopBar({
  initial,
  chips,
  onProfileClick,
  onThemeToggle,
  isDark,
}: {
  initial: string;
  chips: string[];
  onProfileClick?: () => void;
  onThemeToggle?: () => void;
  isDark?: boolean;
}) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        background: "color-mix(in srgb, var(--bc-bg) 88%, transparent)",
        backdropFilter: "saturate(140%) blur(8px)",
        borderBottom: "1px solid var(--bc-hairline)",
      }}
    >
      <Wordmark size={18} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfilePill
          initial={initial}
          chips={chips}
          onClick={onProfileClick}
        />
        {onThemeToggle && (
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={onThemeToggle}
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              background: "var(--bc-surface-alt)",
              border: "1px solid var(--bc-hairline)",
              color: "var(--bc-text-sec)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <BCIcon
              name={isDark ? "sun" : "moon"}
              size={14}
              strokeWidth={2}
            />
          </button>
        )}
      </div>
    </header>
  );
}
