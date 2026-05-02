"use client";

import * as React from "react";
import { useUser } from "@/context/UserContext";
import { useChatStream } from "@/lib/chat/use-chat-stream";
import { getOrCreateSessionId } from "@/lib/chat/session";
import { TopBar } from "./TopBar";
import { EmptyChat } from "./EmptyChat";
import { ChatInput } from "./ChatInput";
import { TurnRenderer } from "./EventStream";

/**
 * Top-level chat experience.
 *
 * Layout: profile-pill top bar, scrolling thread of cards, composer at the
 * bottom. One vertical column, max 720px wide on desktop — matches spec 03's
 * "no sidebars (other than profile summary)" rule. The desktop design's
 * sidebar/threads are intentionally not implemented since spec 03 explicitly
 * scopes them out for the streaming UI.
 */
export function ChatPage() {
  const { profile } = useUser();
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [draft, setDraft] = React.useState("");
  const [sessionId, setSessionId] = React.useState<string>("");
  const { turns, streaming, send, reset } = useChatStream();
  const threadRef = React.useRef<HTMLDivElement | null>(null);

  // Resolve sessionId on the client (sessionStorage isn't available during SSR).
  React.useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  // Apply theme to <html data-theme>. Reads once from system preference on
  // mount, then user toggle takes over.
  React.useEffect(() => {
    const root = document.documentElement;
    const initial =
      root.getAttribute("data-theme") ??
      (window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(initial as "light" | "dark");
  }, []);
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Keep the latest card in view while events stream in.
  const lastEventCount = turns.reduce((n, t) => n + t.events.length, 0);
  React.useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lastEventCount, turns.length]);

  const handleAsk = async (q: string) => {
    if (!sessionId || !profile) return;
    setDraft("");
    await send(q, profile.profile, sessionId);
  };

  const replayLastTurn = async () => {
    const last = turns.at(-1);
    if (!last || streaming || !sessionId || !profile) return;
    await send(last.query, profile.profile, sessionId);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "var(--bc-bg)",
      }}
    >
      <TopBar
        onThemeToggle={() =>
          setTheme((t) => (t === "dark" ? "light" : "dark"))
        }
        isDark={theme === "dark"}
      />

      <main
        ref={threadRef}
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {turns.length === 0 ? (
          <EmptyChat name={profile?.name ?? "there"} onAsk={handleAsk} />
        ) : (
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              padding: "20px 20px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            {turns.map((turn, i) => (
              <TurnRenderer
                key={turn.id}
                query={turn.query}
                events={turn.events}
                status={turn.status}
                isLastTurn={i === turns.length - 1}
                onReplay={i === turns.length - 1 ? replayLastTurn : undefined}
                error={turn.error}
              />
            ))}
            {turns.length > 0 && !streaming && (
              <div style={{ alignSelf: "center", marginTop: 4 }}>
                <button
                  type="button"
                  onClick={reset}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--bc-text-ter)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  Start a new check
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
        <ChatInput
          value={draft}
          onChange={setDraft}
          onSubmit={() => handleAsk(draft)}
          disabled={streaming}
        />
      </div>
    </div>
  );
}
