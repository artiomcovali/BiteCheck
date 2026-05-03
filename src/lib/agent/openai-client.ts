/**
 * Shared OpenAI client.
 *
 * Lazy singleton — initialized on first call so the module can be imported
 * in routes that don't always need OpenAI (e.g., the route picks fixtures
 * when the key is unset). Reads `OPENAI_API_KEY` from the server env only;
 * never expose this on the client.
 *
 * Per `.kiro/steering/llm-provider.md`: provider is OPENAI exclusively, and
 * structured outputs go through `zodResponseFormat` from
 * `openai/helpers/zod`.
 */

import OpenAI from "openai";

let cached: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  cached = new OpenAI({ apiKey });
  return cached;
}

/** Default per-call timeout, per steering doc. */
export const OPENAI_TIMEOUT_MS = 8_000;
