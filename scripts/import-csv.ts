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
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

loadEnvFile(".env.local");
loadEnvFile(".env");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EXPECTED_HEADERS = [
  "date",
  "day_of_week",
  "location",
  "building",
  "meal_period",
  "station",
  "item_name",
  "item_id",
  "portion",
  "description",
  "added_sugar_g",
  "calcium_mg",
  "calories",
  "calories_from_fat",
  "cholesterol_mg",
  "fiber_g",
  "iron_mg",
  "potassium_mg",
  "protein_g",
  "sat_fat_g",
  "sodium_mg",
  "sugar_g",
  "total_carbs_g",
  "total_fat_g",
  "trans_fat_g",
  "vitamin_c_mg",
  "vitamin_d_mcg",
  "ingredients",
  "allergens",
  "dietary_labels",
] as const;

type CsvHeader = (typeof EXPECTED_HEADERS)[number];
type MenuItemRow = Record<CsvHeader, string | number | null>;

function loadEnvFile(filename: string) {
  const fullPath = resolve(process.cwd(), filename);
  if (!existsSync(fullPath)) return;

  const contents = readFileSync(fullPath, "utf-8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    const unquoted =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    process.env[key] = unquoted;
  }
}

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
  if (
    headers.length !== EXPECTED_HEADERS.length ||
    !EXPECTED_HEADERS.every((header, index) => headers[index] === header)
  ) {
    console.error("CSV headers do not match the expected menu_items schema.");
    console.error(`Expected: ${EXPECTED_HEADERS.join(", ")}`);
    process.exit(1);
  }

  const numericFields = new Set([
    "added_sugar_g",
    "calcium_mg",
    "calories",
    "calories_from_fat",
    "cholesterol_mg",
    "fiber_g",
    "iron_mg",
    "potassium_mg",
    "protein_g",
    "total_fat_g",
    "sat_fat_g",
    "sodium_mg",
    "total_carbs_g",
    "sugar_g",
    "trans_fat_g",
    "vitamin_c_mg",
    "vitamin_d_mcg",
  ]);

  const rows: MenuItemRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {} as MenuItemRow;

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j] as CsvHeader;
      const value = values[j] || "";

      if (numericFields.has(header)) {
        row[header] = parseNumeric(value);
      } else if (header === "meal_period") {
        row[header] = value === "Everyday" ? "Every Day" : value;
      } else {
        row[header] = value;
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
    const { error } = await supabase.from("menu_items").upsert(batch, {
      onConflict: "date,item_id,location,meal_period,station",
    });

    if (error) {
      console.error(
        `Error upserting batch starting at row ${i}:`,
        error.message
      );
      console.error("First row in failed batch:", JSON.stringify(batch[0], null, 2));
      process.exit(1);
    }

    inserted += batch.length;
    console.log(`Inserted ${inserted}/${rows.length} rows...`);
  }

  console.log(`\nDone! Upserted ${inserted} rows into menu_items.`);

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
