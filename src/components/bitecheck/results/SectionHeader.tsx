"use client";

import { BCIcon, type IconName } from "@/components/bitecheck/icons";

/**
 * Section heading used by the results-first view. Title + count badge +
 * tone-coded icon. Identical hierarchy across Safe / Caution / Avoid so the
 * eye scans clean rows.
 */
export function SectionHeader({
  tone,
  icon,
  title,
  count,
  subtitle,
}: {
  tone: "safe" | "caution" | "avoid";
  icon: IconName;
  title: string;
  count: number;
  subtitle?: string;
}) {
  const palette = TONE[tone];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          background: palette.bg,
          color: palette.ink,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <BCIcon name={icon} size={16} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            className="bc-h2"
            style={{ fontSize: 18, lineHeight: 1.2 }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: palette.ink,
              padding: "1px 8px",
              borderRadius: 999,
              background: palette.bg,
            }}
          >
            {count}
          </span>
        </div>
        {subtitle && (
          <div
            className="bc-meta"
            style={{ color: "var(--bc-text-ter)", marginTop: 2 }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

const TONE: Record<"safe" | "caution" | "avoid", { bg: string; ink: string }> = {
  safe: { bg: "var(--bc-safe-fog)", ink: "var(--bc-safe-ink)" },
  caution: { bg: "var(--bc-warn-fog)", ink: "var(--bc-warn-ink)" },
  avoid: { bg: "var(--bc-unsafe-fog)", ink: "var(--bc-unsafe-ink)" },
};
