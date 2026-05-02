# Steering: LLM Provider and Model

This document instructs Kiro on which LLM provider, models, and APIs to use throughout BiteCheck.

## Provider

Use **OpenAI** exclusively. Do not generate code that uses the Anthropic SDK, the Claude API, or any other LLM provider. The project standardizes on OpenAI for all LLM calls.

## SDK

Use the official `openai` npm package (`openai` v4+). Initialize the client from `process.env.OPENAI_API_KEY`. Do not invent wrapper layers around the SDK unless explicitly asked.

```ts
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```

## Models

- **Default model for agent reasoning**: `gpt-4o` (used in parse-query and rank-and-recommend steps)
- **Fallback for cost-sensitive paths**: `gpt-4o-mini` (only when explicitly requested for a specific call)

Never hardcode model strings in business logic. Centralize them in `src/lib/agent/models.ts` so they can be swapped in one place.

## Structured outputs

For every LLM call that produces data the rest of the pipeline consumes (parsed intent, ranked recommendations, audit summaries), use OpenAI's **Structured Outputs** feature with a Zod-derived JSON schema.

Pattern:

```ts
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const ResponseSchema = z.object({ /* ... */ });

const completion = await client.chat.completions.parse({
  model: MODELS.AGENT_REASONING,
  messages: [...],
  response_format: zodResponseFormat(ResponseSchema, "name_of_schema"),
});

const parsed = completion.choices[0].message.parsed;
```

Do not use raw JSON mode (`response_format: { type: "json_object" }`) when a schema is available. Structured outputs give us guaranteed schema conformance — relying on prompt-only JSON output is incorrect for this project.

## Streaming

For the final `rank-and-recommend` step, prefer non-streaming structured output. The reasoning events stream from the AsyncGenerator, not from the LLM token stream — the LLM call itself returns a complete structured response that becomes one ReasoningEvent.

If a future step requires token-level streaming for UX reasons, use the streaming structured output API (`client.chat.completions.stream` with `response_format`).

## Error handling

Every OpenAI call must:
1. Have a 8-second timeout (configurable via `AbortController`)
2. Catch and downgrade on failure — never throw from the agent pipeline
3. On failure, the calling step yields a `ReasoningEvent` with `type: "error"` and the pipeline falls back to deterministic logic (per spec 01 error handling)

## Forbidden

- Do not generate code that uses Anthropic, Claude, or any non-OpenAI LLM
- Do not store the API key in client-side code or expose it to the browser
- Do not call the LLM from React components — all LLM calls happen in API routes or server-side code
- Do not bypass structured outputs for steps that produce structured data