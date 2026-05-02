"use client";

import * as React from "react";
import type { ReasoningEvent } from "@/lib/types";
import {
  AuditEventCard,
  ErrorEventCard,
  ParseEventCard,
  RankEventCard,
  RecommendationCard,
  RetrieveEventCard,
  SummaryCard,
  ThinkingCard,
  WarningCard,
} from "../cards";
import { Button } from "../primitives";
import { BCIcon } from "../icons";

/**
 * Render a single chat turn — the user query bubble, the streamed reasoning
 * cards (one per `ReasoningEvent`), and (when complete) the recommendation +
 * warning + summary cards from the `complete` event payload.
 */
export function TurnRenderer({
  query,
  events,
  status,
  isLastTurn,
  onReplay,
  error,
}: {
  query: string;
  events: ReasoningEvent[];
  status: "streaming" | "complete" | "error";
  isLastTurn: boolean;
  onReplay?: () => void;
  error?: string;
}) {
  const completeEvent = events.find(
    (e): e is Extract<ReasoningEvent, { type: "complete" }> =>
      e.type === "complete",
  );
  const intermediateEvents = events.filter((e) => e.type !== "complete");

  // For the warning shake-on-first-appear, we trigger only the first time
  // the complete event lands for this turn.
  const [shakeWarnings, setShakeWarnings] = React.useState(false);
  React.useEffect(() => {
    if (!completeEvent) return;
    setShakeWarnings(true);
    const timer = setTimeout(() => setShakeWarnings(false), 900);
    return () => clearTimeout(timer);
  }, [completeEvent]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* User query bubble */}
      <div style={{ alignSelf: "flex-end", maxWidth: "82%" }}>
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "18px 18px 4px 18px",
            background: "var(--bc-primary)",
            color: "#fff",
            fontSize: 15,
            lineHeight: 1.5,
            boxShadow: "var(--bc-shadow-sm)",
          }}
        >
          {query}
        </div>
      </div>

      {/* Reasoning cards — one per intermediate event */}
      {intermediateEvents.map((event, i) => (
        <EventCard key={`${event.type}-${i}`} event={event} />
      ))}

      {/* Thinking placeholder while the next event hasn't arrived yet */}
      {status === "streaming" && !completeEvent && (
        <ThinkingCard label={nextStepLabel(events)} />
      )}

      {/* Final recommendation + warning + summary cards */}
      {completeEvent && (
        <>
          {completeEvent.recommendations.map((rec, i) => (
            <div key={`rec-${i}`} className="bc-card-in">
              <RecommendationCard rec={rec} />
            </div>
          ))}
          {completeEvent.warnings.map((warn, i) => (
            <div key={`warn-${i}`} className="bc-card-in">
              <WarningCard warn={warn} shake={shakeWarnings && i === 0} />
            </div>
          ))}
          {completeEvent.reasoning_summary && (
            <div className="bc-card-in">
              <SummaryCard summary={completeEvent.reasoning_summary} />
            </div>
          )}
          {isLastTurn && onReplay && (
            <div style={{ alignSelf: "flex-start" }}>
              <Button
                kind="ghost"
                size="sm"
                icon="replay"
                label="Replay reasoning"
                onClick={onReplay}
              />
            </div>
          )}
        </>
      )}

      {/* Stream-level error fallback */}
      {status === "error" && !completeEvent && (
        <ErrorBanner message={error ?? "Something went wrong."} />
      )}
    </div>
  );
}

function EventCard({ event }: { event: ReasoningEvent }) {
  switch (event.type) {
    case "parse":
      return <ParseEventCard event={event} />;
    case "retrieve":
      return <RetrieveEventCard event={event} />;
    case "audit":
      return <AuditEventCard event={event} />;
    case "rank":
      return <RankEventCard event={event} />;
    case "error":
      return <ErrorEventCard event={event} />;
    case "complete":
      // Rendered separately (recommendations + warnings + summary)
      return null;
  }
}

function nextStepLabel(events: ReasoningEvent[]): string {
  const seen = new Set(events.map((e) => e.type));
  if (!seen.has("parse")) return "Reading your question…";
  if (!seen.has("retrieve")) return "Pulling tonight's menu…";
  if (!seen.has("audit"))
    return "Cross-checking labels against ingredient lists…";
  if (!seen.has("rank")) return "Ranking remaining items…";
  return "Picking the best matches…";
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        background: "var(--bc-unsafe-fog)",
        color: "var(--bc-unsafe-ink)",
        border: "1px solid var(--bc-unsafe)",
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <BCIcon name="alert-tri" size={16} strokeWidth={2.2} />
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>
          We couldn&apos;t finish that check
        </div>
        <div className="bc-body-sm" style={{ marginTop: 2 }}>
          {message}
        </div>
      </div>
    </div>
  );
}
