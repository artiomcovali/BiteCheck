'use client';

import * as React from 'react';
import { Badge } from '@/components/bitecheck/primitives';
import { BCIcon, type IconName } from '@/components/bitecheck/icons';
import type { UIBucket, UIItem } from '@/lib/chat/derive-ui-result';
import { fieldLabel, ISSUE_LABEL } from '@/lib/menu/field-labels';

/**
 * Compact result card — fits 3–4 per row in a grid.
 *
 * Shows: bold name, location + macros, confidence/issue badge,
 * and a collapsible "Why it's safe" / "Why avoid this" section.
 */
export function ResultItemCard({ item }: { item: UIItem }) {
  const [expanded, setExpanded] = React.useState(false);
  const tone = TONE_BY_BUCKET[item.bucket];
  const checks = React.useMemo(() => deriveChecks(item), [item]);
  const expandable = checks.length > 0;
  const buttonLabel = EXPAND_LABEL[item.bucket];

  return (
    <article
      style={{
        background: 'var(--bc-surface)',
        borderRadius: 14,
        border: `1px solid ${tone.border}`,
        boxShadow: 'var(--bc-shadow-sm)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ height: 2, background: tone.stripe }} />
      <div
        style={{
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flex: 1,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--bc-font-display)',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: -0.15,
            color: 'var(--bc-text)',
            lineHeight: 1.25,
          }}
        >
          {item.item_name}
        </div>

        <div className="bc-meta" style={{ color: 'var(--bc-text-ter)' }}>
          {[item.location, item.nutrition_summary].filter(Boolean).join(' · ') || ' '}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            {item.confidence ? (
              <ConfidenceTag confidence={item.confidence} />
            ) : (
              item.issue && <IssueTag issue={item.issue} bucket={item.bucket} />
            )}
          </div>

          {expandable && (
            <>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--bc-text-sec)',
                  padding: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'var(--bc-font-body)',
                }}
              >
                <span>{buttonLabel}</span>
                <span
                  aria-hidden
                  style={{
                    display: 'inline-flex',
                    transition: 'transform 200ms',
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                  }}
                >
                  <BCIcon name="chevron-down" size={12} strokeWidth={2} />
                </span>
              </button>
              {expanded && <ChecklistPanel checks={checks} />}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

const TONE_BY_BUCKET: Record<UIBucket, { stripe: string; border: string }> = {
  safe: {
    stripe: 'var(--bc-safe)',
    border: 'var(--bc-hairline)',
  },
  caution: {
    stripe: 'var(--bc-warn)',
    border: 'color-mix(in srgb, var(--bc-warn) 40%, var(--bc-hairline))',
  },
  avoid: {
    stripe: 'var(--bc-unsafe)',
    border: 'color-mix(in srgb, var(--bc-unsafe) 50%, var(--bc-hairline))',
  },
};

const EXPAND_LABEL: Record<UIBucket, string> = {
  safe: "Why it's safe",
  caution: 'Why double-check',
  avoid: 'Why avoid this',
};

type CheckStatus = 'pass' | 'fail';

type Check = {
  status: CheckStatus;
  label: string;
  note?: string;
};

function deriveChecks(item: UIItem): Check[] {
  const checks: Check[] = [];

  if (item.issue) {
    checks.push({
      status: 'fail',
      label: ISSUE_LABEL[item.issue],
      note: item.short_explanation,
    });
  }

  if (item.source_fields?.length) {
    const seen = new Set<string>();
    for (const field of item.source_fields) {
      const label = fieldLabel(field);
      if (seen.has(label)) continue;
      seen.add(label);
      checks.push({ status: 'pass', label });
    }
  }

  return checks;
}

function ChecklistPanel({ checks }: { checks: Check[] }) {
  return (
    <div className="bc-expand" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {checks.map((check, i) => (
          <CheckRow key={`${check.label}-${i}`} check={check} />
        ))}
      </ul>
    </div>
  );
}

function CheckRow({ check }: { check: Check }) {
  const passed = check.status === 'pass';
  const tone = passed
    ? { fg: 'var(--bc-safe-ink)', bg: 'var(--bc-safe-fog)', icon: 'check' as const }
    : {
        fg: 'var(--bc-warn-ink)',
        bg: 'var(--bc-warn-fog)',
        icon: 'alert-tri' as const,
      };
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 8,
        background: tone.bg,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 16,
          height: 16,
          borderRadius: 999,
          background: 'var(--bc-surface)',
          color: tone.fg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <BCIcon name={tone.icon} size={9} strokeWidth={2.6} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: tone.fg,
            letterSpacing: -0.05,
          }}
        >
          {check.label}
          {passed && (
            <span
              style={{
                marginLeft: 4,
                fontWeight: 500,
                color: 'var(--bc-text-sec)',
              }}
            >
              ✓
            </span>
          )}
        </div>
        {check.note && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--bc-text-sec)',
              marginTop: 1,
              lineHeight: 1.4,
            }}
          >
            {check.note}
          </div>
        )}
      </div>
    </li>
  );
}

function ConfidenceTag({ confidence }: { confidence: NonNullable<UIItem['confidence']> }) {
  if (confidence === 'high') {
    return <Badge tone="safe" icon="shield-check" label="High confidence" />;
  }
  if (confidence === 'medium') {
    return <Badge tone="primary" icon="check" label="Medium confidence" />;
  }
  return <Badge tone="warn" icon="help" label="Low confidence" />;
}

function IssueTag({ issue, bucket }: { issue: NonNullable<UIItem['issue']>; bucket: UIBucket }) {
  const meta: Record<NonNullable<UIItem['issue']>, { label: string; icon: IconName }> = {
    label_conflict: { label: 'Label conflict', icon: 'alert-tri' },
    cross_contamination_risk: {
      label: 'Cross-contact',
      icon: 'shield-alert',
    },
    ambiguous_data: { label: 'Unclear', icon: 'help' },
    missing_data: { label: 'Missing data', icon: 'database' },
  };
  const m = meta[issue];
  return <Badge tone={bucket === 'avoid' ? 'unsafe' : 'warn'} icon={m.icon} label={m.label} />;
}
