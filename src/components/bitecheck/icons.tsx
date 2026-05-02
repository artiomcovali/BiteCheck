/**
 * BCIcon — stroke-based icon set used throughout BiteCheck.
 * Mirrors the icon set from polyplates/project/bc-primitives.jsx.
 *
 * Icons inherit `currentColor` so callers control color via Tailwind/CSS.
 */
import * as React from "react";

export type IconName =
  | "leaf"
  | "shield"
  | "shield-check"
  | "shield-alert"
  | "alert-tri"
  | "check"
  | "check-circle"
  | "x"
  | "info"
  | "help"
  | "send"
  | "sparkle"
  | "search"
  | "list"
  | "database"
  | "sort"
  | "utensils"
  | "pin"
  | "sun"
  | "moon"
  | "sliders"
  | "plus"
  | "chevron-down"
  | "chevron-right"
  | "chevron-left"
  | "arrow-up"
  | "replay"
  | "dot"
  | "wheat"
  | "bowl"
  | "note"
  | "fish";

type Props = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function BCIcon({
  name,
  size = 20,
  strokeWidth = 1.75,
  className,
  style,
}: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24" as const,
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    style,
    "aria-hidden": true,
  };
  switch (name) {
    case "leaf":
      return (
        <svg {...common}>
          <path d="M21 3c-9 0-15 5-15 12 0 3 1 5 3 6" />
          <path d="M21 3c0 9-5 15-12 15-3 0-5-1-6-3" />
          <path d="M3 21l9-9" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
        </svg>
      );
    case "shield-check":
      return (
        <svg {...common}>
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "shield-alert":
      return (
        <svg {...common}>
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
          <path d="M12 8v4" />
          <path d="M12 15.5v.01" />
        </svg>
      );
    case "alert-tri":
      return (
        <svg {...common}>
          <path d="M12 3.5L21.5 20H2.5L12 3.5z" />
          <path d="M12 10v4" />
          <path d="M12 17v.01" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M5 12l5 5L20 7" />
        </svg>
      );
    case "check-circle":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12l2.5 2.5L16 9.5" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <circle cx="12" cy="8" r="0.6" fill="currentColor" />
        </svg>
      );
    case "help":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5" />
          <circle cx="12" cy="17" r="0.6" fill="currentColor" />
        </svg>
      );
    case "send":
      return (
        <svg {...common}>
          <path d="M4 12l16-8-6 18-3-7-7-3z" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common}>
          <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
          <path d="M7 7l2 2M15 15l2 2M7 17l2-2M15 9l2-2" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" />
        </svg>
      );
    case "list":
      return (
        <svg {...common}>
          <path d="M8 6h12M8 12h12M8 18h12" />
          <circle cx="4" cy="6" r="0.8" fill="currentColor" />
          <circle cx="4" cy="12" r="0.8" fill="currentColor" />
          <circle cx="4" cy="18" r="0.8" fill="currentColor" />
        </svg>
      );
    case "database":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5" rx="8" ry="2.5" />
          <path d="M4 5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5" />
          <path d="M4 11v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6" />
        </svg>
      );
    case "sort":
      return (
        <svg {...common}>
          <path d="M7 4v16M7 4l-3 3M7 4l3 3" />
          <path d="M17 20V4M17 20l3-3M17 20l-3-3" />
        </svg>
      );
    case "utensils":
      return (
        <svg {...common}>
          <path d="M5 3v8a2 2 0 002 2v8" />
          <path d="M9 3v8a2 2 0 01-2 2" />
          <path d="M5 3v6" />
          <path d="M16 3c-1.5 0-3 2-3 5s1 4 3 4v9" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21v-7" />
          <path d="M8 14h8l-1-3V6h1V3H8v3h1v5l-1 3z" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M20 14.5A8 8 0 119.5 4a7 7 0 0010.5 10.5z" />
        </svg>
      );
    case "sliders":
      return (
        <svg {...common}>
          <path d="M4 6h10M18 6h2M4 18h2M10 18h10M4 12h6M14 12h6" />
          <circle cx="16" cy="6" r="2" />
          <circle cx="8" cy="18" r="2" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...common}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...common}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...common}>
          <path d="M15 6l-6 6 6 6" />
        </svg>
      );
    case "arrow-up":
      return (
        <svg {...common}>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      );
    case "replay":
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 109-9" />
          <path d="M3 4v5h5" />
        </svg>
      );
    case "dot":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      );
    case "wheat":
      return (
        <svg {...common}>
          <path d="M12 22V8" />
          <path d="M12 8c-2-2-5-3-5-5 2 0 5 1 5 3" />
          <path d="M12 8c2-2 5-3 5-5-2 0-5 1-5 3" />
          <path d="M12 12c-2-2-5-3-5-5 2 0 5 1 5 3" />
          <path d="M12 12c2-2 5-3 5-5-2 0-5 1-5 3" />
          <path d="M12 16c-2-2-5-3-5-5 2 0 5 1 5 3" />
          <path d="M12 16c2-2 5-3 5-5-2 0-5 1-5 3" />
        </svg>
      );
    case "bowl":
      return (
        <svg {...common}>
          <path d="M3 11h18" />
          <path d="M4 11a8 8 0 0016 0" />
          <path d="M9 7c.5-1 1.5-1.5 2-2.5" />
          <path d="M13 7c.5-1 1.5-1.5 2-2.5" />
        </svg>
      );
    case "note":
      return (
        <svg {...common}>
          <path d="M5 4h14v16H5z" />
          <path d="M9 9h6M9 13h6M9 17h4" />
        </svg>
      );
    case "fish":
      return (
        <svg {...common}>
          <path d="M3 12c3-5 8-6 12-6 3 0 6 2 6 6s-3 6-6 6c-4 0-9-1-12-6z" />
          <path d="M3 12l-2-2v4l2-2z" />
          <circle cx="16" cy="11" r="0.7" fill="currentColor" />
        </svg>
      );
  }
}
