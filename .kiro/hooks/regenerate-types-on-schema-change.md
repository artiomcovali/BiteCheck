# Hook: Regenerate Types on Schema Change

## Trigger

Runs when:
- `supabase/migrations/**/*.sql` changes
- `supabase/schema.sql` changes
- The Supabase remote schema is updated (manual trigger via `kiro hooks run regen-types`)

## Purpose

BiteCheck's TypeScript code depends on the Supabase schema for `MenuItem`, `UserProfile`, and related types. When the schema changes during development, type drift introduces silent bugs — especially in the discrepancy detector and agent prompts where field names matter.

This hook keeps types in sync automatically.

## What the hook does

1. Runs `supabase gen types typescript --project-id <id> > src/lib/db/types.ts`
2. Runs `tsc --noEmit` to surface any code that breaks against the new types
3. If type errors appear, the hook reports them and lists the files needing updates
4. On success, stages `src/lib/db/types.ts` for commit

## Why this matters for BiteCheck specifically

The `dual-source-citation` steering doc requires the agent to cite real CSV fields by name. If the schema drifts and a field is renamed (e.g., `dietary_labels` → `dietary_tags`), the agent's prompts and hardcoded field references would silently produce wrong citations. Auto-regenerated types catch this at compile time, before the agent runs.

## Implementation note

The hook is configured to run silently in the background on file save when triggered by migration changes, and verbosely when triggered manually for remote schema sync.
