"use client";

import { FoodCard } from "./FoodCard";
import type { HiddenMenuEntry } from "./MenuList";
import type { MenuItem } from "@/lib/types";

type MenuEntry = { item: MenuItem; reason?: string };

export function LocationGroups({
  entries,
  hidden = false,
}: {
  entries: Array<{ item: MenuItem; reason?: string }>;
  hidden?: boolean;
}) {
  const byBuilding = groupByBuilding(entries);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {byBuilding.map(([building, locations]) => (
        <section key={building} style={{ display: "grid", gap: 14 }}>
          <div>
            <div className="bc-label" style={{ color: "var(--bc-text-ter)" }}>
              Building
            </div>
            <div className="bc-h2" style={{ marginTop: 4 }}>
              {building}
            </div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            {locations.map(([location, items]) => (
              <div
                key={`${building}-${location}`}
                style={{
                  display: "grid",
                  gap: 12,
                  padding: 16,
                  borderRadius: 20,
                  background: "color-mix(in srgb, var(--bc-surface) 84%, transparent)",
                  border: "1px solid var(--bc-hairline)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div className="bc-h3">{location}</div>
                  <div className="bc-meta" style={{ color: "var(--bc-text-ter)" }}>
                    {items.length} item{items.length === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {items.map((entry) => (
                    <FoodCard
                      key={getItemKey(entry.item)}
                      item={entry.item}
                      hidden={hidden}
                      hiddenReason={entry.reason}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupByBuilding(entries: MenuEntry[]) {
  const buildings = new Map<string, Map<string, MenuEntry[]>>();

  for (const entry of entries) {
    const building = entry.item.building || "Unknown building";
    const location = entry.item.location || "Unknown location";

    if (!buildings.has(building)) {
      buildings.set(building, new Map());
    }

    const locations = buildings.get(building)!;
    if (!locations.has(location)) {
      locations.set(location, []);
    }

    locations.get(location)!.push(entry);
  }

  return [...buildings.entries()].map(([building, locations]) => [
    building,
    [...locations.entries()],
  ]) as Array<[string, Array<[string, MenuEntry[]]>]>;
}

function getItemKey(item: MenuItem) {
  return [
    item.date,
    item.item_id,
    item.location,
    item.meal_period,
    item.station,
  ].join("::");
}
