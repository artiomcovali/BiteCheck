import Link from 'next/link';
import { Badge, Chip } from '@/components/bitecheck/primitives';
import type { HydratedUserProfile } from '@/lib/user-profile';
import type { DashboardOverview } from '@/lib/dashboard/overview';
import type { SpendSnapshot } from '@/lib/profile/spend-snapshot';
import { DashboardQuickAsk } from './DashboardQuickAsk';

export function DashboardPage({
  profile,
  spendSnapshot,
  overview,
}: {
  profile: HydratedUserProfile;
  spendSnapshot: SpendSnapshot;
  overview: DashboardOverview;
}) {
  return (
    <main
      style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '28px 20px 56px',
      }}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        {/* Left column — snapshot + ask agent */}
        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <section
            style={{
              padding: 26,
              borderRadius: 28,
              background: 'var(--bc-surface)',
              border: '1px solid var(--bc-hairline)',
              boxShadow: 'var(--bc-shadow-sm)',
              display: 'grid',
              gap: 14,
            }}
          >
            <div className="bc-display" style={{ textWrap: 'balance' }}>
              Good afternoon, {profile.name}.
            </div>
            <p className="bc-body" style={{ color: 'var(--bc-text-sec)', maxWidth: 720 }}>
              Here&apos;s your dining snapshot for today.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge tone="safe" icon="check-circle" label={`${overview.safeItems} safe items`} />
              <Badge tone="warn" icon="alert-tri" label={`${overview.flaggedItems} flagged`} />
              <Badge tone="unsafe" icon="shield-alert" label={`${overview.avoidItems} avoid`} />
            </div>
          </section>

          <DashboardQuickAsk />
        </div>

        {/* Right column — balance + dietary profile */}
        <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <section style={cardStyle()}>
            <div style={sectionHeaderStyle()}>
              <div>
                <div className="bc-label" style={{ color: 'var(--bc-text-ter)' }}>
                  POLYCARD BALANCE
                </div>
                <div className="bc-h2" style={{ marginTop: 6 }}>
                  ${spendSnapshot.balance.toFixed(2)}
                </div>
              </div>
              <Badge tone="primary" icon="sparkle" label={spendSnapshot.planLabel} />
            </div>

            {spendSnapshot.hasPlan ? (
              <>
                <div className="bc-body-sm" style={{ color: 'var(--bc-text-sec)' }}>
                  ${spendSnapshot.balance.toFixed(2)} of ${spendSnapshot.budget.toFixed(2)} semester
                  meal-plan budget remaining.
                </div>
                <ProgressBar
                  percent={spendSnapshot.percentRemaining}
                  tone={progressColor(spendSnapshot.status)}
                />
                <div
                  className="bc-meta"
                  style={{
                    color: 'var(--bc-text-ter)',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{statusLabel(spendSnapshot.status)}</span>
                  <span>{Math.round(spendSnapshot.percentRemaining)}% left</span>
                </div>
              </>
            ) : (
              <div className="bc-body-sm" style={{ color: 'var(--bc-text-sec)' }}>
                Add a meal plan in your{' '}
                <Link href="/profile" style={{ color: 'var(--bc-primary-ink)' }}>
                  profile settings
                </Link>{' '}
                to track how much of your semester allowance is left.
              </div>
            )}
          </section>

          <section style={cardStyle()}>
            <div style={sectionHeaderStyle()}>
              <div className="bc-h2">Dietary profile</div>
              <Link
                href="/profile"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 32,
                  padding: '0 12px',
                  borderRadius: 12,
                  textDecoration: 'none',
                  background: 'var(--bc-surface-alt)',
                  border: '1px solid var(--bc-hairline)',
                  color: 'var(--bc-text)',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Edit profile
              </Link>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <ProfileChipGroup
                title="Dietary"
                values={profile.profile.restrictions}
                tone="primary"
              />
              <ProfileChipGroup
                title="Allergies"
                values={profile.profile.allergens}
                tone="unsafe"
              />
              <ProfileChipGroup
                title="Religious / practice-based"
                values={profile.profile.religious_dietary}
                tone="warn"
              />
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function cardStyle(): React.CSSProperties {
  return {
    display: 'grid',
    gap: 16,
    padding: 22,
    borderRadius: 22,
    background: 'var(--bc-surface)',
    border: '1px solid var(--bc-hairline)',
    boxShadow: 'var(--bc-shadow-sm)',
  };
}

function sectionHeaderStyle(): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  };
}

function ProfileChipGroup({
  title,
  values,
  tone,
}: {
  title: string;
  values: string[];
  tone: 'primary' | 'warn' | 'unsafe';
}) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div className="bc-label" style={{ color: 'var(--bc-text-ter)' }}>
        {title}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {values.length > 0 ? (
          values.map((value) => (
            <Chip
              key={value}
              tone={tone}
              label={value
                .split('-')
                .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
                .join(' ')}
            />
          ))
        ) : (
          <Chip tone="mono" label="None set" />
        )}
      </div>
    </div>
  );
}

function ProgressBar({ percent, tone }: { percent: number; tone: string }) {
  const width = `${Math.max(0, Math.min(100, percent))}%`;
  return (
    <div
      style={{
        height: 10,
        borderRadius: 999,
        background: 'var(--bc-surface-alt)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width,
          height: '100%',
          borderRadius: 999,
          background: tone,
          transition: 'width 320ms ease-out, background 200ms',
        }}
      />
    </div>
  );
}

function progressColor(status: SpendSnapshot['status']): string {
  switch (status) {
    case 'depleted':
      return 'var(--bc-unsafe)';
    case 'low':
      return 'var(--bc-warn)';
    case 'healthy':
      return 'var(--bc-safe)';
    case 'no-plan':
      return 'var(--bc-neutral)';
  }
}

function statusLabel(status: SpendSnapshot['status']): string {
  switch (status) {
    case 'depleted':
      return 'Out of budget — top up your PolyCard';
    case 'low':
      return 'Running low — pace your spending';
    case 'healthy':
      return 'On track for the quarter';
    case 'no-plan':
      return 'No meal plan set';
  }
}
