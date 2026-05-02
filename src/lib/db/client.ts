/**
 * Supabase client initialization for BiteCheck.
 *
 * Exports two clients:
 * - {@link supabase} — Public client for standard queries (uses anon key).
 * - {@link supabaseAdmin} — Admin client for server-side operations
 *   requiring elevated privileges (uses service role key).
 *
 * Both clients fail fast with descriptive errors when required
 * environment variables are missing, surfacing configuration problems
 * during development rather than at query time.
 *
 * @see requirements.md Requirement 7
 * @module
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
  );
}

/**
 * Public Supabase client initialized with the anonymous key.
 * Used for client-side and standard server-side queries.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (!supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase environment variable: SUPABASE_SERVICE_ROLE_KEY must be set"
  );
}

/**
 * Admin Supabase client initialized with the service role key.
 * Used for server-side operations requiring elevated privileges.
 *
 * **Do not expose this client to client-side code.**
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
