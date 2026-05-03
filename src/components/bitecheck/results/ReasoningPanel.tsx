"use client";

import * as React from "react";
import {
  AuditEventCard,
  ErrorEventCard,
  ParseEventCard,
  RankEventCard,
  RetrieveEventCard,
} from "@/components/bitecheck/cards";
import { BCIcon } from "@/components/bitecheck/icons";
import type { ReasoningEvent } from "@/lib/types";

/**
 * Collapsed-by-default panel that holds the agent's full reasoning trail.
 *
 * Wraps the existing step cards (Parse / Retrieve / Audit / Rank / Error)
 * unchanged — this panel is the single point of integration; redesigning
 * those cards is out of scope for the results-first refactor.
 */
export function ReasoningPanel({ events }: { events: ReasoningEvent[] }) {
  const [open, setOpen] = React.useState(false);
  const visibleEvents = events.filter((e) => e.type !== "complete");
  if (visibleEvents.length === 0) return null;

  return (
    <details
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      style={{
        borderRadius: 14,
        background: "var(--bc-surface)",
        border: "1px solid var(--bc-hairline)",
        boxShadow: "var(--bc-shadow-sm)",
        overflow: "hidden",
      }}
    >
      <summary
        style={{
          listStyle: "none",
          cursor: "pointer",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          color: "var(--bc-text-sec)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BCIcon name="sparkle" size={14} strokeWidth={2} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--bc-text)",
              letterSpacing: -0.05,
            }}
          >
            {open ? "Hide details" : "Show how this was decided"}
          </span>
        </div>
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            transition: "transform 200ms",
            transform: open ? "rotate(180deg)" : "rotate(0)",
          }}
        >
          <BCIcon name="chevron-down" size={14} strokeWidth={2} />
        </span>
      </summary>
      <div
        style={{
          padding: "0 16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {visibleEvents.map((event, i) => (
          <EventCard key={`${event.type}-${i}`} event={event} />
        ))}
      </div>
    </details>
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
      return null;
  }
}
