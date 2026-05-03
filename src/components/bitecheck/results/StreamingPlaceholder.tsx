"use client";

import { ThinkingDots } from "@/components/bitecheck/primitives";
import type { UIStreamingPhase } from "@/lib/chat/derive-ui-result";

/**
 * Single loading state that appears while the agent runs. The phase comes
 * from `deriveUIResult` and updates as each ReasoningEvent lands, so the
 * label moves through "Pulling today's menu…" → "Cross-checking…" → etc.
 *
 * No per-step cards, no scrolling. The reasoning trail is still available
 * after the run via the "View details" panel.
 */

const PHASE_ORDER: UIStreamingPhase[] = [
  "starting",
  "understanding",
  "fetching",
  "auditing",
  "ranking",
  "finalizing",
];

export function StreamingPlaceholder({
  phase,
  message,
}: {
  phase: UIStreamingPhase;
  message: string;
}) {
  // Show a 4-segment progress bar so the user feels motion without
  // re-introducing per-step cards.
  const stepCount = 4;
  const completedSteps = Math.min(stepCount, Math.max(0, PHASE_ORDER.indexOf(phase)));
  const showSteps = phase !== "idle";

  return (
    <section
      className="bc-card-in"
      style={{
        background: "var(--bc-surface)",
        borderRadius: 16,
        border: "1px solid var(--bc-hairline)",
        boxShadow: "var(--bc-shadow-sm)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: "var(--bc-primary-fog)",
            color: "var(--bc-primary-ink)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ThinkingDots />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            className="bc-label"
            style={{ color: "var(--bc-text-ter)", marginBottom: 2 }}
          >
            BITECHECK
          </div>
          <div
            className="bc-h3"
            style={{ fontSize: 16 }}
          >
            {message || "Working on it…"}
          </div>
        </div>
      </div>
      {showSteps && (
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: stepCount }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 999,
                background:
                  i < completedSteps
                    ? "var(--bc-primary)"
                    : "var(--bc-hairline-2)",
                transition: "background 240ms",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
