# Requirements Document

## Introduction

This spec defines the scaffolding of the BiteCheck Next.js 15 application. The goal is to establish the project structure, configuration files, shared types, and stub functions so that subsequent specs (Agent Decision Loop, Discrepancy Detection, Streaming UI) can be implemented against a consistent, buildable codebase. No business logic is implemented here — only types, interfaces, directory layout, and function signatures with TODO placeholders.

## Glossary

- **BiteCheck**: The dietary safety application for Cal Poly students that provides source-cited, risk-aware dining recommendations.
- **Scaffold**: The initial project structure including configuration files, directory layout, shared types, and stub functions with correct signatures but no business logic.
- **App_Router**: The Next.js 15 routing system using the `src/app/` directory convention with file-based routing and React Server Components.
- **Pipeline_Step**: One of the four sequential functions in the Agent Decision Loop (parse-query, retrieve-candidates, audit-items, rank-and-recommend). The pipeline orchestrator emits the final ReasoningEvent directly from the rank step's output.
- **Stub_Function**: An exported function with the correct TypeScript signature, parameter types, and return type that contains only a TODO comment and throws or returns a placeholder value.
- **Models_Registry**: The centralized `src/lib/agent/models.ts` file that exports model string constants referenced by all LLM-calling code.
- **Supabase_Client**: The configured `@supabase/supabase-js` client initialized from environment variables, providing database access to the `menu_items` table.
- **Discrepancy_Detector**: The pure, deterministic function `detectDiscrepancies` defined in spec 02 that evaluates menu items against a user profile.
- **UserProfile**: The user's dietary configuration containing `restrictions`, `religious_dietary`, `allergens`, and `severity` fields.
- **MenuItem**: A single row from the Cal Poly dining dataset with fields including `item_name`, `dietary_labels`, `ingredients`, `allergens`, and nutrition columns.
- **DiscrepancyReport**: The output of the Discrepancy_Detector containing a `status` and an array of `conflicts`.

## Requirements

### Requirement 1: Next.js 15 Project Configuration

**User Story:** As a developer, I want a correctly configured Next.js 15 project with App Router and TypeScript, so that I can build BiteCheck features on a stable foundation.

#### Acceptance Criteria

1. THE Scaffold SHALL include a `package.json` with `next` (version 15), `react`, `react-dom`, `typescript`, `tailwindcss`, `openai` (v4+), `@supabase/supabase-js`, and `zod` as dependencies, and `vitest` as a dev dependency.
2. THE Scaffold SHALL include a `tsconfig.json` configured for Next.js 15 with strict mode enabled, path aliases mapping `@/*` to `src/*`, and JSX set to `preserve`.
3. THE Scaffold SHALL include a `tailwind.config.ts` that scans `src/**/*.{ts,tsx}` for class usage.
4. THE Scaffold SHALL include a `next.config.js` (or `.mjs`/`.ts`) with App Router enabled and no custom overrides beyond defaults.
5. THE Scaffold SHALL include a `vitest.config.ts` configured with path alias resolution matching `tsconfig.json`.
6. WHEN a developer runs `npm install` followed by `npm run build`, THE Scaffold SHALL complete without TypeScript or build errors.

### Requirement 2: Directory Structure

**User Story:** As a developer, I want a well-organized directory structure matching the BiteCheck architecture, so that each spec's implementation has a clear home.

#### Acceptance Criteria

1. THE Scaffold SHALL create the directory `src/app/` for pages and API routes.
2. THE Scaffold SHALL create the directory `src/lib/db/` for the Supabase_Client and database types.
3. THE Scaffold SHALL create the directory `src/lib/agent/` for Pipeline_Step files and the Models_Registry.
4. THE Scaffold SHALL create the directory `src/lib/discrepancy/` for the Discrepancy_Detector module.
5. THE Scaffold SHALL create the directory `src/lib/types/` for shared TypeScript types matching specs 01 and 02.
6. THE Scaffold SHALL create the directory `src/components/` with a placeholder file for future UI work.
7. THE Scaffold SHALL create the directories `tests/` and `tests/fixtures/` for test files and fixture data.

### Requirement 3: Shared Type Definitions

**User Story:** As a developer, I want shared TypeScript types that match the schemas in specs 01 and 02, so that all modules use consistent data structures.

#### Acceptance Criteria

1. THE Scaffold SHALL export a `UserProfile` type from `src/lib/types/` with fields `restrictions: string[]`, `religious_dietary: string[]`, `allergens: string[]`, and `severity: "medical" | "strict" | "preference"`.
2. THE Scaffold SHALL export a `MenuItem` type from `src/lib/types/` with fields matching the Cal Poly dining dataset columns: `item_name`, `location`, `meal_period`, `station`, `description`, `ingredients`, `dietary_labels`, `allergens`, and all nutrition columns (`calories`, `protein_g`, `total_fat_g`, `total_carbs_g`, `fiber_g`, `sodium_mg`, `sugar_g`, `added_sugar_g`, `sat_fat_g`, `trans_fat_g`, `cholesterol_mg`, `calcium_mg`, `iron_mg`, `potassium_mg`, `vitamin_c_mg`, `vitamin_d_mcg`).
3. THE Scaffold SHALL export a `DiscrepancyReport` type from `src/lib/types/` with fields `status: "safe" | "flagged" | "unsafe" | "insufficient_data"` and `conflicts: Array<{ type: ConflictType; description: string; fields_involved: string[] }>`.
4. THE Scaffold SHALL export a `ConflictType` type as a union of `"label_ingredient" | "missing_classification" | "cross_contamination" | "allergen_in_dietary_field" | "empty_data"`.
5. THE Scaffold SHALL export a `ReasoningEvent` type from `src/lib/types/` with a discriminated union on `type: "parse" | "retrieve" | "audit" | "rank" | "complete" | "error"`, each variant carrying the fields specified in spec 01.
6. THE Scaffold SHALL export an `AgentResponse` type from `src/lib/types/` with `recommendations`, `warnings`, and `reasoning_summary` fields matching the schema in spec 01.
7. THE Scaffold SHALL export a `ParsedIntent` type from `src/lib/types/` with fields `location_filter: string | null`, `meal_period_filter: "Breakfast" | "Lunch" | "Dinner" | null`, `nutritional_goal: { nutrient: string; target: number; op: "min" | "max" } | null`, and `query_type: "what_can_i_eat" | "is_this_safe" | "nutritional_optimization" | "general"`.

### Requirement 4: LLM Model Registry

**User Story:** As a developer, I want model strings centralized in one file, so that changing the LLM model requires editing only one location.

#### Acceptance Criteria

1. THE Models_Registry SHALL export a constant object named `MODELS` with the property `AGENT_REASONING` set to `"gpt-4o"` and the property `COST_SENSITIVE` set to `"gpt-4o-mini"`.
2. THE Models_Registry SHALL be located at `src/lib/agent/models.ts`.
3. THE Models_Registry SHALL use `as const` to ensure the exported values are literal string types.

### Requirement 5: Agent Pipeline Stub Functions

**User Story:** As a developer, I want each pipeline step exported as a typed stub function, so that spec 01 implementation can fill in the logic without changing signatures.

#### Acceptance Criteria

1. THE Scaffold SHALL create `src/lib/agent/parse-query.ts` exporting an async function `parseQuery` that accepts `(query: string)` and returns `Promise<ParsedIntent>`, containing only a `// TODO: implement per spec` comment. The parser extracts intent from the query string only — the user profile is not passed to avoid premature filtering that would bypass the deterministic discrepancy detector.
2. THE Scaffold SHALL create `src/lib/agent/retrieve-candidates.ts` exporting an async function `retrieveCandidates` that accepts `(intent: ParsedIntent)` and returns `Promise<MenuItem[]>`, containing only a `// TODO: implement per spec` comment.
3. THE Scaffold SHALL create `src/lib/agent/audit-items.ts` exporting a function `auditItems` that accepts `(items: MenuItem[], profile: UserProfile)` and returns `Array<{ item: MenuItem; report: DiscrepancyReport }>`, containing only a `// TODO: implement per spec` comment.
4. THE Scaffold SHALL create `src/lib/agent/rank-and-recommend.ts` exporting an async function `rankAndRecommend` that accepts `(auditedItems: Array<{ item: MenuItem; report: DiscrepancyReport }>, profile: UserProfile, intent: ParsedIntent)` and returns `Promise<AgentResponse>`, containing only a `// TODO: implement per spec` comment. This is the final pipeline step — the pipeline orchestrator wraps its output as a `ReasoningEvent { type: "complete" }` for streaming.
5. THE Scaffold SHALL NOT include a separate `generate-response.ts` file. The `rankAndRecommend` step already produces the full `AgentResponse` structure (recommendations, warnings, reasoning_summary). The pipeline orchestrator emits this directly as the final `ReasoningEvent`, which the streaming UI renders into discrete cards per spec 03. A separate generation step would add an unnecessary hop with no distinct responsibility.

### Requirement 6: Discrepancy Detector Stub

**User Story:** As a developer, I want the discrepancy detector function stubbed with the correct signature, so that spec 02 implementation can proceed without restructuring.

#### Acceptance Criteria

1. THE Scaffold SHALL create `src/lib/discrepancy/detect-discrepancies.ts` exporting a function `detectDiscrepancies` that accepts `(item: MenuItem, profile: UserProfile)` and returns `DiscrepancyReport`, containing only a `// TODO: implement per spec` comment.

### Requirement 7: Supabase Client Setup

**User Story:** As a developer, I want a pre-configured Supabase client, so that database queries can be made from server-side code immediately.

#### Acceptance Criteria

1. THE Scaffold SHALL create `src/lib/db/client.ts` that initializes and exports a Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from environment variables.
2. THE Scaffold SHALL create `src/lib/db/client.ts` that also exports a `supabaseAdmin` client initialized with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for server-side operations requiring elevated privileges.
3. IF `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is not set, THEN THE Supabase_Client SHALL throw a descriptive error at initialization time.

### Requirement 8: Git Configuration Verification

**User Story:** As a developer, I want the `.gitignore` to exclude build artifacts and secrets but not the `.kiro/` directory, so that specs and steering documents are version-controlled.

#### Acceptance Criteria

1. THE Scaffold SHALL verify that `.gitignore` does not contain an entry that excludes the `.kiro/` directory.
2. THE Scaffold SHALL ensure `.gitignore` includes entries for `.env.local`, `.env`, `node_modules/`, `.next/`, and `.DS_Store`.

### Requirement 9: Minimal App Router Entry Point

**User Story:** As a developer, I want a minimal working App Router page, so that `npm run dev` renders something and confirms the framework is wired correctly.

#### Acceptance Criteria

1. THE Scaffold SHALL create `src/app/layout.tsx` as the root layout with HTML and body tags, importing global Tailwind CSS styles.
2. THE Scaffold SHALL create `src/app/page.tsx` as the home page rendering a placeholder heading with the text "BiteCheck".
3. THE Scaffold SHALL create `src/app/globals.css` with Tailwind CSS directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`).

### Requirement 10: Component Placeholder

**User Story:** As a developer (Person B), I want a placeholder in the components directory, so that the UI work has a clear starting point.

#### Acceptance Criteria

1. THE Scaffold SHALL create `src/components/placeholder.tsx` exporting a React component that renders a comment or minimal element indicating future UI work.
