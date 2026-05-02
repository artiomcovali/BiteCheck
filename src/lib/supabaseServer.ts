/**
 * Server-side Supabase client (App Router).
 *
 * Wires Next's async cookie store to Supabase's `getAll` / `setAll` interface
 * so auth state is read from the request and refreshed cookies flow back to
 * the response. Use this in server components, server actions, and route
 * handlers.
 *
 * Server Components are not allowed to write cookies — Next throws when you
 * try. We swallow that error here because the matching middleware
 * (`src/middleware.ts`) does the actual cookie refresh on every request.
 *
 * This is intentionally separate from the legacy `src/lib/db/client.ts` —
 * that file holds the anon + service-role clients used for admin queries
 * (e.g., reading the foods table). Auth flows go through this module.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function supabaseServer(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies — middleware handles refresh.
        }
      },
    },
  });
}
