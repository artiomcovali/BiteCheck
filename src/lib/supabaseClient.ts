"use client";

/**
 * Browser-side Supabase client.
 *
 * Reads the public anon key from `NEXT_PUBLIC_*` env vars. Returns a
 * memoized singleton so every component shares the same auth state and
 * cookie jar — calling `createBrowserClient` more than once silently breaks
 * realtime auth refresh in some Supabase versions.
 *
 * For server components, server actions, route handlers, and middleware
 * use `supabaseServer()` from `./supabaseServer` instead.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }
  cached = createBrowserClient(url, anonKey);
  return cached;
}
