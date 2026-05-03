import type { IconName } from '@/components/bitecheck/icons';

export type Suggestion = { icon: IconName; text: string };

/**
 * Bank of 50 suggested queries covering different locations, dietary needs,
 * and nutritional goals.
 */
export const SUGGESTION_BANK: Suggestion[] = [
  // Location-based: Red Radish
  { icon: 'utensils', text: "What's safe at Red Radish today?" },
  { icon: 'shield', text: 'Any gluten-free salads at Red Radish?' },
  { icon: 'sparkle', text: 'High-protein bowls at Red Radish' },

  // Location-based: 1901 Marketplace
  { icon: 'utensils', text: 'What can I eat at 1901 Marketplace?' },
  { icon: 'shield', text: "What's vegan at 1901 Marketplace?" },
  { icon: 'sparkle', text: 'Low-calorie options at 1901 Marketplace' },

  // Location-based: Vista Grande
  { icon: 'utensils', text: "What's safe at Vista Grande for dinner?" },
  { icon: 'sparkle', text: 'Find high-protein options at Vista Grande' },
  { icon: 'shield', text: 'Dairy-free choices at Vista Grande' },
  { icon: 'utensils', text: "What's good for lunch at Vista Grande?" },

  // Location-based: Pom & Honey
  { icon: 'utensils', text: 'What can I eat at Pom & Honey?' },
  { icon: 'shield', text: 'Is anything nut-free at Pom & Honey?' },
  { icon: 'sparkle', text: 'High-fiber options at Pom & Honey' },

  // Location-based: Noodles
  { icon: 'utensils', text: "What's safe at Noodles tonight?" },
  { icon: 'shield', text: 'Any egg-free noodle dishes?' },
  { icon: 'sparkle', text: 'Low-sodium options at Noodles' },

  // Location-based: Mingle + Nosh
  { icon: 'utensils', text: 'What can I eat at Mingle + Nosh?' },
  { icon: 'shield', text: 'Soy-free options at Mingle + Nosh' },
  { icon: 'sparkle', text: 'High-protein sushi bowls at Mingle + Nosh' },

  // Location-based: Streats
  { icon: 'utensils', text: "What's safe at Streats?" },
  { icon: 'shield', text: 'Gluten-free tacos at Streats?' },

  // Location-based: Scout Coffee Co.
  { icon: 'utensils', text: 'Any dairy-free drinks at Scout Coffee?' },
  { icon: 'shield', text: "What's vegan at Scout Coffee Co.?" },

  // Location-based: Hearth
  { icon: 'utensils', text: 'What can I eat at Hearth for dinner?' },
  { icon: 'sparkle', text: 'Low-carb options at Hearth' },

  // Dietary restriction focused
  { icon: 'shield', text: "What's vegan and gluten-free today?" },
  { icon: 'shield', text: 'Find me something halal for lunch' },
  { icon: 'shield', text: 'Kosher options on campus today' },
  { icon: 'shield', text: "What's safe for a shellfish allergy?" },
  { icon: 'shield', text: 'Sesame-free options for dinner' },
  { icon: 'shield', text: "What's safe for someone with a nut allergy?" },
  { icon: 'shield', text: 'Egg-free breakfast options' },
  { icon: 'shield', text: 'What vegetarian options are available today?' },
  { icon: 'shield', text: 'Any pescatarian-friendly meals today?' },

  // Nutritional goal focused
  { icon: 'sparkle', text: 'Find high-protein vegan options' },
  { icon: 'sparkle', text: 'Low-calorie lunch ideas' },
  { icon: 'sparkle', text: 'What has the most protein today?' },
  { icon: 'sparkle', text: 'Low-fat dinner options' },
  { icon: 'sparkle', text: 'High-fiber meals on campus' },
  { icon: 'sparkle', text: 'Under 400 calories for lunch' },
  { icon: 'sparkle', text: 'Best protein-to-calorie ratio today' },
  { icon: 'sparkle', text: 'Low-carb options for dinner' },

  // General / safety focused
  { icon: 'utensils', text: 'What should I avoid today?' },
  { icon: 'utensils', text: "What's the safest option for breakfast?" },
  { icon: 'utensils', text: 'Where should I eat today?' },
  { icon: 'utensils', text: "What's open for brunch right now?" },
  { icon: 'shield', text: 'Any cross-contamination risks I should know about?' },
  { icon: 'utensils', text: "What's new on the menu this week?" },
  { icon: 'shield', text: 'Which dining halls have the most safe options for me?' },
  { icon: 'utensils', text: 'Quick grab-and-go options that fit my profile' },
];

/** Pick `count` random items from the bank without repeats. */
export function pickRandomSuggestions(count: number): Suggestion[] {
  const shuffled = [...SUGGESTION_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
