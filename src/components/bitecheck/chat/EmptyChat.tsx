"use client";

import { BCIcon, type IconName } from "../icons";

/**
 * Empty chat — Maya greeting plus three suggested queries.
 * Mirrors BCEmptyChatScreen from the design.
 */
const SUGGESTIONS: Array<{ icon: IconName; text: string }> = [
  { icon: "utensils", text: "What's safe for me at 19 Metro tonight?" },
  { icon: "shield", text: "Is the curry at 1901 actually vegetarian?" },
  { icon: "sparkle", text: "Find high-protein options at Vista Grande" },
];

export function EmptyChat({
  name,
  onAsk,
}: {
  name: string;
  onAsk: (q: string) => void;
}) {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "60px 20px 24px",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px 4px 8px",
          borderRadius: 999,
          background: "var(--bc-primary-fog)",
          color: "var(--bc-primary-ink)",
          marginBottom: 14,
        }}
        className="bc-label"
      >
        <BCIcon name="sparkle" size={11} strokeWidth={2.5} />
        BiteCheck Agent
      </div>
      <h1 className="bc-h1" style={{ marginBottom: 8, textWrap: "balance" }}>
        Hi {name}, what are you thinking about eating?
      </h1>
      <p
        className="bc-body"
        style={{ color: "var(--bc-text-sec)", marginBottom: 20 }}
      >
        I&apos;ll cross-check Cal Poly&apos;s dining data against your profile and flag
        anything uncertain before you eat it.
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            type="button"
            onClick={() => onAsk(s.text)}
            style={{
              textAlign: "left",
              padding: "14px 14px",
              borderRadius: 14,
              background: "var(--bc-surface)",
              border: "1px solid var(--bc-hairline)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "var(--bc-shadow-sm)",
              transition: "background 120ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bc-surface-alt)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bc-surface)";
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "var(--bc-primary-fog)",
                color: "var(--bc-primary-ink)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <BCIcon name={s.icon} size={15} strokeWidth={2} />
            </div>
            <span
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: -0.1,
              }}
            >
              {s.text}
            </span>
            <BCIcon
              name="arrow-up"
              size={15}
              strokeWidth={2}
              style={{
                color: "var(--bc-text-ter)",
                transform: "rotate(45deg)",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
