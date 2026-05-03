'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Button, Wordmark } from '@/components/bitecheck/primitives';
import { BCIcon } from '@/components/bitecheck/icons';
import { signInAction, signUpAction, type AuthFormState } from './actions';

type Mode = 'signin' | 'signup';

export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = React.useState<Mode>('signup');
  const action = mode === 'signin' ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, null);

  return (
    <form
      action={formAction}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Mode toggle */}
      <div
        role="tablist"
        aria-label="Authentication mode"
        style={{
          display: 'inline-flex',
          padding: 3,
          borderRadius: 999,
          background: 'var(--bc-surface-alt)',
          border: '1px solid var(--bc-hairline)',
          alignSelf: 'flex-start',
        }}
      >
        <ModeTab active={mode === 'signin'} onClick={() => setMode('signin')}>
          Sign in
        </ModeTab>
        <ModeTab active={mode === 'signup'} onClick={() => setMode('signup')}>
          Create account
        </ModeTab>
      </div>

      <div className="bc-display" style={{ marginTop: 10 }}>
        {mode === 'signin' ? 'Welcome back.' : 'Eat with confidence.'}
      </div>
      <p
        className="bc-body"
        style={{
          color: 'var(--bc-text-sec)',
          marginTop: -6,
          marginBottom: 8,
          textWrap: 'pretty',
        }}
      >
        {mode === 'signin'
          ? 'Sign in to continue auditing Cal Poly dining against your profile.'
          : 'Create an account so we can save your dietary profile and tailor every recommendation.'}
      </p>

      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
        required
        minLength={8}
        hint={mode === 'signup' ? 'At least 8 characters.' : undefined}
      />
      {next && <input type="hidden" name="next" value={next} />}

      {state?.error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--bc-warn-fog)',
            color: 'var(--bc-warn-ink)',
            border: '1px solid transparent',
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          <BCIcon name="alert-tri" size={14} strokeWidth={2.2} />
          <span>{state.error}</span>
        </div>
      )}

      <div style={{ marginTop: 4 }}>
        <Button
          type="submit"
          kind="primary"
          size="lg"
          full
          iconRight="arrow-up"
          label={
            pending
              ? mode === 'signin'
                ? 'Signing in…'
                : 'Creating account…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'
          }
          disabled={pending}
        />
      </div>

      <div className="bc-meta" style={{ color: 'var(--bc-text-ter)', marginTop: 6 }}>
        By {mode === 'signin' ? 'signing in' : 'creating an account'} you agree to use BiteCheck as
        guidance, not medical advice. Always confirm with dining staff for medical-level needs.
      </div>
    </form>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: -0.05,
        background: active ? 'var(--bc-surface)' : 'transparent',
        color: active ? 'var(--bc-text)' : 'var(--bc-text-sec)',
        boxShadow: active ? 'var(--bc-shadow-sm)' : 'none',
        transition: 'background 120ms, color 120ms',
      }}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  required,
  minLength,
  hint,
}: {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password';
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  hint?: string;
}) {
  const id = `f-${name}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        style={{
          height: 44,
          padding: '0 14px',
          borderRadius: 12,
          background: 'var(--bc-surface)',
          border: '1px solid var(--bc-hairline-2)',
          color: 'var(--bc-text)',
          fontFamily: 'var(--bc-font-body)',
          fontSize: 15,
          outline: 'none',
          boxShadow: 'var(--bc-shadow-sm)',
          transition: 'border-color 120ms, box-shadow 120ms',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--bc-primary)';
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--bc-primary-fog), var(--bc-shadow-sm)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--bc-hairline-2)';
          e.currentTarget.style.boxShadow = 'var(--bc-shadow-sm)';
        }}
      />
      {hint && (
        <span className="bc-meta" style={{ color: 'var(--bc-text-ter)', marginTop: 2 }}>
          {hint}
        </span>
      )}
    </div>
  );
}

/** Standalone hero used by the /login page; kept here so the form file owns
 *  the visual identity for the auth flow. */
export function LoginHero() {
  return (
    <div
      style={{
        height: '100%',
        background: 'var(--bc-primary)',
        color: '#fff',
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
          BITECHECK · CAL POLY DINING
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
          }}
        >
          Eat with confidence.
        </div>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.55,
            color: 'rgba(255,255,255,0.78)',
            textWrap: 'pretty',
            maxWidth: 380,
          }}
        >
          We audit dining labels against ingredient lists, allergen fields, and cross-contamination
          warnings — so you don&apos;t have to.
        </p>
      </div>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -60,
          bottom: -40,
          opacity: 0.12,
          color: '#fff',
        }}
      >
        <BCIcon name="shield-check" size={300} strokeWidth={1} />
      </div>
    </div>
  );
}
