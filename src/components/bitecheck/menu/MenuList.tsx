'use client';

import * as React from 'react';
import { Badge, Chip } from '@/components/bitecheck/primitives';
import type { MenuBrowseEntry } from '@/lib/menu/menu-browse';
import { LocationGroups } from './LocationGroups';

export function MenuList({
  dateLabel,
  entries,
  availableDates,
}: {
  dateLabel: string;
  entries: MenuBrowseEntry[];
  availableDates: string[];
}) {
  const [search, setSearch] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState('All days');
  const [selectedLocation, setSelectedLocation] = React.useState('All locations');
  const [safeOnly, setSafeOnly] = React.useState(false);
  const [veganOnly, setVeganOnly] = React.useState(false);
  const [vegetarianOnly, setVegetarianOnly] = React.useState(false);
  const [highProteinOnly, setHighProteinOnly] = React.useState(false);
  const [containsAllergens, setContainsAllergens] = React.useState(false);
  const [missingDataOnly, setMissingDataOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<'safest' | 'protein' | 'calories'>('safest');

  const dateOptions = React.useMemo(() => {
    return ['All days', ...availableDates];
  }, [availableDates]);

  const formatDateChip = (value: string) => {
    if (value === 'All days') return 'All days';
    const parsed = new Date(`${value}T12:00:00-07:00`);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(parsed);
  };

  const locationOptions = React.useMemo(() => {
    const locations = new Set<string>();
    for (const entry of entries) {
      if (selectedDate !== 'All days' && entry.item.date !== selectedDate) continue;
      locations.add(entry.item.location || 'Unknown');
    }
    return ['All locations', ...[...locations].sort((a, b) => a.localeCompare(b))];
  }, [entries, selectedDate]);

  const filteredEntries = React.useMemo(
    () =>
      applyEntryFilters(entries, {
        search,
        selectedDate,
        selectedLocation,
        safeOnly,
        veganOnly,
        vegetarianOnly,
        highProteinOnly,
        containsAllergens,
        missingDataOnly,
        sortBy,
      }),
    [
      containsAllergens,
      entries,
      highProteinOnly,
      missingDataOnly,
      safeOnly,
      search,
      selectedDate,
      selectedLocation,
      sortBy,
      veganOnly,
      vegetarianOnly,
    ],
  );

  return (
    <div style={{ minHeight: 'calc(100vh - 58px)' }}>
      <main
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '28px 20px 56px',
          display: 'grid',
          gap: 24,
        }}
      >
        <section style={{ display: 'grid', gap: 10 }}>
          <Badge tone="primary" icon="list" label={dateLabel} />
          <div className="bc-display">Browse dining options your way.</div>
          <p className="bc-body" style={{ color: 'var(--bc-text-sec)', maxWidth: 760 }}>
            Filter by day, location, and safety status to inspect the menu manually before you
            escalate to the agent.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge
              tone="safe"
              icon="check-circle"
              label={`${filteredEntries.filter((e) => e.safety === 'safe').length} safe`}
            />
            <Badge
              tone="warn"
              icon="alert-tri"
              label={`${filteredEntries.filter((e) => e.safety === 'double-check').length} double-check`}
            />
            <Badge
              tone="unsafe"
              icon="shield-alert"
              label={`${filteredEntries.filter((e) => e.safety === 'avoid').length} avoid`}
            />
            <span className="bc-meta" style={{ color: 'var(--bc-text-ter)', alignSelf: 'center' }}>
              {filteredEntries.length} of {entries.length} items
            </span>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gap: 16,
            padding: 20,
            borderRadius: 20,
            background: 'var(--bc-surface)',
            border: '1px solid var(--bc-hairline)',
            boxShadow: 'var(--bc-shadow-sm)',
          }}
        >
          <div className="grid gap-3 lg:grid-cols-3">
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
                Search menu items
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Search by name, station, or location"
                style={inputStyle()}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
                Location
              </span>
              <select
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.currentTarget.value)}
                style={inputStyle()}
              >
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="bc-label" style={{ color: 'var(--bc-text-sec)' }}>
                Sort by
              </span>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.currentTarget.value as 'safest' | 'protein' | 'calories')
                }
                style={inputStyle()}
              >
                <option value="safest">Safest first</option>
                <option value="protein">Highest protein</option>
                <option value="calories">Lowest calories</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {dateOptions.map((date) => (
              <Chip
                key={date}
                tone="primary"
                label={formatDateChip(date)}
                selected={selectedDate === date}
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedLocation('All locations');
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <FilterChip
              label="Safe for me"
              selected={safeOnly}
              onClick={() => setSafeOnly((v) => !v)}
            />
            <FilterChip
              label="Vegan"
              selected={veganOnly}
              onClick={() => setVeganOnly((v) => !v)}
            />
            <FilterChip
              label="Vegetarian"
              selected={vegetarianOnly}
              onClick={() => setVegetarianOnly((v) => !v)}
            />
            <FilterChip
              label="High protein"
              selected={highProteinOnly}
              onClick={() => setHighProteinOnly((v) => !v)}
            />
            <FilterChip
              label="Contains allergens"
              selected={containsAllergens}
              onClick={() => setContainsAllergens((v) => !v)}
            />
            <FilterChip
              label="Missing data"
              selected={missingDataOnly}
              onClick={() => setMissingDataOnly((v) => !v)}
            />
          </div>
        </section>

        {filteredEntries.length > 0 ? (
          <LocationGroups entries={filteredEntries} />
        ) : (
          <section
            style={{
              padding: 24,
              borderRadius: 20,
              background: 'var(--bc-surface)',
              border: '1px solid var(--bc-hairline)',
              boxShadow: 'var(--bc-shadow-sm)',
            }}
          >
            <div className="bc-h2" style={{ marginBottom: 8 }}>
              Nothing matches your filters. Talk to dining staff to double-check.
            </div>
            <div className="bc-body-sm" style={{ color: 'var(--bc-text-sec)' }}>
              Try clearing the search, location, and safety filters first if you want to widen the
              list before you ask staff.
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function applyEntryFilters(
  entries: MenuBrowseEntry[],
  options: {
    search: string;
    selectedDate: string;
    selectedLocation: string;
    safeOnly: boolean;
    veganOnly: boolean;
    vegetarianOnly: boolean;
    highProteinOnly: boolean;
    containsAllergens: boolean;
    missingDataOnly: boolean;
    sortBy: 'safest' | 'protein' | 'calories';
  },
) {
  return entries
    .filter((entry) => {
      if (options.selectedDate !== 'All days' && entry.item.date !== options.selectedDate) {
        return false;
      }

      const location = entry.item.location || 'Unknown';
      if (options.selectedLocation !== 'All locations' && location !== options.selectedLocation) {
        return false;
      }

      const haystack = [
        entry.item.item_name,
        entry.item.location,
        entry.item.station,
        entry.item.building,
      ]
        .join(' ')
        .toLowerCase();

      if (options.search.trim() && !haystack.includes(options.search.trim().toLowerCase())) {
        return false;
      }

      if (options.safeOnly && entry.safety !== 'safe') return false;
      if (options.veganOnly && !entry.isVegan) return false;
      if (options.vegetarianOnly && !entry.isVegetarian) return false;
      if (options.highProteinOnly && (entry.item.protein_g ?? 0) < 20) return false;
      if (options.containsAllergens && !entry.hasAllergens) return false;
      if (options.missingDataOnly && !entry.hasMissingData) return false;

      return true;
    })
    .sort((a, b) => compareEntries(a, b, options.sortBy));
}

function compareEntries(
  a: MenuBrowseEntry,
  b: MenuBrowseEntry,
  sortBy: 'safest' | 'protein' | 'calories',
) {
  if (sortBy === 'protein') {
    return (b.item.protein_g ?? -1) - (a.item.protein_g ?? -1);
  }

  if (sortBy === 'calories') {
    return (
      (a.item.calories ?? Number.MAX_SAFE_INTEGER) - (b.item.calories ?? Number.MAX_SAFE_INTEGER)
    );
  }

  const safetyRank = { safe: 0, 'double-check': 1, avoid: 2 };
  if (safetyRank[a.safety] !== safetyRank[b.safety]) {
    return safetyRank[a.safety] - safetyRank[b.safety];
  }

  return a.item.item_name.localeCompare(b.item.item_name);
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Chip
      tone={selected ? 'primary' : 'neutral'}
      label={label}
      selected={selected}
      onClick={onClick}
    />
  );
}

function inputStyle(): React.CSSProperties {
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
  };
}
