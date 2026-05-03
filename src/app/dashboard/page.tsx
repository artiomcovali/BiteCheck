import { redirect } from 'next/navigation';
import { DashboardPage } from '@/components/bitecheck/dashboard/DashboardPage';
import { buildDashboardOverview } from '@/lib/dashboard/overview';
import { getAllMenuItems } from '@/lib/api/menu-items';
import { buildSpendSnapshot } from '@/lib/profile/spend-snapshot';
import { loadHydratedProfile } from '@/lib/user-profile';

export const metadata = {
  title: 'Dashboard · BiteCheck',
};

export default async function DashboardRoute() {
  const [profile, items] = await Promise.all([loadHydratedProfile(), getAllMenuItems()]);

  if (!profile) {
    redirect('/onboarding');
  }

  const overview = buildDashboardOverview(items, profile.profile);
  const spendSnapshot = buildSpendSnapshot(profile.polycard_balance, profile.meal_plan);

  return <DashboardPage profile={profile} spendSnapshot={spendSnapshot} overview={overview} />;
}
