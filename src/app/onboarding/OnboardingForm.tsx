'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { BCIcon } from '@/components/bitecheck/icons';
import { Button, Chip } from '@/components/bitecheck/primitives';
import { submitOnboardingAction, type OnboardingFormState } from './actions';
import {
  ALLERGEN_OPTIONS as allergenOptions,
  DIETARY_PREFERENCE_OPTIONS as dietaryOptions,
  HOUSING_OPTIONS as housingOptions,
  MEAL_PLAN_OPTIONS as mealPlanOptions,
  PROFILE_SECTIONS,
  RELIGIOUS_RESTRICTION_OPTIONS as religiousOptions,
  SCHOOL_OPTIONS as schoolOptions,
  SEVERITY_OPTIONS as severityOptions,
} from '@/lib/profile/options';

const STEPS = [
  {
    title: 'Set your baseline',
    description: 'Tell BiteCheck who you are and what your dining setup looks like.',
  },
  {
    title: 'Mark diets, allergens, and religious rules',
    description: 'These drive filtering, warnings, and what gets hidden from recommendations.',
  },
  {
    title: 'Choose how strict to be',
    description: 'This controls how BiteCheck handles cross-contamination and ambiguous data.',
  },
] as const;

type StepIndex = 0 | 1 | 2;
type Severity = (typeof severityOptions)[number]['value'];

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<OnboardingFormState, FormData>(
    submitOnboardingAction,
    null,
  );
  const [step, setStep] = React.useState<StepIndex>(0);
  const [name, setName] = React.useState('');
  const [polycardBalance, setPolycardBalance] = React.useState('');
  const [school, setSchool] = React.useState<string>(schoolOptions[0]?.value ?? 'cal-poly-slo');
  const [mealPlan, setMealPlan] = React.useState<string>('');
  const [housing, setHousing] = React.useState<string>('');
  const [calorieGoal, setCalorieGoal] = React.useState('');
  const [proteinGoal, setProteinGoal] = React.useState('');
  const [carbGoal, setCarbGoal] = React.useState('');
  const [fatGoal, setFatGoal] = React.useState('');
  const [defaultLocations, setDefaultLocations] = React.useState<string[]>([]);
  const [showLowConfidence, setShowLowConfidence] = React.useState(true);
  const [requireManualVerification, setRequireManualVerification] = React.useState(true);
  const [dietaryPreferences, setDietaryPreferences] = React.useState<string[]>([]);
  const [allergens, setAllergens] = React.useState<string[]>([]);
  const [religiousRestrictions, setReligiousRestrictions] = React.useState<string[]>([]);
  const [severity, setSeverity] = React.useState<Severity | ''>('');

  const canAdvanceFromBasics = name.trim().length > 0 && polycardBalance.trim().length > 0;
  const canSubmit = canAdvanceFromBasics && severity !== '' && !pending;

  const currentStep = STEPS[step];

  return (
    <form
      action={formAction}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* Hidden inputs for ALL fields — always present regardless of which step is rendered */}
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="polycard_balance" value={polycardBalance} />
      <input type="hidden" name="school" value={school} />
      <input type="hidden" name="meal_plan" value={mealPlan} />
      <input type="hidden" name="housing" value={housing} />
      <input type="hidden" name="calorie_goal" value={calorieGoal} />
      <input type="hidden" name="protein_goal" value={proteinGoal} />
      <input type="hidden" name="carb_goal" value={carbGoal} />
      <input type="hidden" name="fat_goal" value={fatGoal} />
      <input type="hidden" name="severity" value={severity} />
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
      <HiddenArrayInputs name="dietary_preferences" values={dietaryPreferences} />
      <HiddenArrayInputs name="allergens" values={allergens} />
      <HiddenArrayInputs name="default_locations" values={defaultLocations} />
      <HiddenArrayInputs name="religious_restrictions" values={religiousRestrictions} />

      {/* Header with step indicator */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {STEPS.map((_, index) => (
            <React.Fragment key={index}>
              <button
                type="button"
                onClick={() => {
                  if (
                    index === 0 ||
                    (index === 1 && canAdvanceFromBasics) ||
                    (index === 2 && canAdvanceFromBasics)
                  ) {
                    setStep(index as StepIndex);
                  }
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  border: 'none',
                  background:
                    index === step
                      ? 'var(--bc-primary)'
                      : index < step
                        ? 'var(--bc-safe)'
                        : 'var(--bc-surface-alt)',
                  color: index <= step ? 'var(--bc-text-inv)' : 'var(--bc-text-sec)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 200ms',
                }}
              >
                {index < step ? <BCIcon name="check" size={14} strokeWidth={2.5} /> : index + 1}
              </button>
              {index < STEPS.length - 1 && (
                <div
                  aria-hidden
                  style={{
                    width: 32,
                    height: 2,
                    borderRadius: 1,
                    background: index < step ? 'var(--bc-safe)' : 'var(--bc-hairline-2)',
                    transition: 'background 200ms',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bc-label" style={{ color: 'var(--bc-text-ter)', marginTop: 4 }}>
          STEP {step + 1} OF 3
        </div>
        <div className="bc-display" style={{ marginTop: -2 }}>
          {currentStep.title}
        </div>
        <p
          className="bc-body"
          style={{ color: 'var(--bc-text-sec)', marginTop: -4, textWrap: 'pretty' }}
        >
          {currentStep.description}
        </p>
      </section>

      {state?.error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            padding: '10px 12px',
            borderRadius: 12,
            background: 'var(--bc-warn-fog)',
            color: 'var(--bc-warn-ink)',
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          <BCIcon name="alert-tri" size={14} strokeWidth={2.2} />
          <span>{state.error}</span>
        </div>
      )}

      {/* Step 1: Basics */}
      {step === 0 && (
        <StepCard>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Name"
              name="name"
              value={name}
              onChange={setName}
              autoComplete="name"
              placeholder="Maya"
              required
            />
            <Field
              label="PolyCard balance"
              name="polycard_balance"
              type="number"
              inputMode="decimal"
              value={polycardBalance}
              onChange={setPolycardBalance}
              placeholder="125.50"
              min="0"
              step="0.01"
              required
            />
            <Select label="School" name="school" value={school} onChange={setSchool}>
              {schoolOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Select label="Meal plan" name="meal_plan" value={mealPlan} onChange={setMealPlan}>
              <option value="">Select a plan</option>
              {mealPlanOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Select label="Housing / dorm" name="housing" value={housing} onChange={setHousing}>
              <option value="">Select a residence</option>
              {housingOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Field
              label="Calorie goal"
              name="calorie_goal"
              type="number"
              inputMode="numeric"
              value={calorieGoal}
              onChange={setCalorieGoal}
              placeholder="2200"
              min="0"
              step="1"
              hint="Optional"
            />
            <Field
              label="Protein goal"
              name="protein_goal"
              type="number"
              inputMode="numeric"
              value={proteinGoal}
              onChange={setProteinGoal}
              placeholder="130"
              min="0"
              step="1"
              hint="Optional"
            />
            <Field
              label="Carb goal"
              name="carb_goal"
              type="number"
              inputMode="numeric"
              value={carbGoal}
              onChange={setCarbGoal}
              placeholder="250"
              min="0"
              step="1"
              hint="Optional"
            />
            <Field
              label="Fat goal"
              name="fat_goal"
              type="number"
              inputMode="numeric"
              value={fatGoal}
              onChange={setFatGoal}
              placeholder="70"
              min="0"
              step="1"
              hint="Optional"
            />
          </div>
        </StepCard>
      )}

      {/* Step 2: Diets, Allergens & Religious */}
      {step === 1 && (
        <StepCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ToggleGroup
              label="Dietary preferences"
              hint="Select every rule BiteCheck should require before it recommends an item."
              options={dietaryOptions}
              selected={dietaryPreferences}
              tone="primary"
              onToggle={(v) => setDietaryPreferences((c) => toggleValue(c, v))}
            />
            <ToggleGroup
              label="Allergens"
              hint="These are handled as non-negotiable restrictions during menu auditing."
              options={allergenOptions}
              selected={allergens}
              tone="unsafe"
              onToggle={(v) => setAllergens((c) => toggleValue(c, v))}
            />
            <ToggleGroup
              label="Religious restrictions"
              hint="These restrictions are never treated as casual preferences."
              options={religiousOptions}
              selected={religiousRestrictions}
              tone="primary"
              onToggle={(v) => setReligiousRestrictions((c) => toggleValue(c, v))}
            />
          </div>
        </StepCard>
      )}

      {/* Step 3: Severity & Safety */}
      {step === 2 && (
        <StepCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
                Severity
              </div>
              <div className="grid gap-3">
                {severityOptions.map((option) => {
                  const selected = severity === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSeverity(option.value)}
                      aria-pressed={selected}
                      style={{
                        textAlign: 'left',
                        padding: 14,
                        borderRadius: 16,
                        border: `1px solid ${selected ? 'var(--bc-primary)' : 'var(--bc-hairline)'}`,
                        background: selected ? 'var(--bc-primary-fog)' : 'var(--bc-surface)',
                        boxShadow: 'var(--bc-shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        cursor: 'pointer',
                        transition: 'border-color 120ms, background 120ms',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <Chip tone="primary" label={option.label} selected={selected} />
                        {selected && (
                          <BCIcon
                            name="check-circle"
                            size={18}
                            strokeWidth={2}
                            style={{ color: 'var(--bc-primary)' }}
                          />
                        )}
                      </div>
                      <div className="bc-body-sm" style={{ color: 'var(--bc-text-sec)' }}>
                        {option.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
                Safety preferences
              </div>
              <SafetyToggle
                label="Show low-confidence items"
                checked={showLowConfidence}
                onChange={setShowLowConfidence}
              />
              <SafetyToggle
                label="Require manual verification for missing ingredient data"
                checked={requireManualVerification}
                onChange={setRequireManualVerification}
              />
            </div>
          </div>
        </StepCard>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {step > 0 && (
          <Button
            type="button"
            kind="secondary"
            size="lg"
            icon="chevron-left"
            label="Back"
            onClick={() => setStep((c) => (c - 1) as StepIndex)}
          />
        )}
        <div style={{ marginLeft: 'auto' }}>
          {step < 2 ? (
            <Button
              type="button"
              kind="primary"
              size="lg"
              iconRight="chevron-right"
              label="Continue"
              onClick={() => setStep((c) => (c + 1) as StepIndex)}
              disabled={step === 0 ? !canAdvanceFromBasics : false}
            />
          ) : (
            <Button
              type="submit"
              kind="primary"
              size="lg"
              iconRight="arrow-up"
              label={pending ? 'Saving profile…' : 'Finish onboarding'}
              disabled={!canSubmit}
            />
          )}
        </div>
      </div>

      <div className="bc-meta" style={{ color: 'var(--bc-text-ter)', textAlign: 'center' }}>
        You can update your profile later. For urgent needs, still confirm with dining staff.
      </div>
    </form>
  );
}

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="bc-card-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: 22,
        borderRadius: 22,
        background: 'var(--bc-surface)',
        border: '1px solid var(--bc-hairline)',
        boxShadow: 'var(--bc-shadow-md)',
      }}
    >
      {children}
    </section>
  );
}

function ToggleGroup({
  label,
  hint,
  options,
  selected,
  tone,
  onToggle,
}: {
  label: string;
  hint: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  selected: string[];
  tone: 'primary' | 'unsafe';
  onToggle: (value: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
        {label}
      </div>
      <div className="bc-body-sm" style={{ color: 'var(--bc-text-ter)' }}>
        {hint}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map((option) => (
          <Chip
            key={option.value}
            tone={selected.includes(option.value) ? tone : 'neutral'}
            label={option.label}
            selected={false}
            onClick={() => onToggle(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  inputMode,
  autoComplete,
  placeholder,
  min,
  step,
  required,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  placeholder?: string;
  min?: string;
  step?: string;
  required?: boolean;
  hint?: string;
}) {
  const id = `onboarding-${name}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        min={min}
        step={step}
        required={required}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        style={{
          height: 46,
          padding: '0 14px',
          borderRadius: 14,
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
        <span className="bc-meta" style={{ color: 'var(--bc-text-ter)' }}>
          {hint}
        </span>
      )}
    </div>
  );
}

function Select({
  label,
  name,
  value,
  onChange,
  hint,
  children,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  children: React.ReactNode;
}) {
  const id = `onboarding-${name}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <label htmlFor={id} className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        style={{
          height: 46,
          padding: '0 14px',
          borderRadius: 14,
          background: 'var(--bc-surface)',
          border: '1px solid var(--bc-hairline-2)',
          color: 'var(--bc-text)',
          fontFamily: 'var(--bc-font-body)',
          fontSize: 15,
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2354585a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: 36,
        }}
      >
        {children}
      </select>
      {hint && (
        <span className="bc-meta" style={{ color: 'var(--bc-text-ter)' }}>
          {hint}
        </span>
      )}
    </div>
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

function toggleValue(current: string[], value: string) {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

function SafetyToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 14,
        background: 'var(--bc-surface-alt)',
        border: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'var(--bc-font-body)',
      }}
    >
      <span className="bc-body-sm">{label}</span>
      <span
        aria-hidden
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
    </button>
  );
}
