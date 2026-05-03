/**
 * BiteCheck cards.
 *
 * One ReasoningEvent → one card. Final recommendations and warnings (carried
 * by the `complete` event) render as larger cards below the streamed
 * reasoning trail. Mirrors the visual language of polyplates/project/bc-cards.jsx
 * and bc-stream.jsx.
 */
"use client";

import * as React from "react";
import type {
  AgentResponse,
  ParsedIntent,
  ReasoningEvent,
} from "@/lib/types";
import { BCIcon, type IconName } from "./icons";
import {
  Badge,
  Button,
  Chip,
  ConfidenceMeter,
  type ConfidenceLevel,
  Skeleton,
  SourceChip,
  ThinkingDots,
} from "./primitives";

type CardTone = "neutral" | "primary" | "safe" | "warn" | "unsafe";

const toneToBorder: Record<CardTone, string> = {
  neutral: "var(--bc-hairline)",
  primary: "var(--bc-primary)",
  safe: "var(--bc-safe)",
  warn: "var(--bc-warn)",
  unsafe: "var(--bc-unsafe)",
};

const toneToStripe: Record<CardTone, string> = {
  neutral: "var(--bc-neutral)",
  primary: "var(--bc-primary)",
  safe: "var(--bc-safe)",
  warn: "var(--bc-warn)",
  unsafe: "var(--bc-unsafe)",
};

function CardShell({
  tone = "neutral",
  shake,
  children,
  className,
  stripe = false,
}: {
  tone?: CardTone;
  shake?: boolean;
  children: React.ReactNode;
  className?: string;
  stripe?: boolean;
}) {
  const borderWidth = tone !== "neutral" ? 1.5 : 1;
  return (
    <div
      className={`${shake ? "bc-shake" : ""} ${className ?? ""}`}
      style={{
        background: "var(--bc-surface)",
        borderRadius: 16,
        border: `${borderWidth}px solid ${toneToBorder[tone]}`,
        boxShadow: "var(--bc-shadow-sm)",
        overflow: "hidden",
      }}
    >
      {stripe && (
        <div
          style={{
            height: 3,
            background: toneToStripe[tone],
            opacity: tone === "neutral" ? 0.5 : 1,
          }}
        />
      )}
      {children}
    </div>
  );
}

const reasoningKindMeta: Record<
  ReasoningEvent["type"],
  { icon: IconName; label: string }
> = {
  parse: { icon: "sparkle", label: "Understanding" },
  retrieve: { icon: "list", label: "Checking the menu" },
  audit: { icon: "database", label: "Auditing the data" },
  rank: { icon: "sort", label: "Ranking what's safe" },
  complete: { icon: "check-circle", label: "Recommendation" },
  qna: { icon: "sparkle", label: "Answer" },
  error: { icon: "alert-tri", label: "Error" },
};

/**
 * Generic shell for a streaming reasoning step. Used by every per-event card.
 * `loading` shows the skeleton/thinking state before the body fills in.
 */
function ReasoningStepShell({
  kind,
  title,
  loading = false,
  children,
}: {
  kind: ReasoningEvent["type"];
  title: string;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  const meta = reasoningKindMeta[kind];
  return (
    <div
      className="bc-card-in"
      style={{
        background: "var(--bc-surface)",
        borderRadius: 16,
        border: "1px solid var(--bc-hairline)",
        boxShadow: "var(--bc-shadow-sm)",
        padding: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: children ? 10 : 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--bc-primary-fog)",
            color: "var(--bc-primary-ink)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BCIcon name={meta.icon} size={15} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="bc-label"
            style={{ color: "var(--bc-text-ter)", marginBottom: 2 }}
          >
            {meta.label}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--bc-text)",
              letterSpacing: -0.1,
              lineHeight: 1.4,
            }}
          >
            {title}
          </div>
        </div>
        {loading && <ThinkingDots />}
      </div>
      {children && <div style={{ marginLeft: 38 }}>{children}</div>}
    </div>
  );
}

function ParsedIntentDetails({ intent }: { intent: ParsedIntent }) {
  const queryTypeLabel: Record<ParsedIntent["query_type"], string> = {
    what_can_i_eat: "what can I eat",
    is_this_safe: "is this safe",
    nutritional_optimization: "nutrition goal",
    general: "general",
  };
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <Chip
        tone="mono"
        label="intent"
        value={queryTypeLabel[intent.query_type]}
        size="sm"
      />
      {intent.location_filter && (
        <Chip
          tone="mono"
          label="location"
          value={intent.location_filter}
          size="sm"
        />
      )}
      {intent.meal_period_filter && (
        <Chip
          tone="mono"
          label="meal"
          value={intent.meal_period_filter}
          size="sm"
        />
      )}
      {intent.nutritional_goal && (
        <Chip
          tone="mono"
          label={`${intent.nutritional_goal.op} ${intent.nutritional_goal.nutrient}`}
          value={String(intent.nutritional_goal.target)}
          size="sm"
        />
      )}
    </div>
  );
}

export function ParseEventCard({
  event,
}: {
  event: Extract<ReasoningEvent, { type: "parse" }>;
}) {
  return (
    <ReasoningStepShell kind="parse" title={event.message}>
      <ParsedIntentDetails intent={event.result} />
    </ReasoningStepShell>
  );
}

export function RetrieveEventCard({
  event,
}: {
  event: Extract<ReasoningEvent, { type: "retrieve" }>;
}) {
  return (
    <ReasoningStepShell kind="retrieve" title={event.message}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Chip
          tone="mono"
          label="candidates"
          value={String(event.count)}
          size="sm"
        />
      </div>
    </ReasoningStepShell>
  );
}

export function AuditEventCard({
  event,
}: {
  event: Extract<ReasoningEvent, { type: "audit" }>;
}) {
  if (event.flagged_examples.length === 0) {
    return (
      <ReasoningStepShell kind="audit" title={event.message}>
        <div
          style={{
            padding: "9px 11px",
            borderRadius: 10,
            background: "var(--bc-safe-fog)",
            color: "var(--bc-safe-ink)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12.5,
            fontWeight: 500,
          }}
        >
          <BCIcon name="check" size={14} strokeWidth={2.2} />
          No data conflicts found
        </div>
      </ReasoningStepShell>
    );
  }
  return (
    <ReasoningStepShell kind="audit" title={event.message}>
      <div style={{ display: "grid", gap: 6 }}>
        {event.flagged_examples.slice(0, 3).map((ex, i) => (
          <div
            key={`${ex.item_name}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 11px",
              borderRadius: 10,
              background: "var(--bc-warn-fog)",
              color: "var(--bc-warn-ink)",
            }}
          >
            <BCIcon name="alert-tri" size={14} strokeWidth={2.2} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {ex.item_name}
            </span>
            <span
              style={{
                fontSize: 12.5,
                color: "var(--bc-text-sec)",
                fontWeight: 500,
              }}
            >
              {ex.issue}
            </span>
          </div>
        ))}
      </div>
    </ReasoningStepShell>
  );
}

export function RankEventCard({
  event,
}: {
  event: Extract<ReasoningEvent, { type: "rank" }>;
}) {
  return <ReasoningStepShell kind="rank" title={event.message} />;
}

export function ErrorEventCard({
  event,
}: {
  event: Extract<ReasoningEvent, { type: "error" }>;
}) {
  return (
    <CardShell tone="unsafe" stripe>
      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge tone="unsafe" icon="alert-tri" label={`Error · ${event.step}`} />
        </div>
        <div
          className="bc-body-sm"
          style={{ marginTop: 10, color: "var(--bc-text-sec)" }}
        >
          {event.message}
        </div>
      </div>
    </CardShell>
  );
}

/** Thinking placeholder — shown before the next event arrives. */
export function ThinkingCard({ label }: { label?: string }) {
  return (
    <div
      className="bc-card-in"
      style={{
        background: "var(--bc-surface)",
        borderRadius: 16,
        border: "1px dashed var(--bc-hairline-2)",
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "var(--bc-surface-alt)",
          color: "var(--bc-text-ter)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BCIcon name="sparkle" size={14} strokeWidth={2} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="bc-label" style={{ color: "var(--bc-text-ter)" }}>
          Thinking
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--bc-text-sec)",
            marginTop: 2,
          }}
        >
          {label ?? "Working through the next step…"}
        </div>
      </div>
      <ThinkingDots />
    </div>
  );
}

// ── Final outputs ──────────────────────────────────────────────────────────

export function RecommendationCard({
  rec,
}: {
  rec: AgentResponse["recommendations"][number];
}) {
  const [expanded, setExpanded] = React.useState(false);
  const level: ConfidenceLevel = rec.confidence;
  const tone: CardTone = level === "high" ? "safe" : "warn";
  return (
    <CardShell tone={tone} stripe>
      <div style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Badge
            tone={tone === "safe" ? "safe" : "warn"}
            icon={tone === "safe" ? "shield-check" : "shield-alert"}
            label={
              tone === "safe"
                ? "Verified safe for your profile"
                : "Looks ok — verify the highlighted field"
            }
          />
        </div>
        <div className="bc-h2" style={{ marginBottom: 4 }}>
          {rec.item_name}
        </div>
        <div
          className="bc-body-sm"
          style={{ color: "var(--bc-text-sec)", marginBottom: 14 }}
        >
          {rec.location}
          {rec.nutrition_summary ? ` · ${rec.nutrition_summary}` : ""}
        </div>

        <div
          style={{
            padding: "10px 0",
            borderTop: "1px solid var(--bc-hairline)",
            borderBottom: "1px solid var(--bc-hairline)",
            marginBottom: 12,
          }}
        >
          <ConfidenceMeter level={level} />
        </div>

        <div
          className="bc-body-sm"
          style={{ color: "var(--bc-text-sec)", marginBottom: 8 }}
        >
          {rec.reasoning}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "8px 0",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--bc-text)",
          }}
        >
          <span className="bc-h3" style={{ fontSize: 14 }}>
            Why this recommendation?
          </span>
          <span
            aria-hidden
            style={{
              transition: "transform 200ms",
              transform: expanded ? "rotate(180deg)" : "rotate(0)",
              color: "var(--bc-text-sec)",
              display: "inline-flex",
            }}
          >
            <BCIcon name="chevron-down" size={16} strokeWidth={2} />
          </span>
        </button>
        {expanded && (
          <div className="bc-expand">
            <div
              className="bc-body-sm"
              style={{ color: "var(--bc-text-sec)", marginBottom: 10 }}
            >
              These CSV fields drove this verdict:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {rec.source_fields.map((field) => (
                <SourceChip
                  key={field}
                  tone="safe"
                  field={field}
                  value="reviewed, no conflicts"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </CardShell>
  );
}

export function WarningCard({
  warn,
  shake,
}: {
  warn: AgentResponse["warnings"][number];
  shake?: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const issueLabel: Record<typeof warn.issue, string> = {
    label_conflict: "Label conflicts with ingredients",
    ambiguous_data: "Ambiguous data",
    cross_contamination_risk: "Cross-contamination risk",
    missing_data: "Missing data",
  };
  return (
    <CardShell tone="warn" stripe shake={shake}>
      <div style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Badge
            tone="warn"
            icon="alert-tri"
            label={issueLabel[warn.issue]}
          />
        </div>
        <div className="bc-h2" style={{ marginBottom: 4 }}>
          {warn.item_name}
        </div>
        <div
          className="bc-body-sm"
          style={{ color: "var(--bc-text-sec)", marginBottom: 14 }}
        >
          {warn.explanation}
        </div>

        <div
          style={{
            padding: "10px 0",
            borderTop: "1px solid var(--bc-hairline)",
            borderBottom: "1px solid var(--bc-hairline)",
            marginBottom: 12,
          }}
        >
          <ConfidenceMeter
            level={warn.issue === "missing_data" ? "none" : "low"}
          />
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "8px 0",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--bc-text)",
          }}
        >
          <span className="bc-h3" style={{ fontSize: 14 }}>
            Why this matters
          </span>
          <span
            aria-hidden
            style={{
              transition: "transform 200ms",
              transform: expanded ? "rotate(180deg)" : "rotate(0)",
              color: "var(--bc-text-sec)",
              display: "inline-flex",
            }}
          >
            <BCIcon name="chevron-down" size={16} strokeWidth={2} />
          </span>
        </button>
        {expanded && (
          <div className="bc-expand">
            <div
              className="bc-body-sm"
              style={{ color: "var(--bc-text-sec)", marginBottom: 12 }}
            >
              BiteCheck cross-checks dining label fields against ingredient
              lists. When they disagree we flag it rather than guess.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <SourceChip
                tone="safe"
                field="dietary_labels"
                value="says one thing"
              />
              <SourceChip
                tone="unsafe"
                field="ingredients"
                value="says another"
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <Button
            kind="warnSoft"
            icon="utensils"
            label="Verify with dining staff"
            full
          />
        </div>
      </div>
    </CardShell>
  );
}

export function SummaryCard({ summary }: { summary: string }) {
  return (
    <CardShell tone="primary" stripe>
      <div style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <Badge tone="primary" icon="sparkle" label="Reasoning summary" />
        </div>
        <div
          className="bc-body"
          style={{ color: "var(--bc-text)", textWrap: "pretty" }}
        >
          {summary}
        </div>
      </div>
    </CardShell>
  );
}

/** Skeleton form used while a card's body is still streaming in. */
export function StreamingSkeleton() {
  return (
    <div
      className="bc-card-in"
      style={{
        background: "var(--bc-surface)",
        borderRadius: 16,
        border: "1px solid var(--bc-hairline)",
        boxShadow: "var(--bc-shadow-sm)",
        padding: 14,
        display: "grid",
        gap: 8,
      }}
    >
      <Skeleton height={12} width="40%" />
      <Skeleton height={32} radius={10} />
    </div>
  );
}
