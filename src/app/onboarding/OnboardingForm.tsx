"use client";

import * as React from "react";
import { useActionState } from "react";
import { BCIcon } from "@/components/bitecheck/icons";
import { Button, Chip } from "@/components/bitecheck/primitives";
import {
  submitOnboardingAction,
  type OnboardingFormState,
} from "./actions";

const dietaryOptions = [
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "dairy-free", label: "Dairy-free" },
] as const;

const allergenOptions = [
  { value: "nut-allergy", label: "Nut allergy" },
  { value: "peanut-allergy", label: "Peanut allergy" },
  { value: "shellfish-allergy", label: "Shellfish allergy" },
  { value: "soy-allergy", label: "Soy allergy" },
  { value: "egg-allergy", label: "Egg allergy" },
  { value: "sesame-allergy", label: "Sesame allergy" },
] as const;

const religiousOptions = [
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "hindu-vegetarian", label: "Hindu vegetarian" },
  { value: "jain-vegetarian", label: "Jain vegetarian" },
] as const;

const severityOptions = [
  {
    value: "medical",
    label: "Medical",
    description: "Asterisk-marked cross-contact is treated as unsafe.",
  },
  {
    value: "strict",
    label: "Strict",
    description: "Asterisk-marked cross-contact is flagged for caution.",
  },
  {
    value: "preference",
    label: "Preference",
    description: "Cross-contact notes are shown, but not elevated as warnings.",
  },
] as const;

const steps = [
  {
    eyebrow: "Step 1",
    title: "Set your baseline.",
    description: "Tell BiteCheck who you are and what your day should look like.",
  },
  {
    eyebrow: "Step 2",
    title: "Mark diets and allergens.",
    description: "These chips drive filtering, warnings, and what gets hidden.",
  },
  {
    eyebrow: "Step 3",
    title: "Choose how strict to be.",
    description: "Religious restrictions are treated with the same rigor as allergies.",
  },
] as const;

type StepIndex = 0 | 1 | 2;
type Severity = (typeof severityOptions)[number]["value"];

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<
    OnboardingFormState,
    FormData
  >(submitOnboardingAction, null);
  const [step, setStep] = React.useState<StepIndex>(0);
  const [name, setName] = React.useState("");
  const [polycardBalance, setPolycardBalance] = React.useState("");
  const [calorieGoal, setCalorieGoal] = React.useState("");
  const [proteinGoal, setProteinGoal] = React.useState("");
  const [carbGoal, setCarbGoal] = React.useState("");
  const [fatGoal, setFatGoal] = React.useState("");
  const [dietaryPreferences, setDietaryPreferences] = React.useState<string[]>(
    [],
  );
  const [allergens, setAllergens] = React.useState<string[]>([]);
  const [religiousRestrictions, setReligiousRestrictions] = React.useState<
    string[]
  >([]);
  const [severity, setSeverity] = React.useState<Severity | "">("");

  const canAdvanceFromBasics =
    name.trim().length > 0 && polycardBalance.trim().length > 0;
  const canSubmit =
    canAdvanceFromBasics && severity !== "" && !pending;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5"
      style={{ width: "100%" }}
    >
      <HiddenArrayInputs
        name="dietary_preferences"
        values={dietaryPreferences}
      />
      <HiddenArrayInputs name="allergens" values={allergens} />
      <HiddenArrayInputs
        name="religious_restrictions"
        values={religiousRestrictions}
      />

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {steps.map((item, index) => (
            <div
              key={item.eyebrow}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                className="bc-meta"
                style={{
                  minWidth: 30,
                  padding: "5px 9px",
                  borderRadius: 999,
                  background:
                    index === step
                      ? "var(--bc-primary)"
                      : "var(--bc-surface-alt)",
                  color:
                    index === step
                      ? "var(--bc-text-inv)"
                      : "var(--bc-text-sec)",
                  textAlign: "center",
                }}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  aria-hidden
                  style={{
                    width: 18,
                    height: 1,
                    background: "var(--bc-hairline-2)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bc-label" style={{ color: "var(--bc-text-ter)" }}>
          PROFILE SETUP
        </div>
        <div className="bc-display" style={{ marginTop: -2 }}>
          Build your BiteCheck profile.
        </div>
        <p
          className="bc-body"
          style={{
            color: "var(--bc-text-sec)",
            marginTop: -4,
            textWrap: "pretty",
          }}
        >
          Mobile moves through three guided screens. Desktop keeps the same
          flow visible at once so you can review everything before saving.
        </p>
      </section>

      {state?.error && (
        <div
          role="alert"
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            padding: "10px 12px",
            borderRadius: 12,
            background: "var(--bc-warn-fog)",
            color: "var(--bc-warn-ink)",
            border: "1px solid transparent",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          <BCIcon name="alert-tri" size={14} strokeWidth={2.2} />
          <span>{state.error}</span>
        </div>
      )}

      <div className="bc-onboarding-desktop-grid">
        <SectionCard active={step === 0} title="Basics & goals">
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
        </SectionCard>

        <SectionCard active={step === 1} title="Diets & allergens">
          <div className="flex flex-col gap-5">
            <ToggleGroup
              label="Dietary preferences"
              hint="Select every rule BiteCheck should require before it recommends an item."
              options={dietaryOptions}
              selected={dietaryPreferences}
              tone="primary"
              onToggle={(value) =>
                setDietaryPreferences((current) =>
                  toggleValue(current, value),
                )
              }
            />
            <ToggleGroup
              label="Allergens"
              hint="These are handled as non-negotiable restrictions during menu auditing."
              options={allergenOptions}
              selected={allergens}
              tone="unsafe"
              onToggle={(value) =>
                setAllergens((current) => toggleValue(current, value))
              }
            />
          </div>
        </SectionCard>

        <SectionCard active={step === 2} title="Religious rules & severity">
          <div className="flex flex-col gap-5">
            <ToggleGroup
              label="Religious restrictions"
              hint="These restrictions are never treated as casual preferences."
              options={religiousOptions}
              selected={religiousRestrictions}
              tone="primary"
              onToggle={(value) =>
                setReligiousRestrictions((current) =>
                  toggleValue(current, value),
                )
              }
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="bc-label" style={{ color: "var(--bc-text-sec)" }}>
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
                        textAlign: "left",
                        padding: 14,
                        borderRadius: 16,
                        border: `1px solid ${
                          selected
                            ? "var(--bc-primary)"
                            : "var(--bc-hairline)"
                        }`,
                        background: selected
                          ? "var(--bc-primary-fog)"
                          : "var(--bc-surface)",
                        boxShadow: "var(--bc-shadow-sm)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        transition: "border-color 120ms, background 120ms",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <Chip
                          tone="primary"
                          label={option.label}
                          selected={selected}
                        />
                        {selected && (
                          <BCIcon
                            name="check-circle"
                            size={18}
                            strokeWidth={2}
                            style={{ color: "var(--bc-primary)" }}
                          />
                        )}
                      </div>
                      <div
                        className="bc-body-sm"
                        style={{ color: "var(--bc-text-sec)" }}
                      >
                        {option.description}
                      </div>
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="severity" value={severity} />
            </div>
          </div>
        </SectionCard>
      </div>

      <div
        className="bc-onboarding-mobile-nav"
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        {step > 0 && (
          <Button
            type="button"
            kind="secondary"
            size="lg"
            icon="chevron-left"
            label="Back"
            onClick={() => setStep((current) => (current - 1) as StepIndex)}
          />
        )}

        {step < 2 ? (
          <div style={{ marginLeft: "auto" }}>
            <Button
              type="button"
              kind="primary"
              size="lg"
              iconRight="chevron-right"
              label="Continue"
              onClick={() =>
                setStep((current) => (current + 1) as StepIndex)
              }
              disabled={step === 0 ? !canAdvanceFromBasics : false}
            />
          </div>
        ) : (
          <div style={{ marginLeft: "auto", width: "100%" }}>
            <Button
              type="submit"
              kind="primary"
              size="lg"
              full
              iconRight="arrow-up"
              label={pending ? "Saving profile…" : "Finish onboarding"}
              disabled={!canSubmit}
            />
          </div>
        )}
      </div>

      <div
        className="bc-onboarding-desktop-submit"
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          paddingTop: 4,
        }}
      >
        <div className="bc-meta" style={{ color: "var(--bc-text-ter)" }}>
          You can update your profile later. For urgent needs, still confirm
          with dining staff.
        </div>
        <Button
          type="submit"
          kind="primary"
          size="lg"
          iconRight="arrow-up"
          label={pending ? "Saving profile…" : "Finish onboarding"}
          disabled={!canSubmit}
        />
      </div>

      <style>{`
        @media (max-width: 899px) {
          .bc-onboarding-step[data-active="false"] {
            display: none !important;
          }
        }
        @media (min-width: 900px) {
          .bc-onboarding-desktop-grid {
            display: grid !important;
            gap: 14px;
          }
          .bc-onboarding-step {
            display: block !important;
          }
          .bc-onboarding-mobile-nav {
            display: none !important;
          }
          .bc-onboarding-desktop-submit {
            display: flex !important;
          }
        }
      `}</style>
    </form>
  );
}

function SectionCard({
  active,
  title,
  children,
}: {
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="bc-onboarding-step"
      data-active={active}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: 18,
        borderRadius: 20,
        background: "var(--bc-surface)",
        border: "1px solid var(--bc-hairline)",
        boxShadow: "var(--bc-shadow-md)",
      }}
    >
      <div className="bc-h3">{title}</div>
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
  tone: "primary" | "unsafe";
  onToggle: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="bc-label" style={{ color: "var(--bc-text-sec)" }}>
        {label}
      </div>
      <div className="bc-body-sm" style={{ color: "var(--bc-text-ter)" }}>
        {hint}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option.value}
            tone={selected.includes(option.value) ? tone : "neutral"}
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
  type = "text",
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
  type?: "text" | "number";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  placeholder?: string;
  min?: string;
  step?: string;
  required?: boolean;
  hint?: string;
}) {
  const id = `onboarding-${name}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        htmlFor={id}
        className="bc-label"
        style={{ color: "var(--bc-text-sec)" }}
      >
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
        onChange={(event) => onChange(event.currentTarget.value)}
        style={{
          height: 46,
          padding: "0 14px",
          borderRadius: 14,
          background: "var(--bc-surface)",
          border: "1px solid var(--bc-hairline-2)",
          color: "var(--bc-text)",
          fontFamily: "var(--bc-font-body)",
          fontSize: 15,
          outline: "none",
          boxShadow: "var(--bc-shadow-sm)",
          transition: "border-color 120ms, box-shadow 120ms",
        }}
        onFocus={(event) => {
          event.currentTarget.style.borderColor = "var(--bc-primary)";
          event.currentTarget.style.boxShadow =
            "0 0 0 3px var(--bc-primary-fog), var(--bc-shadow-sm)";
        }}
        onBlur={(event) => {
          event.currentTarget.style.borderColor = "var(--bc-hairline-2)";
          event.currentTarget.style.boxShadow = "var(--bc-shadow-sm)";
        }}
      />
      {hint && (
        <span className="bc-meta" style={{ color: "var(--bc-text-ter)" }}>
          {hint}
        </span>
      )}
    </div>
  );
}

function HiddenArrayInputs({
  name,
  values,
}: {
  name: string;
  values: string[];
}) {
  return (
    <>
      {values.map((value) => (
        <input key={`${name}-${value}`} type="hidden" name={name} value={value} />
      ))}
    </>
  );
}

function toggleValue(current: string[], value: string) {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}
