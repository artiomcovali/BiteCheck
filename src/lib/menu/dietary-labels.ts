const RESTRICTION_TOKENS = {
  Vegan: "vegan",
  Vegetarian: "vegetarian",
  "Avoiding Gluten": "avoiding-gluten",
} as const;

const MARKETING_TOKENS = new Set([
  "Good Source of Protein",
  "How Good Friendly",
]);

const ALIAS_MATCHERS: Array<{
  match: (token: string) => boolean;
  canonical: string;
}> = [
  { match: (token) => token === "Egg", canonical: "Egg" },
  { match: (token) => token.startsWith("Milk"), canonical: "Milk" },
  { match: (token) => token === "Soy", canonical: "Soy" },
  { match: (token) => token === "Wheat", canonical: "Wheat" },
  { match: (token) => token === "Gluten", canonical: "Gluten" },
  { match: (token) => token === "Sesame", canonical: "Sesame" },
  { match: (token) => token === "Sulphites", canonical: "Sulphites" },
  { match: (token) => token === "Mustard", canonical: "Mustard" },
  { match: (token) => token === "Celery", canonical: "Celery" },
  { match: (token) => token === "Pork", canonical: "Pork" },
  { match: (token) => token === "Beef", canonical: "Beef" },
  { match: (token) => token === "Poultry", canonical: "Poultry" },
  { match: (token) => token.startsWith("Fish"), canonical: "Fish" },
  { match: (token) => token.startsWith("Shellfish"), canonical: "Shellfish" },
  { match: (token) => token === "Tree Nuts", canonical: "Tree Nuts" },
  { match: (token) => token === "Peanut" || token === "Peanuts", canonical: "Peanut" },
  { match: (token) => token === "Onion", canonical: "Onion" },
  { match: (token) => token === "Garlic", canonical: "Garlic" },
  { match: (token) => token === "Mushroom", canonical: "Mushroom" },
  { match: (token) => token === "Tomato", canonical: "Tomato" },
  { match: (token) => token === "Orange", canonical: "Orange" },
  { match: (token) => token === "MSG", canonical: "MSG" },
  { match: (token) => token === "Strawberry", canonical: "Strawberry" },
  { match: (token) => token === "Alcohol", canonical: "Alcohol" },
];

const PROFILE_TOKEN_MAP: Record<string, string[]> = {
  vegan: ["Milk", "Egg", "Beef", "Pork", "Poultry", "Fish", "Shellfish"],
  vegetarian: ["Beef", "Pork", "Poultry", "Fish", "Shellfish"],
  pescatarian: ["Beef", "Pork", "Poultry"],
  "gluten-free": ["Gluten", "Wheat"],
  "dairy-free": ["Milk"],
  "nut-allergy": ["Tree Nuts", "Peanut"],
  "peanut-allergy": ["Peanut"],
  "shellfish-allergy": ["Shellfish"],
  "soy-allergy": ["Soy"],
  "egg-allergy": ["Egg"],
  "sesame-allergy": ["Sesame"],
  halal: ["Pork"],
  kosher: ["Pork", "Shellfish"],
  "hindu-vegetarian": ["Beef", "Pork", "Poultry", "Fish", "Shellfish", "Egg"],
  "jain-vegetarian": [
    "Beef",
    "Pork",
    "Poultry",
    "Fish",
    "Shellfish",
    "Egg",
    "Onion",
    "Garlic",
    "Mushroom",
  ],
};

type ParsedRestriction = (typeof RESTRICTION_TOKENS)[keyof typeof RESTRICTION_TOKENS];

export function parseDietaryLabels(labels: string): {
  raw: string[];
  restrictions: ParsedRestriction[];
  allergens: { token: string; cross_contam: boolean }[];
  marketing: string[];
} {
  const raw = labels
    .split(";")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const restrictions: ParsedRestriction[] = [];
  const allergens: Array<{ token: string; cross_contam: boolean }> = [];
  const marketing: string[] = [];

  for (const rawToken of raw) {
    const crossContam = rawToken.endsWith("*");
    const baseToken = crossContam ? rawToken.slice(0, -1).trim() : rawToken;

    if (baseToken in RESTRICTION_TOKENS) {
      restrictions.push(
        RESTRICTION_TOKENS[baseToken as keyof typeof RESTRICTION_TOKENS],
      );
      continue;
    }

    if (MARKETING_TOKENS.has(baseToken)) {
      marketing.push(baseToken);
      continue;
    }

    const matched = ALIAS_MATCHERS.find(({ match }) => match(baseToken));
    if (!matched) continue;

    allergens.push({
      token: matched.canonical,
      cross_contam: crossContam,
    });
  }

  return {
    raw,
    restrictions,
    allergens,
    marketing,
  };
}

export function expandUserProfileTokens(tokens: string[]): string[] {
  return [...new Set(tokens.flatMap((token) => PROFILE_TOKEN_MAP[token] ?? []))];
}

export function satisfiesDietaryRequirement(
  labels: ReturnType<typeof parseDietaryLabels>,
  requirement: string,
): boolean {
  const presentTokens = new Set(labels.allergens.map((token) => token.token));

  switch (requirement) {
    case "vegan":
      return labels.restrictions.includes("vegan");
    case "vegetarian":
      return (
        labels.restrictions.includes("vegetarian") ||
        labels.restrictions.includes("vegan")
      );
    case "gluten-free":
      return labels.restrictions.includes("avoiding-gluten");
    case "dairy-free":
      return !presentTokens.has("Milk");
    case "pescatarian":
      return !["Beef", "Pork", "Poultry"].some((token) => presentTokens.has(token));
    case "halal":
      return !presentTokens.has("Pork");
    case "kosher":
      return !["Pork", "Shellfish"].some((token) => presentTokens.has(token));
    case "hindu-vegetarian":
      return !["Beef", "Pork", "Poultry", "Fish", "Shellfish", "Egg"].some(
        (token) => presentTokens.has(token),
      );
    case "jain-vegetarian":
      return ![
        "Beef",
        "Pork",
        "Poultry",
        "Fish",
        "Shellfish",
        "Egg",
        "Onion",
        "Garlic",
        "Mushroom",
      ].some((token) => presentTokens.has(token));
    default:
      return true;
  }
}
