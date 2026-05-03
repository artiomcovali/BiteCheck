/**
 * Input guard for the chat route.
 *
 * Three layers of defense:
 *   1. Sanitization — strip known prompt injection patterns
 *   2. Length / format validation — reject garbage before it hits the LLM
 *   3. Topic relevance — reject queries that have nothing to do with
 *      dining, food, nutrition, or the BiteCheck system
 *
 * All checks are deterministic (no LLM call) so they're fast and free.
 */

export type GuardResult = { ok: true; sanitized: string } | { ok: false; reason: string };

/**
 * Known prompt injection patterns. These are stripped from the input
 * before it reaches any LLM call. Patterns are case-insensitive.
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|context)/i,
  /disregard\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /new\s+instructions?:/i,
  /system\s*prompt:/i,
  /\bDAN\b.*\bjailbreak\b/i,
  /\bjailbreak\b.*\bDAN\b/i,
  /pretend\s+you\s+are/i,
  /act\s+as\s+(a|an|if)\s+/i,
  /roleplay\s+as/i,
  /override\s+(your|the|all)\s+(rules?|instructions?|safety|restrictions?)/i,
  /bypass\s+(your|the|all)\s+(rules?|filters?|safety|restrictions?)/i,
  /\[system\]/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /<\|im_start\|>/i,
  /```\s*(system|instruction|prompt)/i,
];

/**
 * Topic keywords. If the query contains at least one of these, it's
 * considered on-topic. Broad enough to cover dining, food, nutrition,
 * allergens, the campus, and BiteCheck itself.
 */
const TOPIC_KEYWORDS = [
  // Food & dining
  'eat',
  'food',
  'meal',
  'menu',
  'dining',
  'lunch',
  'dinner',
  'breakfast',
  'brunch',
  'snack',
  'drink',
  'coffee',
  'cook',
  'dish',
  'bowl',
  'salad',
  'soup',
  'sandwich',
  'pizza',
  'pasta',
  'rice',
  'noodle',
  'taco',
  'burrito',
  'sushi',
  'wrap',
  'burger',
  'fries',
  'chicken',
  'beef',
  'pork',
  'fish',
  'tofu',
  'vegan',
  'vegetarian',
  'pescatarian',
  'fruit',
  'veggie',
  'vegetable',
  'dessert',
  'smoothie',
  'juice',
  'tea',
  'latte',
  // Nutrition & health
  'calorie',
  'protein',
  'carb',
  'fat',
  'fiber',
  'sodium',
  'sugar',
  'macro',
  'nutrition',
  'nutrient',
  'healthy',
  'diet',
  'low-cal',
  'high-protein',
  'low-carb',
  'low-fat',
  'keto',
  'paleo',
  // Allergens & restrictions
  'allergy',
  'allergen',
  'gluten',
  'dairy',
  'nut',
  'peanut',
  'shellfish',
  'soy',
  'egg',
  'sesame',
  'celiac',
  'intolerance',
  'lactose',
  'halal',
  'kosher',
  'hindu',
  'jain',
  'religious',
  // Safety
  'safe',
  'unsafe',
  'avoid',
  'risk',
  'cross-contamination',
  'flagged',
  'warning',
  'ingredient',
  'label',
  'contain',
  // Campus & locations
  'cal poly',
  'campus',
  'dining hall',
  'marketplace',
  'vista grande',
  'red radish',
  'pom',
  'honey',
  'noodle',
  'mingle',
  'nosh',
  'streats',
  'scout',
  'hearth',
  'polycard',
  'poly card',
  'balance',
  // BiteCheck system
  'bitecheck',
  'bite check',
  'recommend',
  'suggestion',
  'profile',
  'restriction',
  'preference',
  'option',
  'available',
  'open',
  'today',
  'tonight',
  'morning',
  'what can i',
  'what should',
  'find me',
  'is this',
  'is it',
  'where',
  'which',
];

/**
 * Run all guard checks on a user query.
 */
export function guardInput(query: string): GuardResult {
  // 1. Basic format checks
  if (!query || typeof query !== 'string') {
    return { ok: false, reason: 'Empty query.' };
  }

  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return { ok: false, reason: 'Query too short.' };
  }

  if (trimmed.length > 500) {
    return { ok: false, reason: 'Query too long. Keep it under 500 characters.' };
  }

  // 2. Sanitize prompt injection attempts
  let sanitized = trimmed;
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '').trim();
  }

  // If sanitization removed most of the content, the query was mostly injection
  if (sanitized.length < 2 && trimmed.length > 10) {
    return { ok: false, reason: 'I can only help with Cal Poly dining questions.' };
  }

  // 3. Topic relevance check
  const lower = sanitized.toLowerCase();
  const isOnTopic = TOPIC_KEYWORDS.some((kw) => lower.includes(kw));

  if (!isOnTopic) {
    return {
      ok: false,
      reason:
        "I'm BiteCheck — I can help with Cal Poly dining, menu items, nutrition, and dietary safety. Try asking about what's available or what fits your profile.",
    };
  }

  return { ok: true, sanitized };
}
