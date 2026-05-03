"use client";

/**
 * useChatStream — React hook that POSTs `{ query, sessionId }` to
 * `/api/chat` and parses the SSE response into typed `ReasoningEvent`s.
 *
 * The profile is *not* sent in the body; the route reads it from the
 * authenticated Supabase session server-side. The client could not be
 * authoritative about allergens even if we wanted it to be.
 *
 * Why hand-rolled instead of EventSource? EventSource only supports GET,
 * and we need POST + a JSON body. This implementation reads the fetch
 * stream and parses the SSE wire format manually.
 */
import * as React from "react";
import type { ConversationTurn, ReasoningEvent } from "@/lib/types";

export type ChatTurn = {
  id: string;
  query: string;
  events: ReasoningEvent[];
  status: "streaming" | "complete" | "error";
  error?: string;
};

type Options = {
  endpoint?: string;
};

// How many prior turns to include in the request body. Classifier and
// Q&A modules look at the most recent turn; the rest are kept for future
// expansion. Server caps at 20.
const HISTORY_TURNS = 6;

export function useChatStream({ endpoint = "/api/chat" }: Options = {}) {
  const [turns, setTurns] = React.useState<ChatTurn[]>([]);
  const [streaming, setStreaming] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  // Snapshot the latest turns into a ref so the `send` callback doesn't
  // need them in its dep array (and thus doesn't re-bind every render).
  const turnsRef = React.useRef(turns);
  React.useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  const send = React.useCallback(
    async (query: string, sessionId: string) => {
      const trimmed = query.trim();
      if (!trimmed || streaming) return;

      const history = buildHistory(turnsRef.current);

      const turnId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `t-${Date.now()}`;

      const newTurn: ChatTurn = {
        id: turnId,
        query: trimmed,
        events: [],
        status: "streaming",
      };
      setTurns((prev) => [...prev, newTurn]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const appendEvent = (event: ReasoningEvent) => {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId ? { ...t, events: [...t.events, event] } : t,
          ),
        );
      };
      const finalize = (status: ChatTurn["status"], error?: string) => {
        setTurns((prev) =>
          prev.map((t) => (t.id === turnId ? { ...t, status, error } : t)),
        );
      };

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, sessionId, history }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          throw new Error(
            `Request failed with status ${res.status} ${res.statusText}`,
          );
        }
        for await (const event of parseSseStream(res.body, controller.signal)) {
          appendEvent(event);
          if (event.type === "complete" || event.type === "qna") {
            finalize("complete");
          } else if (event.type === "error") {
            finalize("error", event.message);
          }
        }
        // If the stream ended without a terminal event, treat as complete.
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId && t.status === "streaming"
              ? { ...t, status: "complete" }
              : t,
          ),
        );
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") {
          finalize("complete");
        } else {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          finalize("error", message);
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setStreaming(false);
      }
    },
    [endpoint, streaming],
  );

  const cancel = React.useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = React.useCallback(() => {
    cancel();
    setTurns([]);
  }, [cancel]);

  return { turns, streaming, send, cancel, reset };
}

/**
 * Parse a `text/event-stream` body into `ReasoningEvent`s.
 *
 * Yields each typed event as soon as a complete `event:`/`data:` block is seen.
 * Tolerates heartbeats (`: hb`) and partial chunks.
 */
async function* parseSseStream(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<ReasoningEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) return;
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE messages are separated by \n\n
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const event = parseSseBlock(raw);
        if (event) yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Distill the last few completed turns into the compact `ConversationTurn`
 * shape the server expects. Skips streaming or errored turns.
 */
function buildHistory(turns: ChatTurn[]): ConversationTurn[] {
  const completed = turns
    .filter((t) => t.status === "complete")
    .slice(-HISTORY_TURNS);

  const out: ConversationTurn[] = [];
  for (const turn of completed) {
    const completeEvent = turn.events.find(
      (e): e is Extract<ReasoningEvent, { type: "complete" }> =>
        e.type === "complete",
    );
    const qnaEvent = turn.events.find(
      (e): e is Extract<ReasoningEvent, { type: "qna" }> => e.type === "qna",
    );

    if (qnaEvent) {
      out.push({
        mode: "qna",
        query: turn.query,
        answer: qnaEvent.answer,
      });
      continue;
    }
    if (completeEvent) {
      out.push({
        mode: "recommendation",
        query: turn.query,
        summary: completeEvent.reasoning_summary,
        recommended_items: completeEvent.recommendations.map((r) => ({
          item_name: r.item_name,
          location: r.location,
        })),
        warned_items: completeEvent.warnings.map((w) => ({
          item_name: w.item_name,
        })),
      });
    }
  }
  return out;
}

function parseSseBlock(block: string): ReasoningEvent | null {
  const lines = block.split("\n");
  let dataLines: string[] = [];
  for (const line of lines) {
    if (!line || line.startsWith(":")) continue; // comment / heartbeat
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const field = line.slice(0, colon);
    const value = line.slice(colon + 1).replace(/^ /, "");
    if (field === "data") dataLines.push(value);
  }
  if (dataLines.length === 0) return null;
  try {
    return JSON.parse(dataLines.join("\n")) as ReasoningEvent;
  } catch {
    return null;
  }
}
