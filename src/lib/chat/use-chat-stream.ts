"use client";

/**
 * useChatStream — React hook that POSTs `{ query, profile }` to `/api/chat`
 * and parses the SSE response into typed `ReasoningEvent`s.
 *
 * Why hand-rolled instead of EventSource? EventSource only supports GET, and
 * we need to send the user profile in the body. This implementation reads the
 * fetch stream and parses the SSE wire format manually.
 */
import * as React from "react";
import type { ReasoningEvent, UserProfile } from "@/lib/types";

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

export function useChatStream({ endpoint = "/api/chat" }: Options = {}) {
  const [turns, setTurns] = React.useState<ChatTurn[]>([]);
  const [streaming, setStreaming] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  const send = React.useCallback(
    async (query: string, profile: UserProfile) => {
      const trimmed = query.trim();
      if (!trimmed || streaming) return;

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
          body: JSON.stringify({ query: trimmed, profile }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          throw new Error(
            `Request failed with status ${res.status} ${res.statusText}`,
          );
        }
        for await (const event of parseSseStream(res.body, controller.signal)) {
          appendEvent(event);
          if (event.type === "complete") {
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
