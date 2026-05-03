'use client';

import * as React from 'react';
import { BCIcon } from '@/components/bitecheck/icons';
import type { ChatTurn } from '@/lib/chat/use-chat-stream';
import { deriveUIResult, type UIResult } from '@/lib/chat/derive-ui-result';
import { ResultItemCard } from './ResultItemCard';
import { SectionHeader } from './SectionHeader';
import { StreamingPlaceholder } from './StreamingPlaceholder';
import { ReasoningPanel } from './ReasoningPanel';

/**
 * Top-level results-first view for a single chat turn.
 *
 * Streams in three states:
 *   - status === "streaming" → StreamingPlaceholder
 *   - status === "complete"  → header + Safe/Caution/Avoid sections + reasoning panel
 *   - status === "error"     → inline error banner (with the reasoning panel
 *                              still available so the user can see how far
 *                              the pipeline got)
 *
 * The component reads its data through `deriveUIResult`, so swapping the
 * agent contract or the streaming source later only touches that mapper.
 */
export function ResultsView({ turn }: { turn: ChatTurn }) {
  const result = React.useMemo(() => deriveUIResult(turn), [turn]);

  // The reasoning panel is only useful for the multi-step recommendation
  // pipeline. A Q&A turn produces a single answer event — there's nothing
  // meaningful to reveal in a "Show how this was decided" disclosure.
  const showReasoningPanel =
    result.mode === 'recommendation' &&
    (result.status === 'complete' || result.status === 'error') &&
    result.events.length > 0;

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <UserQueryBubble query={result.query} />

      {result.status === 'streaming' && !result.hasResults && (
        <StreamingPlaceholder phase={result.phase} message={result.phaseMessage} />
      )}

      {result.hasResults && result.mode === 'qna' && result.qna && (
        <AnswerCard answer={result.qna.answer} />
      )}

      {result.hasResults && result.mode === 'recommendation' && <ResultsBody result={result} />}

      {result.status === 'error' && !result.hasResults && (
        <ErrorBanner message={result.error ?? 'Something went wrong.'} />
      )}

      {showReasoningPanel && <ReasoningPanel events={result.events} />}
    </section>
  );
}

function ResultsBody({ result }: { result: UIResult }) {
  return (
    <>
      <Header result={result} />

      {result.isEmpty ? (
        <EmptyResults summary={result.summary} />
      ) : (
        <>
          {result.safe.length > 0 && (
            <ResultSection
              tone="safe"
              icon="shield-check"
              title="Safe for you"
              count={result.safe.length}
              items={result.safe}
            />
          )}
          {result.caution.length > 0 && (
            <ResultSection
              tone="caution"
              icon="alert-tri"
              title="Double-check"
              subtitle="Low confidence, missing data, or possible cross-contact. Worth a second look."
              count={result.caution.length}
              items={result.caution}
            />
          )}
          {result.avoid.length > 0 && (
            <ResultSection
              tone="avoid"
              icon="x"
              title="Avoid"
              subtitle="Clear conflicts with your profile. Skip these."
              count={result.avoid.length}
              items={result.avoid}
            />
          )}
        </>
      )}
    </>
  );
}

function Header({ result }: { result: UIResult }) {
  const where = result.location_label ? `at ${result.location_label}` : 'at Cal Poly dining today';
  const headline = result.isEmpty
    ? `Nothing on the menu cleared your profile ${where}.`
    : `Here's what you can eat ${where}.`;
  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <h2
        className="bc-display"
        style={{ fontSize: 26, lineHeight: 1.15, margin: 0, textWrap: 'balance' }}
      >
        {headline}
      </h2>
      {result.summary && (
        <p
          className="bc-body"
          style={{
            color: 'var(--bc-text-sec)',
            margin: 0,
            textWrap: 'pretty',
            maxWidth: 640,
          }}
        >
          {result.summary}
        </p>
      )}
    </header>
  );
}

function ResultSection({
  tone,
  icon,
  title,
  subtitle,
  count,
  items,
}: {
  tone: 'safe' | 'caution' | 'avoid';
  icon: React.ComponentProps<typeof SectionHeader>['icon'];
  title: string;
  subtitle?: string;
  count: number;
  items: UIResult['safe'];
}) {
  return (
    <section>
      <SectionHeader tone={tone} icon={icon} title={title} count={count} subtitle={subtitle} />
      <div
        style={{
          display: 'grid',
          gap: 10,
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        }}
      >
        {items.map((item, i) => (
          <ResultItemCard key={`${tone}-${item.item_name}-${i}`} item={item} />
        ))}
      </div>
    </section>
  );
}

function EmptyResults({ summary }: { summary: string }) {
  return (
    <section
      style={{
        padding: 20,
        borderRadius: 14,
        background: 'var(--bc-surface)',
        border: '1px solid var(--bc-hairline)',
        boxShadow: 'var(--bc-shadow-sm)',
      }}
    >
      <div className="bc-h3" style={{ marginBottom: 6 }}>
        No safe matches today.
      </div>
      <p
        className="bc-body-sm"
        style={{
          color: 'var(--bc-text-sec)',
          margin: 0,
          textWrap: 'pretty',
        }}
      >
        {summary ||
          'Try a different location or meal period — or talk to dining staff to confirm an item directly.'}
      </p>
    </section>
  );
}

function UserQueryBubble({ query }: { query: string }) {
  return (
    <div style={{ alignSelf: 'flex-end', maxWidth: '82%' }}>
      <div
        style={{
          padding: '10px 14px',
          borderRadius: '18px 18px 4px 18px',
          background: 'var(--bc-primary)',
          color: '#fff',
          fontSize: 15,
          lineHeight: 1.5,
          boxShadow: 'var(--bc-shadow-sm)',
        }}
      >
        {query}
      </div>
    </div>
  );
}

/**
 * Q&A mode renders a single conversational answer card. No header, no
 * three-section grid — the user is asking a follow-up about a prior turn,
 * not requesting a fresh ranking.
 */
function AnswerCard({ answer }: { answer: string }) {
  return (
    <article
      style={{
        alignSelf: 'flex-start',
        maxWidth: '92%',
        background: 'var(--bc-surface)',
        border: '1px solid var(--bc-hairline)',
        borderRadius: '18px 18px 18px 4px',
        padding: '14px 16px',
        boxShadow: 'var(--bc-shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px 3px 8px',
          borderRadius: 999,
          background: 'var(--bc-primary-fog)',
          color: 'var(--bc-primary-ink)',
          marginBottom: 10,
        }}
        className="bc-label"
      >
        <BCIcon name="sparkle" size={11} strokeWidth={2.5} />
        BiteCheck
      </div>
      <p
        className="bc-body"
        style={{
          margin: 0,
          color: 'var(--bc-text)',
          textWrap: 'pretty',
          whiteSpace: 'pre-wrap',
        }}
      >
        {answer}
      </p>
    </article>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        background: 'var(--bc-unsafe-fog)',
        color: 'var(--bc-unsafe-ink)',
        border: '1px solid var(--bc-unsafe)',
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      <BCIcon name="alert-tri" size={16} strokeWidth={2.2} />
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>We couldn&apos;t finish that check</div>
        <div className="bc-body-sm" style={{ marginTop: 2 }}>
          {message}
        </div>
      </div>
    </div>
  );
}
