"use client";

import { Badge, Chip } from "@/components/bitecheck/primitives";
import { parseDietaryLabels } from "@/lib/menu/dietary-labels";
import type { MenuItem } from "@/lib/types";

export function FoodCard({
  item,
  hidden = false,
  hiddenReason,
}: {
  item: MenuItem;
  hidden?: boolean;
  hiddenReason?: string;
}) {
  const parsedLabels = parseDietaryLabels(item.dietary_labels);
  const restrictionChips = parsedLabels.restrictions.slice(0, 3);

  return (
    <article
      style={{
        background: "var(--bc-surface)",
        borderRadius: 16,
        border: `1.5px solid ${
          hidden ? "var(--bc-warn)" : "var(--bc-hairline)"
        }`,
        boxShadow: "var(--bc-shadow-sm)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 3,
          background: hidden ? "var(--bc-warn)" : "var(--bc-primary)",
          opacity: hidden ? 1 : 0.8,
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
          <Badge
            tone={hidden ? "warn" : "primary"}
            label={hidden ? "Hidden by your profile" : "Shown in menu view"}
          />
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

        {hidden && hiddenReason && (
          <div
            className="bc-body-sm"
            style={{
              color: "var(--bc-warn-ink)",
              background: "var(--bc-warn-fog)",
              borderRadius: 12,
              padding: "10px 12px",
            }}
          >
            {hiddenReason}
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
