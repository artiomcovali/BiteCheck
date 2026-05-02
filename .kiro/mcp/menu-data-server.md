# MCP: Menu Data Server

## Purpose

BiteCheck exposes Cal Poly dining menu data to Kiro through a custom MCP server during development. This lets Kiro query the dataset directly while writing code — so when you ask Kiro "show me items at 19 Metro labeled vegan that contain dairy in ingredients," it returns real rows from the dataset, not invented examples.

This dramatically accelerates two things:
1. **Writing the discrepancy detector** — Kiro can test each rule against real conflicting rows on the spot
2. **Generating realistic fixtures** — the validation hook's test fixtures come from actual problematic rows surfaced via MCP queries

Without MCP, every iteration on the detector requires manually exporting query results from Supabase and pasting them into the chat. With MCP, Kiro queries the data itself.

## Server capabilities

The MCP server exposes these tools to Kiro:

### `query_menu_items`
Filtered query against the menu_items table. Parameters:
- `location?: string`
- `meal_period?: "Breakfast" | "Lunch" | "Dinner" | "Every Day"`
- `date?: string` (ISO date)
- `contains_label?: string` (substring match on dietary_labels)
- `contains_ingredient?: string` (substring match on ingredients)
- `limit?: number` (default 10, max 50)

### `find_discrepancies`
Returns rows likely to exhibit a specific conflict type. Parameters:
- `conflict_type: "label_ingredient" | "missing_classification" | "cross_contamination" | "allergen_in_dietary_field" | "empty_data"`
- `limit?: number`

### `get_field_distribution`
Returns frequency counts for values in a given field across the dataset. Useful for understanding the shape of `dietary_labels` and discovering edge cases.

## Config location

`.kiro/mcp/menu-data-server.json` — points to the local MCP server process running at `localhost:3030/mcp`.

## Why this matters for the Kiro Powers writeup

Most teams in this hackathon will use stock filesystem or web-search MCPs if they use MCP at all. A custom MCP server purpose-built for the project's data layer is a strong differentiator. It demonstrates that Kiro's tool extensibility shaped the development workflow in a meaningful, project-specific way.

## Implementation note

The server is a thin Node.js wrapper around the existing Supabase client — it reuses the same queries the production app uses. Total implementation: ~80 lines. The leverage:cost ratio is high.
