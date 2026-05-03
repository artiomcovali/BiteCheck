"use client";

import { Button } from "@/components/bitecheck/primitives";

export type MacroFilterState = {
  maxCalories: string;
  minProtein: string;
  maxCarbs: string;
  maxFat: string;
};

export function MacroFilters({
  value,
  onChange,
  onReset,
  shownCount,
  totalCount,
}: {
  value: MacroFilterState;
  onChange: (next: MacroFilterState) => void;
  onReset: () => void;
  shownCount: number;
  totalCount: number;
}) {
  return (
    <section
      style={{
        position: "sticky",
        top: 61,
        zIndex: 20,
        padding: "14px 20px 16px",
        background: "color-mix(in srgb, var(--bc-bg) 94%, transparent)",
        backdropFilter: "saturate(140%) blur(8px)",
        borderBottom: "1px solid var(--bc-hairline)",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="bc-label" style={{ color: "var(--bc-text-ter)" }}>
              Macro filters
            </div>
            <div className="bc-body-sm" style={{ color: "var(--bc-text-sec)" }}>
              Showing {shownCount} of {totalCount} profile-aligned items.
            </div>
          </div>
          <Button kind="soft" size="sm" label="Clear filters" onClick={onReset} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MacroField
            label="Max calories"
            value={value.maxCalories}
            onChange={(next) => onChange({ ...value, maxCalories: next })}
          />
          <MacroField
            label="Min protein"
            value={value.minProtein}
            onChange={(next) => onChange({ ...value, minProtein: next })}
          />
          <MacroField
            label="Max carbs"
            value={value.maxCarbs}
            onChange={(next) => onChange({ ...value, maxCarbs: next })}
          />
          <MacroField
            label="Max fat"
            value={value.maxFat}
            onChange={(next) => onChange({ ...value, maxFat: next })}
          />
        </div>
      </div>
    </section>
  );
}

function MacroField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span className="bc-label" style={{ color: "var(--bc-text-sec)" }}>
        {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder="Any"
        style={{
          height: 42,
          padding: "0 14px",
          borderRadius: 14,
          background: "var(--bc-surface)",
          border: "1px solid var(--bc-hairline-2)",
          color: "var(--bc-text)",
          fontFamily: "var(--bc-font-body)",
          fontSize: 14,
          outline: "none",
          boxShadow: "var(--bc-shadow-sm)",
        }}
      />
    </label>
  );
}
