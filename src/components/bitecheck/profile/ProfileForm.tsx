'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Button, Chip } from '@/components/bitecheck/primitives';
import type { HydratedUserProfile } from '@/lib/user-profile';
import {
  ALLERGEN_OPTIONS,
  DIETARY_PREFERENCE_OPTIONS,
  HOUSING_OPTIONS,
  MEAL_PLAN_OPTIONS,
  PROFILE_SECTIONS,
  RELIGIOUS_RESTRICTION_OPTIONS,
  SCHOOL_OPTIONS,
  SEVERITY_OPTIONS,
} from '@/lib/profile/options';
import { updateProfileAction, type ProfileFormState } from '@/app/profile/actions';

export function ProfileForm({ profile }: { profile: HydratedUserProfile }) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    null,
  );
  const [dietaryPreferences, setDietaryPreferences] = React.useState(profile.profile.restrictions);
  const [allergens, setAllergens] = React.useState(profile.profile.allergens);
  const [religiousRestrictions, setReligiousRestrictions] = React.useState(
    profile.profile.religious_dietary,
  );
  const [severity, setSeverity] = React.useState(profile.profile.severity);
  const [defaultLocations, setDefaultLocations] = React.useState<string[]>(
    profile.default_locations.length > 0
      ? profile.default_locations
      : PROFILE_SECTIONS.defaultDiningLocations.slice(0, 2),
  );
  const [showLowConfidence, setShowLowConfidence] = React.useState(profile.show_low_confidence);
  const [requireManualVerification, setRequireManualVerification] = React.useState(
    profile.require_manual_verification,
  );

  return (
    <form action={formAction} style={{ display: 'grid', gap: 24 }}>
      <HiddenArrayInputs name="dietary_preferences" values={dietaryPreferences} />
      <HiddenArrayInputs name="allergens" values={allergens} />
      <HiddenArrayInputs name="religious_restrictions" values={religiousRestrictions} />
      <HiddenArrayInputs name="default_locations" values={defaultLocations} />
      {/* Checkboxes-as-hidden so we always send an explicit value (form
          fields that aren't toggled don't appear in FormData otherwise). */}
      <input
        type="hidden"
        name="show_low_confidence"
        value={showLowConfidence ? 'true' : 'false'}
      />
      <input
        type="hidden"
        name="require_manual_verification"
        value={requireManualVerification ? 'true' : 'false'}
      />

      {/* Header row with title + save button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          padding: 26,
          borderRadius: 24,
          background: 'var(--bc-surface)',
          border: '1px solid var(--bc-hairline)',
          boxShadow: 'var(--bc-shadow-sm)',
        }}
      >
        <div style={{ display: 'grid', gap: 6 }}>
          <div className="bc-label" style={{ color: 'var(--bc-text-ter)' }}>
            PROFILE & SETTINGS
          </div>
          <div className="bc-display">Keep BiteCheck aligned to you.</div>
          <p className="bc-body" style={{ color: 'var(--bc-text-sec)', maxWidth: 760 }}>
            Update the profile BiteCheck uses for menu filtering, warnings, and recommendations.
          </p>
        </div>
        <Button
          type="submit"
          kind="primary"
          label={pending ? 'Saving...' : 'Save changes'}
          disabled={pending}
        />
      </div>

      {state?.error && state.error.length > 0 && (
        <div
          role="alert"
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            background: 'var(--bc-warn-fog)',
            color: 'var(--bc-warn-ink)',
          }}
        >
          {state.error}
        </div>
      )}

      {state?.success && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            background: 'var(--bc-safe-fog)',
            color: 'var(--bc-safe-ink)',
          }}
        >
          {state.success}
        </div>
      )}

      {/* Two-column: Basic profile (left) + Dietary/Allergies/Religious (right) */}
      <div className="grid gap-4 xl:grid-cols-2" style={{ alignItems: 'start' }}>
        <SectionCard title="Basic profile">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" name="name" defaultValue={profile.name} required />
            <Field
              label="PolyCard balance"
              name="polycard_balance"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              defaultValue={profile.polycard_balance.toFixed(2)}
              required
            />
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
                School
              </span>
              <select name="school" defaultValue={profile.school} style={selectStyle()}>
                {SCHOOL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
                Meal plan
              </span>
              <select name="meal_plan" defaultValue={profile.meal_plan ?? ''} style={selectStyle()}>
                <option value="">Select a plan</option>
                {MEAL_PLAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
                Housing / dorm
              </span>
              <select name="housing" defaultValue={profile.housing ?? ''} style={selectStyle()}>
                <option value="">Select a residence</option>
                {HOUSING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: 'grid', gap: 8 }}>
              <div className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
                Default dining locations
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PROFILE_SECTIONS.defaultDiningLocations.map((location) => {
                  const selected = defaultLocations.includes(location);
                  return (
                    <Chip
                      key={location}
                      tone="primary"
                      label={location}
                      selected={selected}
                      onClick={() =>
                        setDefaultLocations((current) =>
                          selected
                            ? current.filter((value) => value !== location)
                            : [...current, location],
                        )
                      }
                    />
                  );
                })}
              </div>
            </div>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
                Email
              </span>
              <Button kind="secondary" label="Change email" full onClick={() => {}} />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
                Password
              </span>
              <Button kind="secondary" label="Change password" full onClick={() => {}} />
            </label>
          </div>
        </SectionCard>

        <div style={{ display: 'grid', gap: 16 }}>
          <SectionCard title="Dietary preferences">
            <ToggleGroup
              options={DIETARY_PREFERENCE_OPTIONS}
              selected={dietaryPreferences}
              tone="primary"
              onToggle={(value) =>
                setDietaryPreferences((current) =>
                  current.includes(value)
                    ? current.filter((entry) => entry !== value)
                    : [...current, value],
                )
              }
            />
          </SectionCard>

          <SectionCard title="Allergies">
            <ToggleGroup
              options={ALLERGEN_OPTIONS}
              selected={allergens}
              tone="unsafe"
              onToggle={(value) =>
                setAllergens((current) =>
                  current.includes(value)
                    ? current.filter((entry) => entry !== value)
                    : [...current, value],
                )
              }
            />
          </SectionCard>

          <SectionCard title="Religious / practice-based">
            <ToggleGroup
              options={RELIGIOUS_RESTRICTION_OPTIONS}
              selected={religiousRestrictions}
              tone="warn"
              onToggle={(value) =>
                setReligiousRestrictions((current) =>
                  current.includes(value)
                    ? current.filter((entry) => entry !== value)
                    : [...current, value],
                )
              }
            />
          </SectionCard>
        </div>
      </div>

      {/* Full-width safety preferences */}
      <SectionCard title="Safety preferences">
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
              Cross-contamination handling
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {SEVERITY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: 14,
                    borderRadius: 16,
                    border:
                      severity === option.value
                        ? '1px solid transparent'
                        : '1px solid var(--bc-hairline)',
                    background:
                      severity === option.value ? 'var(--bc-primary-fog)' : 'var(--bc-surface-alt)',
                    cursor: 'pointer',
                  }}
                >
                  <GreenRadio
                    checked={severity === option.value}
                    onChange={() => setSeverity(option.value)}
                    name="severity"
                    value={option.value}
                  />
                  <div style={{ display: 'grid', gap: 4 }}>
                    <div className="bc-h3" style={{ fontSize: 15 }}>
                      {option.label}
                    </div>
                    <div className="bc-body-sm" style={{ color: 'var(--bc-text-sec)' }}>
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <ToggleRow
              label="Show low-confidence items"
              checked={showLowConfidence}
              onChange={setShowLowConfidence}
            />
            <ToggleRow
              label="Require manual verification for missing ingredient data"
              checked={requireManualVerification}
              onChange={setRequireManualVerification}
            />
          </div>
        </div>
      </SectionCard>
    </form>
  );
}

function HiddenArrayInputs({ name, values }: { name: string; values: string[] }) {
  return (
    <>
      {values.map((value) => (
        <input key={`${name}-${value}`} type="hidden" name={name} value={value} />
      ))}
    </>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
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
      <div className="bc-h2">{title}</div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
        {label}
      </span>
      <input
        {...props}
        style={{
          height: 42,
          padding: '0 14px',
          borderRadius: 14,
          background: 'var(--bc-bg)',
          border: '1px solid var(--bc-hairline-2)',
          color: 'var(--bc-text)',
          fontFamily: 'var(--bc-font-body)',
          fontSize: 14,
          outline: 'none',
        }}
      />
      {hint && (
        <span className="bc-meta" style={{ color: 'var(--bc-text-ter)' }}>
          {hint}
        </span>
      )}
    </label>
  );
}

function selectStyle(): React.CSSProperties {
  return {
    height: 42,
    padding: '0 14px',
    borderRadius: 14,
    background: 'var(--bc-bg)',
    border: '1px solid var(--bc-hairline-2)',
    color: 'var(--bc-text)',
    fontFamily: 'var(--bc-font-body)',
    fontSize: 14,
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2354585a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: 36,
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

function ToggleGroup({
  options,
  selected,
  tone,
  onToggle,
}: {
  options: ReadonlyArray<{ value: string; label: string }>;
  selected: string[];
  tone: 'primary' | 'warn' | 'unsafe';
  onToggle: (value: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((option) => (
        <Chip
          key={option.value}
          tone={tone}
          label={option.label}
          selected={selected.includes(option.value)}
          onClick={() => onToggle(option.value)}
        />
      ))}
    </div>
  );
}

function GreenRadio({
  checked,
  onChange,
  name,
  value,
}: {
  checked: boolean;
  onChange: () => void;
  name: string;
  value: string;
}) {
  return (
    <span
      role="radio"
      aria-checked={checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') onChange();
      }}
      style={{
        width: 20,
        height: 20,
        borderRadius: 999,
        border: checked ? '2px solid var(--bc-primary)' : '2px solid var(--bc-hairline-2)',
        background: checked ? 'var(--bc-primary)' : 'var(--bc-surface)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: 'pointer',
        marginTop: 2,
        transition: 'background 120ms, border-color 120ms',
      }}
    >
      {checked && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: '#fff',
          }}
        />
      )}
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />
    </span>
  );
}

function GreenCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') onChange(!checked);
      }}
      style={{
        width: 22,
        height: 22,
        borderRadius: 999,
        border: checked ? '2px solid var(--bc-primary)' : '2px solid var(--bc-hairline-2)',
        background: checked ? 'var(--bc-primary)' : 'var(--bc-surface)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: 'pointer',
        transition: 'background 120ms, border-color 120ms',
      }}
    >
      {checked && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 14,
        background: 'var(--bc-surface-alt)',
        cursor: 'pointer',
      }}
    >
      <span className="bc-body-sm">{label}</span>
      <GreenCheckbox checked={checked} onChange={onChange} />
    </label>
  );
}
