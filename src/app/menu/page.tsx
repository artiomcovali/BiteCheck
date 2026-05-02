import { redirect } from "next/navigation";
import { getMenuItemsForToday, filterMenuItems } from "@/lib/api/menu-items";
import {
  expandUserProfileTokens,
  parseDietaryLabels,
  satisfiesDietaryRequirement,
} from "@/lib/menu/dietary-labels";
import {
  loadHydratedProfile,
  type HydratedUserProfile,
} from "@/lib/user-profile";
import type { MenuItem } from "@/lib/types";
import { MenuList } from "@/components/bitecheck/menu/MenuList";

export const metadata = {
  title: "Menu · BiteCheck",
};

export default async function MenuPage() {
  const profile = await loadHydratedProfile();
  if (!profile) {
    redirect("/onboarding");
  }

  const items = await getMenuItemsForToday();
  const visibleItems = filterMenuItems(items, {
    excludeAllergens: profile.profile.allergens,
    requireDietary: [
      ...profile.profile.restrictions,
      ...profile.profile.religious_dietary,
    ],
  });

  const visibleKeys = new Set(visibleItems.map(getItemKey));
  const hiddenItems = items
    .filter((item) => !visibleKeys.has(getItemKey(item)))
    .map((item) => ({
      item,
      reason: getHiddenReason(item, profile.profile),
    }));

  return (
    <MenuList
      dateLabel={formatMenuDate(items[0]?.date)}
      visibleItems={visibleItems}
      hiddenItems={hiddenItems}
    />
  );
}

function getHiddenReason(
  item: MenuItem,
  profile: HydratedUserProfile["profile"],
) {
  const parsed = parseDietaryLabels(item.dietary_labels);
  const presentTokens = new Set(parsed.allergens.map((entry) => entry.token));
  const blockedTokens = expandUserProfileTokens(profile.allergens);
  const matchedBlockedTokens = blockedTokens.filter((token) =>
    presentTokens.has(token),
  );

  if (matchedBlockedTokens.length > 0) {
    return `Hidden because the dining labels include ${matchedBlockedTokens.join(
      ", ",
    )}, which conflicts with your profile.`;
  }

  const requirements = [
    ...profile.restrictions,
    ...profile.religious_dietary,
  ];

  for (const requirement of requirements) {
    if (satisfiesDietaryRequirement(parsed, requirement)) continue;

    const offendingTokens = expandUserProfileTokens([requirement]).filter(
      (token) => presentTokens.has(token),
    );

    if (offendingTokens.length > 0) {
      return `Hidden because your ${formatRequirementLabel(
        requirement,
      )} setting conflicts with ${offendingTokens.join(", ")} in the dining labels.`;
    }

    return `Hidden because this item is not clearly labeled ${formatRequirementLabel(
      requirement,
    )} in today's dining data.`;
  }

  return "Hidden by your profile filters.";
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

function formatRequirementLabel(value: string) {
  return value.replace(/-/g, " ");
}

function formatMenuDate(date: string | undefined) {
  if (!date) return "Today's menu";

  const parsed = new Date(`${date}T12:00:00-07:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(parsed);
}
