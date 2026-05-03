"use client";

import { Badge, Chip } from "@/components/bitecheck/primitives";
import type { MenuBrowseEntry } from "@/lib/menu/menu-browse";

export function FoodCard({
  entry,
}: {
  entry: MenuBrowseEntry;
}) {
  const { item } = entry;
  const restrictionChips = entry.tags.slice(0, 3);
  const statusTone =
    entry.safety === "safe"
      ? "safe"
      : entry.safety === "double-check"
        ? "warn"
        : "unsafe";
  const statusLabel =
    entry.safety === "safe"
      ? "Safe"
      : entry.safety === "double-check"
        ? "Double check"
        : "Avoid";

  return (
    <article
      style={{
        background: "var(--bc-surface)",
        borderRadius: 16,
        border: `1.5px solid ${
          entry.safety === "avoid"
            ? "var(--bc-unsafe)"
            : entry.safety === "double-check"
              ? "var(--bc-warn)"
              : "var(--bc-hairline)"
        }`,
        boxShadow: "var(--bc-shadow-sm)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 3,
          background:
            entry.safety === "avoid"
              ? "var(--bc-unsafe)"
              : entry.safety === "double-check"
                ? "var(--bc-warn)"
                : "var(--bc-primary)",
        }}
      />
      <div style={{ padding: 16, display: "grid", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="bc-h3" style={{ fontSize: 18, marginBottom: 4 }}>
              {item.item_name}
            </div>
            <div className="bc-body-sm" style={{ color: "var(--bc-text-sec)" }}>
              {item.location} · {item.meal_period} · {item.station}
            </div>
          </div>
          <Badge tone={statusTone} label={statusLabel} />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Chip tone="mono" size="sm" label="Calories" value={formatNumber(item.calories)} />
          <Chip
            tone="mono"
            size="sm"
            label="Protein"
            value={formatGrams(item.protein_g)}
          />
          <Chip tone="mono" size="sm" label="Portion" value={item.portion || "—"} />
        </div>

        {item.description && item.description !== "—" && (
          <div className="bc-body-sm" style={{ color: "var(--bc-text-sec)" }}>
            {item.description}
          </div>
        )}

        {restrictionChips.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {restrictionChips.map((restriction) => (
              <Chip
                key={restriction}
                tone="primary"
                size="sm"
                label={restriction.replace(/-/g, " ")}
              />
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {entry.hasAllergens && <Chip tone="warn" size="sm" label="Contains allergens" />}
          {entry.hasMissingData && <Chip tone="warn" size="sm" label="Missing data" />}
        </div>

        {entry.safety !== "safe" && (
          <div
            className="bc-body-sm"
            style={{
              color:
                entry.safety === "avoid"
                  ? "var(--bc-unsafe-ink)"
                  : "var(--bc-warn-ink)",
              background:
                entry.safety === "avoid"
                  ? "var(--bc-unsafe-fog)"
                  : "var(--bc-warn-fog)",
              borderRadius: 12,
              padding: "10px 12px",
            }}
          >
            {entry.reason}
          </div>
        )}
      </div>
    </article>
  );
}

function formatNumber(value: number | null) {
  if (value === null) return "n/a";
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function formatGrams(value: number | null) {
  if (value === null) return "n/a";
  return `${formatNumber(value)}g`;
}

