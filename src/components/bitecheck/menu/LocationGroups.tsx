'use client';

import type { MenuBrowseEntry } from '@/lib/menu/menu-browse';
import { FoodCard } from './FoodCard';

export function LocationGroups({ entries }: { entries: MenuBrowseEntry[] }) {
  const byLocation = groupByLocation(entries);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {byLocation.map(([location, building, items]) => (
        <section
          key={`${location}-${building}`}
          style={{
            display: 'grid',
            gap: 12,
            padding: 16,
            borderRadius: 20,
            background: 'color-mix(in srgb, var(--bc-surface) 84%, transparent)',
            border: '1px solid var(--bc-hairline)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div className="bc-h2">{location}</div>
              <div className="bc-meta" style={{ color: 'var(--bc-text-ter)', marginTop: 2 }}>
                {building}
              </div>
            </div>
            <div className="bc-meta" style={{ color: 'var(--bc-text-ter)' }}>
              {items.length} item{items.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {items.map((entry) => (
              <FoodCard key={getItemKey(entry.item)} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupByLocation(entries: MenuBrowseEntry[]): Array<[string, string, MenuBrowseEntry[]]> {
  const groups = new Map<string, { building: string; items: MenuBrowseEntry[] }>();

  for (const entry of entries) {
    const location = entry.item.location || 'Unknown location';
    const building = entry.item.building || 'Unknown building';

    if (!groups.has(location)) {
      groups.set(location, { building, items: [] });
    }

    groups.get(location)!.items.push(entry);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([location, { building, items }]) => [location, building, items]);
}

function getItemKey(item: MenuBrowseEntry['item']) {
  return [item.date, item.item_id, item.location, item.meal_period, item.station].join('::');
}
