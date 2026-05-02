# Implementation Plan: Project Scaffold

## Overview

Set up the BiteCheck Next.js 15 project from scratch: configuration files, directory structure, shared TypeScript types, pipeline stub functions, Supabase client, and minimal App Router entry point. Every function body is a TODO placeholder — no business logic. The scaffold locks down type contracts and toolchain so subsequent specs build against a consistent, buildable codebase.

## Tasks

- [x] 1. Initialize project configuration files
  - [x] 1.1 Create `package.json` with all required dependencies
    - Include `next` (v15), `react`, `react-dom`, `typescript`, `tailwindcss`, `openai` (v4+), `@supabase/supabase-js`, `zod` as dependencies
    - Include `vitest` as a dev dependency
    - Add scripts: `dev`, `build`, `start`, `lint`, `test` (vitest --run)
    - _Requirements: 1.1, 1.6_

  - [x] 1.2 Create `tsconfig.json` with strict mode and path aliases
    - Enable strict mode
    - Map `@/*` to `src/*`
    - Set JSX to `preserve`
    - Configure for Next.js 15 App Router
    - _Requirements: 1.2_

  - [x] 1.3 Create `tailwind.config.ts`
    - Content scan: `src/**/*.{ts,tsx}`
    - _Requirements: 1.3_

  - [x] 1.4 Create `next.config.mjs`
    - App Router defaults, no custom overrides
    - _Requirements: 1.4_

  - [x] 1.5 Create `vitest.config.ts`
    - Configure path alias resolution matching `tsconfig.json` (`@/*` → `src/*`)
    - _Requirements: 1.5_

  - [x] 1.6 Update `.gitignore`
    - Ensure entries for `.env.local`, `.env`, `node_modules/`, `.next/`, `.DS_Store`
    - Verify `.kiro/` is NOT excluded
    - _Requirements: 8.1, 8.2_

- [x] 2. Create shared types barrel file
  - [x] 2.1 Create `src/lib/types/index.ts` with all shared types
    - Export `UserProfile` type with `restrictions: string[]`, `religious_dietary: string[]`, `allergens: string[]`, `severity: "medical" | "strict" | "preference"`
    - Export `MenuItem` type with all Cal Poly dining dataset columns: `item_name`, `location`, `meal_period`, `station`, `description`, `ingredients`, `dietary_labels`, `allergens`, and all nutrition columns (`calories`, `protein_g`, `total_fat_g`, `total_carbs_g`, `fiber_g`, `sodium_mg`, `sugar_g`, `added_sugar_g`, `sat_fat_g`, `trans_fat_g`, `cholesterol_mg`, `calcium_mg`, `iron_mg`, `potassium_mg`, `vitamin_c_mg`, `vitamin_d_mcg`)
    - Export `ConflictType` as union: `"label_ingredient" | "missing_classification" | "cross_contamination" | "allergen_in_dietary_field" | "empty_data"`
    - Export `DiscrepancyReport` with `status` and `conflicts` array
    - Export `ParsedIntent` with `location_filter`, `meal_period_filter`, `nutritional_goal`, `query_type`
    - Export `AgentResponse` with `recommendations`, `warnings`, `reasoning_summary`
    - Export `ReasoningEvent` as discriminated union on `type`: `"parse" | "retrieve" | "audit" | "rank" | "complete" | "error"`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Checkpoint — Verify types compile
  - Ensure all types pass TypeScript compilation, ask the user if questions arise.

- [x] 4. Create model registry and pipeline stubs
  - [x] 4.1 Create `src/lib/agent/models.ts` — Model registry
    - Export `MODELS` object with `AGENT_REASONING: "gpt-4o"` and `COST_SENSITIVE: "gpt-4o-mini"`
    - Use `as const` for literal type inference
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 4.2 Create `src/lib/agent/parse-query.ts` — Step 1 stub
    - Export async function `parseQuery(query: string): Promise<ParsedIntent>`
    - Body: `// TODO: implement per spec 01` and throw `new Error("Not implemented")`
    - Import types from `@/lib/types`
    - No profile parameter — intent extraction only
    - _Requirements: 5.1, 5.5_

  - [x] 4.3 Create `src/lib/agent/retrieve-candidates.ts` — Step 2 stub
    - Export async function `retrieveCandidates(intent: ParsedIntent): Promise<MenuItem[]>`
    - Body: `// TODO: implement per spec 01` and throw `new Error("Not implemented")`
    - Import types from `@/lib/types`
    - _Requirements: 5.2_

  - [x] 4.4 Create `src/lib/agent/audit-items.ts` — Step 3 stub
    - Export synchronous function `auditItems(items: MenuItem[], profile: UserProfile): Array<{ item: MenuItem; report: DiscrepancyReport }>`
    - Body: `// TODO: implement per spec 01` and throw `new Error("Not implemented")`
    - Import types from `@/lib/types`
    - _Requirements: 5.3_

  - [x] 4.5 Create `src/lib/agent/rank-and-recommend.ts` — Step 4 stub
    - Export async function `rankAndRecommend(auditedItems: Array<{ item: MenuItem; report: DiscrepancyReport }>, profile: UserProfile, intent: ParsedIntent): Promise<AgentResponse>`
    - Body: `// TODO: implement per spec 01` and throw `new Error("Not implemented")`
    - Import types from `@/lib/types`
    - This is the final pipeline step — no separate `generate-response.ts`
    - _Requirements: 5.4, 5.5_

- [x] 5. Create discrepancy detector stub and Supabase client
  - [x] 5.1 Create `src/lib/discrepancy/detect-discrepancies.ts`
    - Export synchronous function `detectDiscrepancies(item: MenuItem, profile: UserProfile): DiscrepancyReport`
    - Body: `// TODO: implement per spec 02` and throw `new Error("Not implemented")`
    - Import types from `@/lib/types`
    - _Requirements: 6.1_

  - [x] 5.2 Create `src/lib/db/client.ts` — Supabase public + admin clients
    - Import `createClient` from `@supabase/supabase-js`
    - Read `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from `process.env`
    - Throw descriptive error if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing
    - Export `supabase` (public client) and `supabaseAdmin` (admin client)
    - Throw descriptive error if `SUPABASE_SERVICE_ROLE_KEY` is missing
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 6. Create App Router entry point and component placeholder
  - [x] 6.1 Create `src/app/globals.css`
    - Tailwind directives: `@tailwind base; @tailwind components; @tailwind utilities;`
    - _Requirements: 9.3_

  - [x] 6.2 Create `src/app/layout.tsx`
    - Root layout with `<html>` and `<body>` tags
    - Import `globals.css`
    - _Requirements: 9.1_

  - [x] 6.3 Create `src/app/page.tsx`
    - Render `<h1>BiteCheck</h1>` as placeholder
    - _Requirements: 9.2_

  - [x] 6.4 Create `src/components/placeholder.tsx`
    - Export a minimal React component indicating future UI work
    - _Requirements: 10.1_

  - [x] 6.5 Create `tests/fixtures/` directory
    - Add a `.gitkeep` file to ensure the directory is tracked
    - _Requirements: 2.7_

- [x] 7. Install dependencies and verify build
  - Run `npm install` to install all dependencies
  - Run `npm run build` to verify zero TypeScript and build errors
  - _Requirements: 1.6_

- [ ] 8. Write scaffold verification tests
  - [ ]* 8.1 Write `tests/types.test.ts` — Type export verification
    - Verify all shared types are importable from `@/lib/types`
    - Verify `UserProfile`, `MenuItem`, `ConflictType`, `DiscrepancyReport`, `ParsedIntent`, `AgentResponse`, `ReasoningEvent` are exported
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 8.2 Write `tests/stubs.test.ts` — Pipeline stub signature verification
    - Verify `parseQuery`, `retrieveCandidates`, `auditItems`, `rankAndRecommend` are importable
    - Verify each stub throws `"Not implemented"` when called
    - Verify `detectDiscrepancies` is importable and throws `"Not implemented"`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1_

  - [ ]* 8.3 Write `tests/models.test.ts` — Model registry verification
    - Verify `MODELS.AGENT_REASONING === "gpt-4o"`
    - Verify `MODELS.COST_SENSITIVE === "gpt-4o-mini"`
    - _Requirements: 4.1, 4.3_

  - [ ]* 8.4 Write `tests/db-client.test.ts` — Supabase client initialization tests
    - Verify missing env vars produce descriptive errors
    - _Requirements: 7.3_

  - [ ]* 8.5 Write `tests/gitignore.test.ts` — Git configuration verification
    - Verify `.gitignore` includes `.env.local`, `.env`, `node_modules/`, `.next/`, `.DS_Store`
    - Verify `.gitignore` does not exclude `.kiro/`
    - _Requirements: 8.1, 8.2_

- [x] 9. Final checkpoint — Ensure all tests pass and build succeeds
  - Run `npm run build` and `npm run test` to confirm zero errors
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- No property-based tests — the scaffold has no business logic, only structural/configuration checks
- All stub functions throw `"Not implemented"` to surface accidental calls during development
- The pipeline is 4 steps only: parse-query → retrieve-candidates → audit-items → rank-and-recommend (no generate-response)
- `parseQuery` takes only `(query: string)` — no profile parameter
