/**
 * Import Cal Poly dining CSV into Supabase menu_items table.
 *
 * Usage:
 *   npx tsx scripts/import-csv.ts data/calpoly_menu_2026-04-26_to_2026-05-02.csv
 *
 * Requires:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - The menu_items table already created in Supabase (see Task 2 SQL)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseNumeric(val: string): number | null {
  if (!val || val.trim() === "") return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error(
      "Usage: npx tsx scripts/import-csv.ts <path-to-csv>"
    );
    process.exit(1);
  }

  const fullPath = resolve(process.cwd(), csvPath);
  console.log(`Reading CSV from: ${fullPath}`);

  const raw = readFileSync(fullPath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    console.error("CSV has no data rows");
    process.exit(1);
  }

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.replace(/^\uFEFF/, "").trim()
  );
  console.log(`Found ${lines.length - 1} data rows`);
  console.log(`Headers: ${headers.join(", ")}`);

  // Map CSV headers to our DB columns
  // The CSV headers from the actual file:
  // date, meal_period, location, station, item_name, description,
  // ingredients, dietary_labels, allergens, calories, total_fat_g,
  // sat_fat_g, trans_fat_g, cholesterol_mg, sodium_mg, total_carbs_g,
  // fiber_g, sugar_g, added_sugar_g, protein_g, calcium_mg, iron_mg,
  // potassium_mg, vitamin_c_mg, vitamin_d_mcg

  const numericFields = new Set([
    "calories",
    "total_fat_g",
    "sat_fat_g",
    "trans_fat_g",
    "cholesterol_mg",
    "sodium_mg",
    "total_carbs_g",
    "fiber_g",
    "sugar_g",
    "added_sugar_g",
    "protein_g",
    "calcium_mg",
    "iron_mg",
    "potassium_mg",
    "vitamin_c_mg",
    "vitamin_d_mcg",
  ]);

  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, unknown> = {};

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const value = values[j] || "";

      if (numericFields.has(header)) {
        row[header] = parseNumeric(value);
      } else if (header === "date") {
        // Keep date as string — Supabase handles ISO date strings
        row[header] = value || null;
      } else {
        row[header] = value || null;
      }
    }

    // Skip rows with no item_name
    if (!row.item_name) continue;

    rows.push(row);
  }

  console.log(`Parsed ${rows.length} valid rows`);

  // Insert in batches of 500
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("menu_items").insert(batch);

    if (error) {
      console.error(
        `Error inserting batch starting at row ${i}:`,
        error.message
      );
      console.error("First row in failed batch:", JSON.stringify(batch[0], null, 2));
      process.exit(1);
    }

    inserted += batch.length;
    console.log(`Inserted ${inserted}/${rows.length} rows...`);
  }

  console.log(`\nDone! Inserted ${inserted} rows into menu_items.`);

  // Quick verification
  const { count } = await supabase
    .from("menu_items")
    .select("*", { count: "exact", head: true });

  console.log(`Verification: menu_items table now has ${count} rows.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
