# Spec: Streaming Reasoning UI

## Purpose

Make the agent's reasoning visible. The user must see *what* the agent is doing, *what* it found, and *why* it concluded what it did — not just a final answer in a chat bubble.

This is the primary differentiator in the demo. A static chat response loses. Streaming reasoning wins.

## Layout

Single-page chat-style interface. No tabs, no sidebars (other than profile summary). The user types in a prompt at the bottom, and the response renders as a *vertical stack of distinct cards* above the input, not as a single message bubble.

```
┌─────────────────────────────────────┐
│ Profile pill: vegan · gluten-free   │  ← top bar shows active restrictions
├─────────────────────────────────────┤
│                                     │
│  [User query bubble]                │
│                                     │
│  ┌─[Reasoning card 1: Parsing]─┐   │  ← streams in
│  │ Understanding: Vegan         │   │
│  │ student looking for...       │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌─[Reasoning card 2: Retrieval]┐  │  ← streams in
│  │ Found 47 items at 19 Metro   │   │
│  │ for dinner tonight           │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌─[Reasoning card 3: Audit]─────┐  │  ← streams in
│  │ ⚠ 3 items flagged             │  │
│  │ • Pad Thai labeled vegan but  │  │
│  │   ingredients list fish sauce │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─[Recommendation cards]────────┐  │  ← final result
│  │ ✅ Stir-fried tofu             │  │
│  │ confidence: high               │  │
│  │ source: dietary_labels,        │  │
│  │   ingredients (no conflicts)  │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│ [input box]                  [send] │
└─────────────────────────────────────┘
```

## Card types

### Reasoning cards (intermediate)

Render as smaller, muted-color cards. One per `ReasoningEvent`:

- **Parse** — shows the parsed intent (location, meal, query type)
- **Retrieve** — shows count of candidates and the filter applied
- **Audit** — shows summary stats AND the most interesting flagged item if any (this is the magic moment)
- **Rank** — shows that ranking is happening, brief

### Recommendation cards (final)

Render as larger, full-width cards with:
- Item name (bold, larger font)
- Location and meal period (subdued)
- Confidence badge: 🟢 High / 🟡 Medium / 🔴 Low
- Reasoning paragraph (1-2 sentences)
- "Why this recommendation?" expandable section showing source fields

### Warning cards (final, separate from recommendations)

Visually distinct (red/amber border). Lists items the agent identified as problematic, with the conflict type and an explanation. Never hidden — always shown when present.

## Streaming behavior

- Cards appear one at a time with a brief fade-in (200ms)
- The reasoning cards render BEFORE the final recommendations
- A subtle "thinking" indicator (pulsing dot or shimmer) shows between events
- Total animation pacing: 400-800ms between cards. Fast enough to not feel slow, slow enough to read.

## Profile bar

Persistent top bar showing active restrictions as pills. Click to edit. This makes it visually obvious in the demo that the agent is operating against a real user profile, not generic queries.

## Demo-critical UI moments

These three visual moments must be unmistakable in a 30-second screen recording:

1. **The audit conflict moment.** When a flagged item appears in the audit card, the conflict description must be readable in a single glance. Use a warning icon, the item name, and one short explanatory sentence. This is the screenshot judges remember.

2. **The confidence gradient.** Recommendations must show high/medium/low confidence visually distinctly. Color + icon + label. No ambiguity.

3. **The source citation expand.** "Why this recommendation?" reveals the actual CSV fields that drove the decision. This proves the agent isn't hallucinating — it's reasoning over real data.

## Technical implementation

- Next.js App Router with React Server Components for initial load
- Streaming via Server-Sent Events or AI SDK's `useChat` with custom event types
- Each `ReasoningEvent` arrives as a typed message and renders to its corresponding card component
- Cards persist in scroll history; user can scroll up to see prior queries

## Out of scope

- Voice input
- Image input or food photo recognition
- Multi-modal output (just text + structured data)
- Conversation history persistence across sessions
