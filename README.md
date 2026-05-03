<p align="center">
  <img src="public/bitecheck-banner.png" alt="BiteCheck" width="420" />
</p>

<h1 align="center">BiteCheck — Know Before You Bite</h1>

<p align="center">
  <strong>Category:</strong> Human-Centered Design Track &nbsp;·&nbsp;
  <strong>Built with:</strong> <a href="https://kiro.dev">Kiro</a> · Next.js 15 · Supabase · OpenAI · TypeScript
</p>

BiteCheck is a safety-first dining assistant for Cal Poly San Luis Obispo students with allergies, religious dietary restrictions, and dietary preferences. It cross-references Cal Poly's real dining data against each student's profile and flags conflicts _before_ they eat — because a student with celiac disease, a Hindu vegetarian commitment, or a severe shellfish allergy can't afford to trust a single "Vegan" label that contradicts the ingredients list.

**Live demo:** [bite-check-eight.vercel.app](https://bite-check-eight.vercel.app)

---

## Table of Contents

- [What Is BiteCheck?](#what-is-bitecheck)
- [Why Was This Built?](#why-was-this-built)
- [What Problems Does It Solve?](#what-problems-does-it-solve)
- [Technologies Used](#technologies-used)
- [What Was Implemented](#what-was-implemented)
- [How Kiro Was Used](#how-kiro-was-used)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Maintainers](#maintainers)
- [License](#license)

---

## What Is BiteCheck?

BiteCheck is a web application that gives Cal Poly students a personalized, audited view of campus dining. It combines:

1. **A deterministic discrepancy detector** that cross-checks dietary labels against ingredient lists, flags cross-contamination risks based on severity level, and catches label conflicts the dining system misses.

2. **An AI agent** powered by OpenAI's structured outputs that takes natural-language questions ("What's safe at Vista Grande for dinner?", "Find high-protein vegan options") and returns source-cited recommendations — never claiming certainty the data doesn't support.

3. **A menu browser** with date, location, and safety filters across the full week's dining data (~3,600+ items across 10+ restaurants).

4. **A profile system** that treats religious dietary restrictions (halal, kosher, Hindu vegetarian, Jain vegetarian) with the same rigor as medical allergies — because they are non-negotiable for the students who hold them.

Every recommendation cites at least two data fields. Every warning explains which fields conflicted and why. The agent never hides flagged items — it surfaces them with plain-English explanations so students can make informed decisions.

---

## Why Was This Built?

### Students can't find reliable nutrition information

This isn't a hypothetical problem. Cal Poly students have been posting about it on Reddit:

- In [r/CalPoly: "Grub Hub Nutrition"](https://www.reddit.com/r/CalPoly/comments/1g37z1x/grub_hub_nutrition/), a student asked where to find nutrition facts for campus dining food. The GrubHub integration Cal Poly uses for ordering doesn't surface nutrition data in a usable way, and the official Dine On Campus app buries it behind multiple taps — if it's there at all.

- In [r/CalPoly: "Best healthy food options"](https://www.reddit.com/r/CalPoly/comments/1kf3fi5/best_healthy_food_options/), students were crowdsourcing which dining halls have healthy options because there's no tool that lets them filter by nutrition, compare protein across locations, or find what actually fits their dietary needs.

These posts reflect a pattern: students who care about what they eat — whether for health, fitness, allergies, or religious reasons — are left guessing. The official tools don't give them what they need, so they ask strangers on Reddit instead.

### The data exists, but it's unreliable

Cal Poly's dining dataset actually contains nutrition facts, ingredients, and dietary labels for every menu item. The problem is that the data has serious integrity issues that no existing tool addresses:

- The `dietary_labels` field mixes dietary categories, allergens, ingredient flags, and cross-contamination warnings into one semicolon-delimited string
- The dedicated `allergens` column is **empty across all 3,668 rows**
- Items labeled "Vegan" sometimes list `Milk` or `Egg` in the same field
- Asterisk-suffixed entries like `Beef*` or `Mustard*` indicate cross-contamination risk, but nothing in the app explains what the asterisk means
- The `ingredients` field is free-text and can contradict the labels

A student with celiac disease who trusts a "Gluten-Free" label without checking the ingredients list is at real medical risk. A Hindu vegetarian student who sees no meat tag but also no vegetarian tag has no way to know if the item is safe. A student trying to hit their protein goals has to manually check every item across 10+ restaurants.

BiteCheck exists because **the gap between what the data says and what students need to know is a safety problem**, and no one else is solving it. The nutrition data is there — it just needs an app that cross-checks it, flags the conflicts, and presents it in a way students can actually use.

---

## What Problems Does It Solve?

### 1. Unreliable dietary labels

The discrepancy detector catches five categories of data conflicts: label-ingredient contradictions, missing dietary classifications, cross-contamination flags, allergen-in-dietary-field conflicts, and missing data. Each conflict produces a human-readable explanation, not a technical error code.

### 2. Cross-contamination ambiguity

Asterisk-suffixed entries (`Egg*`, `Soy*`) are meaningless to most students. BiteCheck interprets them based on the student's severity level: medical severity treats them as unsafe, strict severity flags them for caution, preference severity notes them without alarm.

### 3. Religious restrictions treated as preferences

Most dining apps treat "halal" or "kosher" as filter checkboxes equivalent to "low-carb." BiteCheck's steering rules and code enforce that religious dietary commitments receive the same rigor as medical allergies — because for the students who hold them, they are equally non-negotiable.

### 4. No source transparency

When a dining app says "this is safe," students have no way to verify the claim. BiteCheck's dual-source citation requirement means every recommendation must cite at least two data fields (e.g., "the dietary_labels field marks this vegan, and the ingredients list confirms no animal products"). Single-source recommendations are downgraded to low confidence.

### 5. Information overload

3,600+ menu items across a week, 10+ restaurants, multiple meal periods. BiteCheck's agent pipeline narrows this to the 10 most relevant safe options in under 6 seconds, with location diversity so students see options across campus — not just the first restaurant alphabetically.

---

## Technologies Used

| Layer           | Technology                            | Why                                                                                                           |
| --------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Framework**   | Next.js 15 (App Router)               | Server components for data-heavy pages, server actions for profile updates, streaming SSE for agent responses |
| **Language**    | TypeScript 5.9                        | End-to-end type safety from Supabase schema to React components                                               |
| **Database**    | Supabase (PostgreSQL + Auth + RLS)    | Row-level security, real-time auth, hosted PostgreSQL with the dining dataset                                 |
| **AI**          | OpenAI GPT-4o with Structured Outputs | Guaranteed schema conformance via Zod-derived JSON schemas — no prompt-only JSON parsing                      |
| **Styling**     | Tailwind CSS + CSS custom properties  | Design token system (`--bc-primary`, `--bc-safe`, `--bc-warn`, `--bc-unsafe`) for consistent theming          |
| **Validation**  | Zod                                   | Shared schemas between API routes, server actions, and OpenAI structured outputs                              |
| **Development** | Kiro                                  | Spec-driven development, steering docs, agent hooks, custom MCP server                                        |
| **Deployment**  | Vercel                                | Zero-config Next.js hosting with edge middleware                                                              |
| **Data**        | Cal Poly dining CSV (scraped weekly)  | 3,668 items with nutrition, ingredients, dietary labels, and cross-contamination flags                        |

---

## What Was Implemented

### Agent Pipeline (5-step reasoning)

1. **Parse** — LLM extracts location, meal period, nutritional goals (including qualitative: "high protein" → min 20g)
2. **Retrieve** — Paginated Supabase fetch with location diversity via round-robin
3. **Audit** — Deterministic discrepancy detector runs on every candidate (no LLM, reproducible)
4. **Rank** — LLM ranks safe items with structured output, citing source fields
5. **Complete** — Streams recommendations, warnings, and reasoning summary

### Discrepancy Detector (5 conflict categories)

- Label-ingredient conflicts (vegan label + dairy in ingredients)
- Missing dietary classification (meat tags without veg/vegan label)
- Cross-contamination flags (asterisk entries matched against user allergens)
- Allergen-in-dietary-field (vegan + milk in same field)
- Empty data (both ingredients and labels missing)

### Security

- **Input guard** — 15+ prompt injection patterns stripped before LLM calls
- **Topic relevance** — ~120 keyword check rejects off-topic queries deterministically
- **LLM prompt hardening** — Anti-injection paragraphs in all 4 system prompts
- **Rate limiting** — Per-IP (30/min) and per-session (15/min) in-memory limiter
- **Auth** — Supabase session required, profile loaded server-side (never from client)
- **RLS** — Row-level security on all Supabase tables

### Performance

- React `cache()` deduplication on data fetches
- Parallel pagination (count query → concurrent range fetches)
- `Promise.all` for profile + menu data on heavy pages
- Loading skeletons via `loading.tsx` for instant navigation
- Page transition animations (280ms fade + slide)

### UI/UX

- Step-by-step onboarding (3 pages with animated transitions)
- Menu browser with date/location/safety filters
- Compact result cards (3-4 per row grid)
- 50 rotating suggestion prompts across all dining locations
- Plain-English warnings ("Possible cross-contamination with egg" not "dietary_labels marks Egg\*")
- Yellow for double-check, red for avoid (clear visual distinction)
- Custom green radio buttons and checkboxes matching the design system
- Real Cal Poly meal plans from dineoncampus.com
- All 16 Cal Poly residence halls in housing dropdown
- ProfilePill showing name + PolyCard balance

---

## How Kiro Was Used

BiteCheck was built entirely with Kiro as the development environment. Here's how each Kiro feature shaped the project:

### Spec-Driven Development

Three specs drove the core implementation:

- **`01-agent-decision-loop.md`** — Defined the 5-step pipeline (parse → retrieve → audit → rank → complete), the `ReasoningEvent` streaming contract, the `AgentResponse` output schema, and error handling behavior. Every agent module was implemented against this spec, and the spec's acceptance criteria ("no recommendation without source citations", "all flagged items visible as warnings") became the validation hook's assertions.

- **`02-discrepancy-detection.md`** — Documented the five conflict categories derived from analyzing the actual Cal Poly CSV data. The spec captured the data realities (empty allergens column, asterisk semantics, mixed dietary*labels field) so Kiro could implement the detector with full context about \_why* each rule exists. This was more effective than vibe-coding the detector because the rules are safety-critical — getting them wrong means recommending food that could harm someone.

- **`project-scaffold/`** — Requirements, design, and task breakdown for the initial project structure. This gave Kiro the full picture before writing any code, so the architecture decisions (server components for data pages, client components for interactive filters, SSE for streaming) were coherent from the start.

The spec-driven approach was essential for the safety-critical parts of BiteCheck. Vibe-coding works for UI polish, but the discrepancy detector and agent pipeline needed precise, documented rules that Kiro could reference across multiple implementation sessions.

### Steering Docs

Four steering documents ran as persistent instructions across every Kiro interaction:

- **`safety-first-reasoning.md`** — The core safety contract. Rules like "the LLM does not override the deterministic detector," "missing data is unsafe," "religious dietary commitments deserve the same rigor as allergies," and "no medical claims" shaped every code generation decision. This was the single most impactful steering doc — it prevented Kiro from generating code that would silently filter out flagged items or use authoritative phrasing the data doesn't support.

- **`dual-source-citation.md`** — Required every recommendation to cite at least two data fields, conflicts to name both sides, and asterisk handling to be explicit. This steering doc is why BiteCheck's recommendations say "the dietary_labels field marks this vegan, and the ingredients list confirms it" instead of just "this is vegan."

- **`llm-provider.md`** — Locked the project to OpenAI with structured outputs via Zod schemas. Prevented Kiro from generating Anthropic SDK code or raw JSON mode calls. Centralized model strings in `models.ts`.

- **`domain-vocabulary.md`** — Defined the canonical restriction taxonomy (`vegan`, `vegetarian`, `gluten-free`, `halal`, `kosher`, `hindu-vegetarian`, `jain-vegetarian`), severity levels, status taxonomy, and forbidden phrasings. This ensured consistent terminology across code, prompts, and UI copy.

The strategy: steering docs handled the _constraints_ (what Kiro must always do or never do), while specs handled the _architecture_ (what to build and how the pieces connect). This separation meant Kiro could vibe-code UI features freely while the steering docs silently enforced safety rules in the background.

### Agent Hooks

Two hooks automated quality checks:

- **`validate-no-flagged-allergens.md`** — Runs after changes to agent code, discrepancy detector, or chat API. Loads fixture menu items exhibiting each conflict type, runs the full pipeline with a strict profile, and asserts that no flagged/unsafe item appears in recommendations. This is the safety net — it catches regressions before they ship.

- **`regenerate-types-on-schema-change.md`** — Runs when Supabase migrations change. Regenerates TypeScript types from the schema and runs `tsc --noEmit` to catch field name drift. This matters because the dual-source-citation steering doc requires citing real field names — if a migration renames a column, the hook catches every broken reference at compile time.

### Custom MCP Server

The `menu-data-server` MCP gave Kiro direct access to the Cal Poly dining dataset during development. Three tools:

- `query_menu_items` — Filtered queries against the real data (location, meal period, label substring, ingredient substring)
- `find_discrepancies` — Returns rows exhibiting a specific conflict type (label-ingredient, cross-contamination, etc.)
- `get_field_distribution` — Frequency counts for field values across the dataset

This was the highest-leverage Kiro integration. When implementing the discrepancy detector, Kiro could query "show me items labeled Vegan that contain dairy in ingredients" and get real rows back instantly. Without MCP, every iteration required manually exporting Supabase query results and pasting them into chat. With MCP, Kiro tested each detection rule against real conflicting data as it wrote the code.

### Vibe Coding

Beyond the spec-driven core, extensive vibe coding shaped the UI and UX:

- Dashboard layout iterations (removing sections, rearranging columns, adjusting spacing)
- Menu page filter redesign (replacing macro filters with location dropdown, evening out grid columns)
- Result card compaction (full-width rows → 3-4 per row grid)
- Warning description rewrites (technical jargon → plain English)
- Color system tuning (double-check from red → orange → yellow)
- Profile page restructuring (two-column layout, green custom controls)
- Onboarding step-by-step flow
- 50 rotating suggestion prompts
- Page transition animations
- Loading skeletons
- Performance optimizations (parallel fetching, React cache)

The conversation style was direct and iterative — "make it yellow," "get rid of the macro filters," "the dropdown is going off the box." Kiro handled these as immediate code changes with build verification, which kept the feedback loop tight.

### Kiro Powers

Two bundled powers were leveraged during development:

- **Supabase Power** — Provided direct integration with the Supabase platform for database operations, authentication setup, and RLS policy management. Instead of manually writing migrations and cross-referencing Supabase docs, the Supabase power gave Kiro contextual awareness of the Postgres schema, auth flows, and row-level security patterns. This was especially valuable when setting up the `profiles` and `menu_items` tables with their RLS policies, and when wiring up the server-side auth client (`supabaseServer`) that the middleware and profile loader depend on. Without this power, configuring Supabase's SSR cookie-based auth with Next.js App Router would have required significantly more manual documentation lookup.

- **Figma Power** — Used during the UI design-to-code phase to translate the BiteCheck design system into production components. The Figma power enabled Kiro to reference the design file directly when implementing the component library (`primitives.tsx`, `FoodCard`, `ResultItemCard`, etc.), ensuring the CSS custom properties (`--bc-primary`, `--bc-safe`, `--bc-warn`, `--bc-unsafe`), spacing, border radii, and typography tokens matched the design intent. This bridged the gap between the visual design and the coded components — rather than eyeballing screenshots, Kiro could pull exact values from the Figma source.

---

## Project Structure

```
.kiro/
├── hooks/                    # Agent hooks for automated validation
│   ├── regenerate-types-on-schema-change.md
│   └── validate-no-flagged-allergens.md
├── mcp/                      # Custom MCP server config
│   └── menu-data-server.md
├── specs/                    # Spec-driven development documents
│   ├── 01-agent-decision-loop.md
│   ├── 02-discrepancy-detection.md
│   ├── 03-streaming-ui.md
│   └── project-scaffold/
├── steering/                 # Persistent instruction documents
│   ├── safety-first-reasoning.md
│   ├── dual-source-citation.md
│   ├── llm-provider.md
│   └── domain-vocabulary.md
└── settings/

src/
├── app/                      # Next.js App Router pages
│   ├── agent/                # AI chat agent page
│   ├── api/chat/             # SSE streaming endpoint
│   ├── dashboard/            # Dashboard with spend tracking
│   ├── login/                # Auth pages
│   ├── menu/                 # Menu browser with filters
│   ├── onboarding/           # Step-by-step profile setup
│   └── profile/              # Profile settings
├── components/bitecheck/     # UI component library
│   ├── app/                  # AppShell, TopNav, PageTransition
│   ├── chat/                 # ChatPage, EmptyChat, ChatInput
│   ├── dashboard/            # DashboardPage, DashboardQuickAsk
│   ├── menu/                 # FoodCard, LocationGroups, MenuList
│   ├── profile/              # ProfileForm
│   └── results/              # ResultItemCard, ResultsView, ReasoningPanel
├── lib/
│   ├── agent/                # 5-step pipeline (parse, retrieve, audit, rank, answer)
│   ├── api/                  # Supabase data fetching with pagination
│   ├── chat/                 # SSE encoding, streaming hooks, suggestions
│   ├── discrepancy/          # Deterministic conflict detector
│   ├── menu/                 # Dietary label parser, field labels
│   ├── profile/              # Options, spend snapshot
│   ├── security/             # Rate limiter, input guard
│   └── types/                # Shared TypeScript types
└── middleware.ts              # Auth + profile gate

supabase/
└── migrations/               # Database schema
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project with the migrations applied
- An OpenAI API key

### Install

```bash
git clone https://github.com/YOUR_USERNAME/bitecheck.git
cd bitecheck
npm install
```

### Database Setup

Apply the Supabase migrations:

```bash
npx supabase db push
```

Import the dining data:

```bash
npx tsx scripts/import-csv.ts calpoly_menu_2026-04-26_to_2026-05-02.csv
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```

---

## Maintainers

- **Artiom Covali** — Cal Poly SLO
- **Colin Yang** — Cal Poly SLO
- **Cole Hackman** — Cal Poly SLO

---

## License

[MIT](LICENSE) — see the [LICENSE](LICENSE) file for details.
