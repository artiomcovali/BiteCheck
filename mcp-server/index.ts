/**
 * BiteCheck MCP Server
 *
 * Custom MCP server exposing Cal Poly dining menu data to Kiro.
 * Lets Kiro query the dataset directly while writing code — so when you ask
 * "show me items labeled vegan that contain dairy in ingredients," it returns
 * real rows from the dataset.
 *
 * Tools:
 *   - query_menu_items: filtered Supabase query
 *   - find_discrepancies: rows matching a specific conflict type
 *   - get_field_distribution: frequency counts for a given field
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try loading .env from parent directory first, then current directory
config({ path: resolve(__dirname, "../.env") });
config({ path: resolve(__dirname, ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const server = new McpServer({
  name: "bitecheck-menu-data",
  version: "1.0.0",
});

// Tool 1: query_menu_items
server.tool(
  "query_menu_items",
  "Query Cal Poly dining menu items with filters. Returns real rows from the dataset.",
  {
    location: z.string().optional().describe("Filter by dining location name"),
    meal_period: z
      .enum(["Breakfast", "Lunch", "Dinner", "Every Day"])
      .optional()
      .describe("Filter by meal period"),
    date: z.string().optional().describe("Filter by date (ISO format)"),
    contains_label: z
      .string()
      .optional()
      .describe("Substring match on dietary_labels field"),
    contains_ingredient: z
      .string()
      .optional()
      .describe("Substring match on ingredients field"),
    limit: z
      .number()
      .min(1)
      .max(50)
      .default(10)
      .describe("Max rows to return (default 10, max 50)"),
  },
  async (params) => {
    let query = supabase
      .from("menu_items")
      .select(
        "item_name, location, meal_period, station, dietary_labels, ingredients, calories, protein_g"
      );

    if (params.location) {
      query = query.ilike("location", `%${params.location}%`);
    }
    if (params.meal_period) {
      query = query.eq("meal_period", params.meal_period);
    }
    if (params.date) {
      query = query.eq("date", params.date);
    }
    if (params.contains_label) {
      query = query.ilike("dietary_labels", `%${params.contains_label}%`);
    }
    if (params.contains_ingredient) {
      query = query.ilike("ingredients", `%${params.contains_ingredient}%`);
    }

    query = query.limit(params.limit ?? 10);

    const { data, error } = await query;

    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// Tool 2: find_discrepancies
server.tool(
  "find_discrepancies",
  "Find menu items that likely exhibit a specific data conflict type. Useful for testing the discrepancy detector against real data.",
  {
    conflict_type: z
      .enum([
        "label_ingredient",
        "missing_classification",
        "cross_contamination",
        "allergen_in_dietary_field",
        "empty_data",
      ])
      .describe("The type of discrepancy to search for"),
    limit: z
      .number()
      .min(1)
      .max(50)
      .default(10)
      .describe("Max rows to return"),
  },
  async (params) => {
    let query = supabase
      .from("menu_items")
      .select(
        "item_name, location, meal_period, dietary_labels, ingredients, allergens"
      );

    switch (params.conflict_type) {
      case "label_ingredient":
        // Items labeled Vegan/Vegetarian but with animal terms in ingredients
        query = query
          .or("dietary_labels.ilike.%Vegan%,dietary_labels.ilike.%Vegetarian%")
          .not("ingredients", "is", null)
          .neq("ingredients", "");
        break;

      case "missing_classification":
        // Items with meat tags but no Vegan/Vegetarian label
        query = query.or(
          "dietary_labels.ilike.%Beef%,dietary_labels.ilike.%Pork%,dietary_labels.ilike.%Chicken%,dietary_labels.ilike.%Turkey%,dietary_labels.ilike.%Fish%"
        );
        break;

      case "cross_contamination":
        // Items with asterisk-suffixed entries in dietary_labels
        query = query.ilike("dietary_labels", "%*%");
        break;

      case "allergen_in_dietary_field":
        // Items labeled Vegan but also containing Milk or Egg tags
        query = query
          .ilike("dietary_labels", "%Vegan%")
          .or("dietary_labels.ilike.%Milk%,dietary_labels.ilike.%Egg%");
        break;

      case "empty_data":
        // Items with no ingredients AND no dietary_labels
        query = query
          .or("ingredients.is.null,ingredients.eq.")
          .or("dietary_labels.is.null,dietary_labels.eq.");
        break;
    }

    query = query.limit(params.limit ?? 10);

    const { data, error } = await query;

    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${data?.length ?? 0} items matching conflict type "${params.conflict_type}":\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }
);

// Tool 3: get_field_distribution
server.tool(
  "get_field_distribution",
  "Get frequency counts for values in a given field across the menu_items dataset. Useful for understanding data shape and discovering edge cases.",
  {
    field_name: z
      .enum([
        "location",
        "meal_period",
        "station",
        "dietary_labels",
        "day_of_week",
      ])
      .describe("The field to analyze"),
  },
  async (params) => {
    const { data, error } = await supabase
      .from("menu_items")
      .select(params.field_name);

    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }

    // Count frequencies
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const value = (row as Record<string, string>)[params.field_name] || "(empty)";
      counts[value] = (counts[value] || 0) + 1;
    }

    // Sort by count descending
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count }));

    return {
      content: [
        {
          type: "text",
          text: `Distribution for "${params.field_name}" (${sorted.length} unique values):\n\n${JSON.stringify(sorted.slice(0, 30), null, 2)}`,
        },
      ],
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BiteCheck MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
