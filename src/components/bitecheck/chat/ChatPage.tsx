"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useChatStream } from "@/lib/chat/use-chat-stream";
import { getOrCreateSessionId } from "@/lib/chat/session";
import { EmptyChat } from "./EmptyChat";
import { ChatInput } from "./ChatInput";
import { ResultsView } from "@/components/bitecheck/results/ResultsView";

/**
 * Top-level chat experience.
 *
 * Layout: profile-pill top bar, scrolling thread of cards, composer at the
 * bottom. One vertical column, max 720px wide on desktop — matches spec 03's
 * "no sidebars (other than profile summary)" rule. The desktop design's
 * sidebar/threads are intentionally not implemented since spec 03 explicitly
 * scopes them out for the streaming UI.
 */
export function ChatPage({ initialQuery }: { initialQuery?: string }) {
  const { profile } = useUser();
  const router = useRouter();
  const [draft, setDraft] = React.useState("");
  const [sessionId, setSessionId] = React.useState<string>("");
  const { turns, streaming, send, reset } = useChatStream();
  const threadRef = React.useRef<HTMLDivElement | null>(null);
  const ranInitialQueryRef = React.useRef<string | null>(null);

  // Resolve sessionId on the client (sessionStorage isn't available during SSR).
  React.useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  // Keep the latest card in view while events stream in.
  const lastEventCount = turns.reduce((n, t) => n + t.events.length, 0);
  React.useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lastEventCount, turns.length]);

  React.useEffect(() => {
    if (!initialQuery || !sessionId || !profile || streaming) return;
    if (turns.length > 0) return;
    if (ranInitialQueryRef.current === initialQuery) return;

    ranInitialQueryRef.current = initialQuery;
    void send(initialQuery, sessionId).then(() => {
      router.replace("/agent");
    });
  }, [initialQuery, profile, router, send, sessionId, streaming, turns.length]);

  const handleAsk = async (q: string) => {
    if (!sessionId || !profile) return;
    setDraft("");
    await send(q, sessionId);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 58px)",
      }}
    >
      <main
        ref={threadRef}
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {turns.length === 0 ? (
          <EmptyChat
            name={profile?.name ?? "there"}
            onAsk={handleAsk}
            introLabel="BiteCheck Agent"
          />
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
            {turns.map((turn) => (
              <ResultsView key={turn.id} turn={turn} />
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

      <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", paddingBottom: 12 }}>
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
