"use client";

import * as React from "react";
import { BCIcon } from "../icons";

/**
 * Chat composer. Submits on Enter (Shift+Enter for newline) or send button.
 * Disabled while a stream is in flight to prevent overlapping requests.
 */
export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "Ask about a dining hall, item, or meal…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const taRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Autosize textarea
  React.useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 168) + "px";
  }, [value]);

  const trimmed = value.trim();
  const canSend = !disabled && trimmed.length > 0;

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSubmit();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit();
      }}
      style={{
        padding: "12px 20px 18px",
        borderTop: "1px solid var(--bc-hairline)",
        background: "var(--bc-bg)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          padding: "8px 8px 8px 16px",
          borderRadius: 18,
          background: "var(--bc-surface)",
          border: "1px solid var(--bc-hairline)",
          boxShadow: "var(--bc-shadow-sm)",
        }}
      >
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          aria-label="Ask BiteCheck"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            resize: "none",
            fontFamily: "var(--bc-font-body)",
            fontSize: 15,
            lineHeight: 1.5,
            color: "var(--bc-text)",
            padding: "8px 0",
            maxHeight: 168,
          }}
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!canSend}
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: "none",
            cursor: canSend ? "pointer" : "not-allowed",
            background: canSend ? "var(--bc-primary)" : "var(--bc-surface-alt)",
            color: canSend ? "#fff" : "var(--bc-text-ter)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 200ms, color 200ms",
          }}
        >
          <BCIcon name="arrow-up" size={16} strokeWidth={2.4} />
        </button>
      </div>
      <div
        className="bc-meta"
        style={{
          marginTop: 8,
          color: "var(--bc-text-ter)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <BCIcon name="info" size={12} strokeWidth={2} />
        BiteCheck verifies labels against ingredient lists. Always confirm with
        staff for medical-level needs.
      </div>
    </form>
  );
}
