"use client";

import * as React from "react";
import { useUser } from "@/context/UserContext";
import { ProfilePill, Wordmark } from "../primitives";
import { BCIcon } from "../icons";

/**
 * Top app bar — wordmark on the left, profile pill on the right.
 * The profile pill is the persistent reminder that recommendations are
 * being filtered against a real user profile (spec 03 — Profile bar).
 */
export function TopBar({
  onThemeToggle,
  isDark,
}: {
  onThemeToggle?: () => void;
  isDark?: boolean;
}) {
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
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

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
        {profile && (
          <div ref={menuRef} style={{ position: "relative" }}>
            <ProfilePill
              initial={profile.initial}
              chips={profile.chips}
              onClick={() => setOpen((current) => !current)}
            />
            {open && (
              <div
                className="bc-card-in"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  minWidth: 220,
                  padding: 8,
                  borderRadius: 16,
                  background: "var(--bc-surface)",
                  border: "1px solid var(--bc-hairline)",
                  boxShadow: "var(--bc-shadow-lg)",
                }}
              >
                <div
                  style={{
                    padding: "8px 10px 10px",
                    borderBottom: "1px solid var(--bc-hairline)",
                    marginBottom: 6,
                  }}
                >
                  <div className="bc-h3" style={{ fontSize: 15 }}>
                    {profile.name}
                  </div>
                  <div
                    className="bc-meta"
                    style={{ color: "var(--bc-text-ter)", marginTop: 2 }}
                  >
                    PolyCard ${profile.polycard_balance.toFixed(2)}
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  style={menuButtonStyle(true)}
                >
                  <span>Settings</span>
                  <span className="bc-meta" style={{ color: "var(--bc-text-ter)" }}>
                    Soon
                  </span>
                </button>

                <form action="/auth/signout" method="post">
                  <button type="submit" style={menuButtonStyle(false)}>
                    <span>Sign out</span>
                    <BCIcon name="chevron-right" size={14} strokeWidth={2.1} />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
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

function menuButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "none",
    background: "transparent",
    color: disabled ? "var(--bc-text-ter)" : "var(--bc-text)",
    cursor: disabled ? "not-allowed" : "pointer",
    textAlign: "left",
  };
}
