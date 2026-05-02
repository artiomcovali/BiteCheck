/**
 * BiteCheck primitives — Chip, SourceChip, Badge, Button, Confidence, ProfilePill,
 * Wordmark, Skeleton, ThinkingDots.
 *
 * Mirrors polyplates/project/bc-primitives.jsx but consumes design tokens via
 * CSS custom properties (defined in `globals.css`) instead of an inline tokens
 * object — that lets dark mode flip the entire component tree from a single
 * `data-theme` attribute on <html>.
 */
"use client";

import * as React from "react";
import { BCIcon, type IconName } from "./icons";

type Tone = "neutral" | "primary" | "safe" | "warn" | "unsafe" | "mono";

const chipPalette: Record<
  Tone,
  { bg: string; ink: string; border: string }
> = {
  neutral: {
    bg: "var(--bc-surface-alt)",
    ink: "var(--bc-text)",
    border: "var(--bc-hairline)",
  },
  primary: {
    bg: "var(--bc-primary-fog)",
    ink: "var(--bc-primary-ink)",
    border: "transparent",
  },
  safe: {
    bg: "var(--bc-safe-fog)",
    ink: "var(--bc-safe-ink)",
    border: "transparent",
  },
  warn: {
    bg: "var(--bc-warn-fog)",
    ink: "var(--bc-warn-ink)",
    border: "transparent",
  },
  unsafe: {
    bg: "var(--bc-unsafe-fog)",
    ink: "var(--bc-unsafe-ink)",
    border: "transparent",
  },
  mono: {
    bg: "rgba(20, 30, 30, 0.04)",
    ink: "var(--bc-text-sec)",
    border: "var(--bc-hairline)",
  },
};

export function Chip({
  tone = "neutral",
  icon,
  label,
  value,
  selected = false,
  onClick,
  size = "md",
  className,
}: {
  tone?: Tone;
  icon?: IconName;
  label?: string;
  value?: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const palette = chipPalette[tone];
  const sized =
    size === "sm"
      ? { height: 22, padding: "4px 8px", gap: 5, fontSize: 12 }
      : { height: 28, padding: "6px 11px", gap: 6, fontSize: 13 };
  const selectStyle: React.CSSProperties = selected
    ? {
        background: "var(--bc-primary)",
        color: "var(--bc-text-inv)",
        boxShadow: "inset 0 0 0 1px var(--bc-primary)",
      }
    : {};
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sized.gap,
        height: sized.height,
        padding: sized.padding,
        borderRadius: 999,
        background: palette.bg,
        color: palette.ink,
        border: `1px solid ${palette.border}`,
        fontFamily: "var(--bc-font-body)",
        fontSize: sized.fontSize,
        fontWeight: 500,
        letterSpacing: -0.05,
        cursor: onClick ? "pointer" : "default",
        whiteSpace: "nowrap",
        transition: "background 120ms, color 120ms, transform 120ms",
        ...selectStyle,
      }}
    >
      {icon && <BCIcon name={icon} size={14} strokeWidth={2} />}
      {label && <span>{label}</span>}
      {value && (
        <span
          style={{
            fontFamily: "var(--bc-font-mono)",
            fontSize: sized.fontSize - 1,
            opacity: 0.85,
          }}
        >
          {value}
        </span>
      )}
    </button>
  );
}

export function SourceChip({
  tone = "neutral",
  field,
  value,
  className,
}: {
  tone?: "safe" | "warn" | "unsafe" | "neutral";
  field: string;
  value: string;
  className?: string;
}) {
  const palette = {
    safe: {
      bg: "var(--bc-safe-fog)",
      ink: "var(--bc-safe-ink)",
    },
    warn: {
      bg: "var(--bc-warn-fog)",
      ink: "var(--bc-warn-ink)",
    },
    unsafe: {
      bg: "var(--bc-unsafe-fog)",
      ink: "var(--bc-unsafe-ink)",
    },
    neutral: {
      bg: "var(--bc-surface-alt)",
      ink: "var(--bc-text)",
    },
  }[tone];
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 11px",
        borderRadius: 10,
        background: palette.bg,
        color: palette.ink,
        border:
          tone === "neutral"
            ? "1px solid var(--bc-hairline)"
            : "1px solid transparent",
      }}
    >
      <span
        style={{
          fontFamily: "var(--bc-font-mono)",
          fontSize: 11,
          fontWeight: 500,
          opacity: 0.78,
          textTransform: "lowercase",
        }}
      >
        {field}
      </span>
      <span
        style={{
          width: 1,
          height: 12,
          background: "currentColor",
          opacity: 0.18,
        }}
      />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const badgePalette = {
  neutral: {
    bg: "var(--bc-neutral-fog)",
    ink: "var(--bc-text-sec)",
  },
  primary: {
    bg: "var(--bc-primary-fog)",
    ink: "var(--bc-primary-ink)",
  },
  safe: {
    bg: "var(--bc-safe-fog)",
    ink: "var(--bc-safe-ink)",
  },
  warn: {
    bg: "var(--bc-warn-fog)",
    ink: "var(--bc-warn-ink)",
  },
  unsafe: {
    bg: "var(--bc-unsafe-fog)",
    ink: "var(--bc-unsafe-ink)",
  },
};

export function Badge({
  tone = "neutral",
  icon,
  label,
}: {
  tone?: keyof typeof badgePalette;
  icon?: IconName;
  label: string;
}) {
  const palette = badgePalette[tone];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px 4px 8px",
        borderRadius: 999,
        background: palette.bg,
        color: palette.ink,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.1,
      }}
    >
      {icon && <BCIcon name={icon} size={13} strokeWidth={2.2} />}
      {label}
    </div>
  );
}

type ButtonKind =
  | "primary"
  | "secondary"
  | "soft"
  | "ghost"
  | "warnSoft"
  | "safeSoft";
type ButtonSize = "sm" | "md" | "lg";

const buttonSizes: Record<ButtonSize, { h: number; px: number; fs: number }> = {
  sm: { h: 32, px: 12, fs: 13 },
  md: { h: 40, px: 14, fs: 14 },
  lg: { h: 48, px: 18, fs: 15 },
};

const buttonKinds: Record<
  ButtonKind,
  { bg: string; ink: string; border: string; shadow: string }
> = {
  primary: {
    bg: "var(--bc-primary)",
    ink: "var(--bc-text-inv)",
    border: "transparent",
    shadow: "var(--bc-shadow-sm)",
  },
  secondary: {
    bg: "transparent",
    ink: "var(--bc-text)",
    border: "var(--bc-hairline-2)",
    shadow: "none",
  },
  soft: {
    bg: "var(--bc-surface-alt)",
    ink: "var(--bc-text)",
    border: "var(--bc-hairline)",
    shadow: "none",
  },
  ghost: {
    bg: "transparent",
    ink: "var(--bc-text-sec)",
    border: "transparent",
    shadow: "none",
  },
  warnSoft: {
    bg: "var(--bc-warn-fog)",
    ink: "var(--bc-warn-ink)",
    border: "transparent",
    shadow: "none",
  },
  safeSoft: {
    bg: "var(--bc-safe-fog)",
    ink: "var(--bc-safe-ink)",
    border: "transparent",
    shadow: "none",
  },
};

export function Button({
  kind = "primary",
  icon,
  iconRight,
  label,
  onClick,
  full = false,
  size = "md",
  disabled,
  type = "button",
  ariaLabel,
}: {
  kind?: ButtonKind;
  icon?: IconName;
  iconRight?: IconName;
  label?: string;
  onClick?: () => void;
  full?: boolean;
  size?: ButtonSize;
  disabled?: boolean;
  type?: "button" | "submit";
  ariaLabel?: string;
}) {
  const sizes = buttonSizes[size];
  const kinds = buttonKinds[kind];
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: sizes.h,
        padding: `0 ${sizes.px}px`,
        background: kinds.bg,
        color: kinds.ink,
        border: `1px solid ${kinds.border}`,
        borderRadius: 12,
        fontFamily: "var(--bc-font-body)",
        fontSize: sizes.fs,
        fontWeight: 600,
        letterSpacing: -0.1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        boxShadow: kinds.shadow,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        width: full ? "100%" : undefined,
        transition: "transform 120ms, background 120ms",
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.985)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {icon && <BCIcon name={icon} size={16} strokeWidth={2} />}
      {label && <span>{label}</span>}
      {iconRight && <BCIcon name={iconRight} size={16} strokeWidth={2} />}
    </button>
  );
}

export type ConfidenceLevel = "high" | "medium" | "low" | "none";

export function ConfidenceMeter({
  level,
  className,
}: {
  level: ConfidenceLevel;
  className?: string;
}) {
  const map = {
    high: {
      filled: 4,
      color: "var(--bc-safe)",
      label: "High confidence",
      ink: "var(--bc-safe-ink)",
    },
    medium: {
      filled: 2,
      color: "var(--bc-warn)",
      label: "Medium confidence",
      ink: "var(--bc-warn-ink)",
    },
    low: {
      filled: 1,
      color: "var(--bc-warn)",
      label: "Low confidence — verify manually",
      ink: "var(--bc-warn-ink)",
    },
    none: {
      filled: 0,
      color: "var(--bc-neutral)",
      label: "Not enough data",
      ink: "var(--bc-text-sec)",
    },
  }[level];
  return (
    <div
      className={className}
      style={{ display: "flex", alignItems: "center", gap: 10 }}
    >
      <div style={{ display: "flex", gap: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 4,
              borderRadius: 2,
              background: i < map.filled ? map.color : "var(--bc-hairline-2)",
            }}
          />
        ))}
      </div>
      <div
        className="bc-meta"
        style={{ color: map.ink, fontWeight: 600 }}
      >
        {map.label}
      </div>
    </div>
  );
}

export function ProfilePill({
  initial,
  chips,
  onClick,
}: {
  initial: string;
  chips: string[];
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 11px 5px 6px",
        borderRadius: 999,
        background: "var(--bc-surface-alt)",
        border: "1px solid var(--bc-hairline)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          background: "var(--bc-primary)",
          color: "var(--bc-text-inv)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--bc-font-display)",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {initial}
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--bc-text-sec)",
          letterSpacing: -0.05,
        }}
      >
        {chips.join(" · ")}
      </span>
      <BCIcon
        name="chevron-down"
        size={12}
        strokeWidth={2.2}
        style={{ color: "var(--bc-text-ter)", marginLeft: 1 }}
      />
    </button>
  );
}

export function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <div style={{ position: "relative", width: size + 2, height: size + 2 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            background: "var(--bc-primary)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 4,
            borderRadius: 999,
            border: "1.5px solid var(--bc-text-inv)",
            opacity: 0.85,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 4,
            height: 4,
            borderRadius: 999,
            background: "var(--bc-text-inv)",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--bc-font-display)",
          fontSize: size,
          fontWeight: 700,
          color: "var(--bc-text)",
          letterSpacing: -0.4,
        }}
      >
        Bite<span style={{ color: "var(--bc-primary)" }}>Check</span>
      </span>
    </div>
  );
}

export function Skeleton({
  width = "100%",
  height = 10,
  radius = 6,
  className,
}: {
  width?: number | string;
  height?: number;
  radius?: number;
  className?: string;
}) {
  return (
    <div
      className={`bc-shimmer ${className ?? ""}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

export function ThinkingDots({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ display: "inline-flex", gap: 3, alignItems: "center" }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: "var(--bc-text-ter)",
            animation: `bcDot 1.2s ${i * 0.15}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}
