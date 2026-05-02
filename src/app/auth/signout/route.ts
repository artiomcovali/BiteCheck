/**
 * POST /auth/signout — sign the current user out and redirect to /login.
 *
 * Use this from a `<form action="/auth/signout" method="post">` button or via
 * `fetch("/auth/signout", { method: "POST" })`. We accept POST only (not GET)
 * so a malicious link or prefetch can't drop the user's session.
 */

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  const url = new URL("/login", req.url);
  return NextResponse.redirect(url, { status: 303 });
}
