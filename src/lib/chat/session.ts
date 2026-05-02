"use client";

/**
 * Per-tab session id used by the rate limiter and (later) by the chat
 * pipeline to dedupe replays. Pinned to `sessionStorage` so it survives
 * page reloads but resets when the tab closes.
 */

const KEY = "bitecheck.sessionId";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.sessionStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(KEY, id);
  }
  return id;
}
