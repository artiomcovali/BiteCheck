import type { Config } from "tailwindcss";

/**
 * Tailwind for BiteCheck.
 *
 * Brand color tokens are exposed as CSS custom properties in `globals.css` so
 * dark mode (driven by `data-theme="dark"`) can flip them in one place.
 * Tailwind utilities below alias the same custom properties for ergonomics.
 *
 * @see src/app/globals.css for the source-of-truth palette.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bc: {
          bg: "var(--bc-bg)",
          surface: "var(--bc-surface)",
          surfaceAlt: "var(--bc-surface-alt)",
          hairline: "var(--bc-hairline)",
          hairline2: "var(--bc-hairline-2)",
          text: "var(--bc-text)",
          textSec: "var(--bc-text-sec)",
          textTer: "var(--bc-text-ter)",
          textInv: "var(--bc-text-inv)",
          primary: "var(--bc-primary)",
          primaryInk: "var(--bc-primary-ink)",
          primaryFog: "var(--bc-primary-fog)",
          safe: "var(--bc-safe)",
          safeInk: "var(--bc-safe-ink)",
          safeFog: "var(--bc-safe-fog)",
          warn: "var(--bc-warn)",
          warnInk: "var(--bc-warn-ink)",
          warnFog: "var(--bc-warn-fog)",
          unsafe: "var(--bc-unsafe)",
          unsafeInk: "var(--bc-unsafe-ink)",
          unsafeFog: "var(--bc-unsafe-fog)",
          neutral: "var(--bc-neutral)",
          neutralFog: "var(--bc-neutral-fog)",
        },
      },
      fontFamily: {
        display: ["var(--bc-font-display)"],
        body: ["var(--bc-font-body)"],
        mono: ["var(--bc-font-mono)"],
      },
      boxShadow: {
        bcSm: "var(--bc-shadow-sm)",
        bcMd: "var(--bc-shadow-md)",
        bcLg: "var(--bc-shadow-lg)",
      },
    },
  },
  plugins: [],
};

export default config;
