import { redirect } from 'next/navigation';
import { getAllMenuItems } from '@/lib/api/menu-items';
import { buildMenuBrowseEntries } from '@/lib/menu/menu-browse';
import { loadHydratedProfile } from '@/lib/user-profile';
import { MenuList } from '@/components/bitecheck/menu/MenuList';

export const metadata = {
  title: 'Menu · BiteCheck',
};

export default async function MenuPage() {
  const [profile, items] = await Promise.all([loadHydratedProfile(), getAllMenuItems()]);

  if (!profile) {
    redirect('/onboarding');
  }

  const entries = buildMenuBrowseEntries(items, profile.profile);

  const dates = [...new Set(items.map((item) => item.date))].sort();
  const dateLabel = formatDateRange(dates);

  return <MenuList dateLabel={dateLabel} entries={entries} availableDates={dates} />;
}

function formatDateRange(dates: string[]) {
  if (dates.length === 0) return 'No menu data available';
  if (dates.length === 1) return formatSingleDate(dates[0]!);

  const first = formatSingleDate(dates[0]!);
  const last = formatSingleDate(dates[dates.length - 1]!);
  return `${first} – ${last}`;
}

function formatSingleDate(date: string) {
  const parsed = new Date(`${date}T12:00:00-07:00`);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(parsed);
}
