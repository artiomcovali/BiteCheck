import { BCIcon } from '@/components/bitecheck/icons';
import { Wordmark } from '@/components/bitecheck/primitives';
import { OnboardingForm } from './OnboardingForm';

export const metadata = {
  title: 'Onboarding · BiteCheck',
};

export default function OnboardingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        background: 'var(--bc-bg)',
      }}
      className="bc-onboarding-shell"
    >
      <aside className="bc-onboarding-hero">
        <OnboardingHero />
      </aside>
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
          <OnboardingForm />
        </div>
      </main>

      <style>{`
        @media (min-width: 900px) {
          .bc-onboarding-shell {
            grid-template-columns: minmax(340px, 0.95fr) minmax(0, 1.05fr) !important;
          }
        }
        @media (max-width: 899px) {
          .bc-onboarding-hero {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

function OnboardingHero() {
  return (
    <div
      style={{
        height: '100%',
        background: 'var(--bc-primary)',
        color: 'var(--bc-text-inv)',
        padding: '56px 48px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}>
        <Wordmark size={20} />
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          className="bc-label"
          style={{
            color: 'var(--bc-primary-fog)',
            opacity: 0.82,
            marginBottom: 12,
          }}
        >
          PROFILE SETUP
        </div>
        <div
          style={{
            fontFamily: 'var(--bc-font-display)',
            fontSize: 44,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: -0.8,
            marginBottom: 18,
            textWrap: 'balance',
            maxWidth: 420,
          }}
        >
          Tell us how to audit your food.
        </div>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.55,
            color: 'rgba(255,255,255,0.78)',
            textWrap: 'pretty',
            maxWidth: 390,
          }}
        >
          BiteCheck will use your profile to filter recommendations, flag cross-contact risk, and
          keep religious dietary rules non-negotiable.
        </p>
      </div>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -54,
          bottom: -48,
          opacity: 0.12,
          color: '#fff',
        }}
      >
        <BCIcon name="shield-check" size={300} strokeWidth={1} />
      </div>
    </div>
  );
}
