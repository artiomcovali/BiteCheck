'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/bitecheck/primitives';
import { BCIcon } from '@/components/bitecheck/icons';
import { pickRandomSuggestions } from '@/lib/chat/suggestions';

export function DashboardQuickAsk() {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [suggestions] = React.useState(() => pickRandomSuggestions(3));

  const submit = (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    if (!trimmed) return;
    router.push(`/agent?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section
      style={{
        display: 'grid',
        gap: 16,
        padding: 22,
        borderRadius: 22,
        background: 'var(--bc-surface)',
        border: '1px solid var(--bc-hairline)',
        boxShadow: 'var(--bc-shadow-sm)',
      }}
    >
      <div style={{ display: 'grid', gap: 6 }}>
        <div className="bc-h2">Ask BiteCheck</div>
        <p className="bc-body-sm" style={{ color: 'var(--bc-text-sec)' }}>
          Get a quick answer based on your profile.
        </p>
      </div>

      <form action={async () => submit(query)} style={{ display: 'grid', gap: 10 }}>
        <textarea
          rows={4}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Ask about a dining hall, a nutrition goal, or what to avoid."
          style={{
            width: '100%',
            resize: 'vertical',
            minHeight: 104,
            padding: '14px 16px',
            borderRadius: 16,
            border: '1px solid var(--bc-hairline-2)',
            background: 'var(--bc-bg)',
            color: 'var(--bc-text)',
            fontFamily: 'var(--bc-font-body)',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <Button type="submit" kind="primary" label="Ask the agent" iconRight="arrow-up" full />
      </form>

      <div style={{ display: 'grid', gap: 8 }}>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.text}
            type="button"
            onClick={() => submit(suggestion.text)}
            style={{
              textAlign: 'left',
              padding: '14px 14px',
              borderRadius: 14,
              background: 'var(--bc-surface)',
              border: '1px solid var(--bc-hairline)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: 'var(--bc-shadow-sm)',
              transition: 'background 120ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bc-surface-alt)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bc-surface)';
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: 'var(--bc-primary-fog)',
                color: 'var(--bc-primary-ink)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BCIcon name={suggestion.icon} size={15} strokeWidth={2} />
            </div>
            <span
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: -0.1,
                color: 'var(--bc-text)',
              }}
            >
              {suggestion.text}
            </span>
            <BCIcon
              name="arrow-up"
              size={15}
              strokeWidth={2}
              style={{
                color: 'var(--bc-text-ter)',
                transform: 'rotate(45deg)',
              }}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
