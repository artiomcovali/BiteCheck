"use client";

import * as React from "react";
import { Badge, Button } from "@/components/bitecheck/primitives";
import { TopBar } from "@/components/bitecheck/chat/TopBar";
import type { MenuItem } from "@/lib/types";
import { LocationGroups } from "./LocationGroups";
import { MacroFilters, type MacroFilterState } from "./MacroFilters";

export type HiddenMenuEntry = {
  item: MenuItem;
  reason: string;
};

const EMPTY_FILTERS: MacroFilterState = {
  maxCalories: "",
  minProtein: "",
  maxCarbs: "",
  maxFat: "",
};

export function MenuList({
  dateLabel,
  visibleItems,
  hiddenItems,
}: {
  dateLabel: string;
  visibleItems: MenuItem[];
  hiddenItems: HiddenMenuEntry[];
}) {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [filters, setFilters] = React.useState<MacroFilterState>(EMPTY_FILTERS);

  React.useEffect(() => {
    const root = document.documentElement;
    const initial =
      root.getAttribute("data-theme") ??
      (window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(initial as "light" | "dark");
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const filteredVisibleItems = React.useMemo(
    () => applyMacroFilters(visibleItems, filters),
    [filters, visibleItems],
  );

  const visibleEntries = React.useMemo(
    () => filteredVisibleItems.map((item) => ({ item })),
    [filteredVisibleItems],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bc-bg)",
      }}
    >
      <TopBar
        onThemeToggle={() =>
          setTheme((current) => (current === "dark" ? "light" : "dark"))
        }
        isDark={theme === "dark"}
      />

      <MacroFilters
        value={filters}
        onChange={setFilters}
        onReset={() => setFilters(EMPTY_FILTERS)}
        shownCount={filteredVisibleItems.length}
        totalCount={visibleItems.length}
      />

      <main
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "28px 20px 56px",
          display: "grid",
          gap: 24,
        }}
      >
        <section style={{ display: "grid", gap: 10 }}>
          <Badge tone="primary" icon="list" label={dateLabel} />
          <div className="bc-display">Today&apos;s menu, filtered through your profile.</div>
          <p className="bc-body" style={{ color: "var(--bc-text-sec)", maxWidth: 760 }}>
            These items are grouped by building and location. Macro filters narrow
            the visible set, while anything hidden by your dietary profile stays
            below in a separate disclosure for transparency.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge tone="safe" icon="check-circle" label={`${visibleItems.length} shown by profile`} />
            <Badge tone="warn" icon="alert-tri" label={`${hiddenItems.length} hidden by profile`} />
          </div>
        </section>

        {visibleEntries.length > 0 ? (
          <LocationGroups entries={visibleEntries} />
        ) : (
          <section
            style={{
              padding: 24,
              borderRadius: 20,
              background: "var(--bc-surface)",
              border: "1px solid var(--bc-hairline)",
              boxShadow: "var(--bc-shadow-sm)",
            }}
          >
            <div className="bc-h2" style={{ marginBottom: 8 }}>
              Nothing matches your profile today. Talk to dining staff to double-check.
            </div>
            <div className="bc-body-sm" style={{ color: "var(--bc-text-sec)" }}>
              Try clearing the macro filters below first if you want to widen the
              list before you ask staff.
            </div>
          </section>
        )}

        {hiddenItems.length > 0 && (
          <details
            style={{
              borderRadius: 20,
              background: "var(--bc-surface)",
              border: "1px solid var(--bc-hairline)",
              boxShadow: "var(--bc-shadow-sm)",
              overflow: "hidden",
            }}
          >
            <summary
              style={{
                listStyle: "none",
                cursor: "pointer",
                padding: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div className="bc-h3">Hidden by your profile</div>
                <div className="bc-body-sm" style={{ color: "var(--bc-text-sec)", marginTop: 4 }}>
                  We don&apos;t silently drop conflicting items. Open this section to
                  see what was filtered out and why.
                </div>
              </div>
              <span
                className="bc-meta"
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "var(--bc-warn-fog)",
                  color: "var(--bc-warn-ink)",
                  whiteSpace: "nowrap",
                }}
              >
                {hiddenItems.length} hidden
              </span>
            </summary>
            <div style={{ padding: "0 18px 18px" }}>
              <LocationGroups entries={hiddenItems} hidden />
            </div>
          </details>
        )}
      </main>
    </div>
  );
}

function applyMacroFilters(items: MenuItem[], filters: MacroFilterState) {
  const maxCalories = parseOptionalNumber(filters.maxCalories);
  const minProtein = parseOptionalNumber(filters.minProtein);
  const maxCarbs = parseOptionalNumber(filters.maxCarbs);
  const maxFat = parseOptionalNumber(filters.maxFat);

  return items.filter((item) => {
    if (maxCalories !== null && (item.calories === null || item.calories > maxCalories)) {
      return false;
    }

    if (minProtein !== null && (item.protein_g === null || item.protein_g < minProtein)) {
      return false;
    }

    if (maxCarbs !== null && (item.total_carbs_g === null || item.total_carbs_g > maxCarbs)) {
      return false;
    }

    if (maxFat !== null && (item.total_fat_g === null || item.total_fat_g > maxFat)) {
      return false;
    }

    return true;
  });
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
