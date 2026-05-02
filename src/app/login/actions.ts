"use server";

/**
 * Auth server actions for the /login page.
 *
 * Shaped for `useActionState` — each action takes `(prevState, formData)`
 * and returns either a redirect (which throws internally and never returns)
 * or `{ error }` for the form to display. We don't echo the email back to
 * the client on error to avoid leaking enumeration signals; the form
 * preserves what the user typed via uncontrolled `defaultValue`.
 */

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

export type AuthFormState = { error: string } | null;

const Credentials = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = Credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  const next = (formData.get("next") as string) || "/";
  redirect(next.startsWith("/") ? next : "/");
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = Credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  // If your Supabase project has email confirmation enabled, `data.session`
  // will be null and the user must verify before signing in. Surface that
  // explicitly so they don't see a blank redirect to /onboarding.
  if (!data.session) {
    return {
      error:
        "Check your email to confirm your account, then sign in. (You can also disable email confirmation in your Supabase project's Auth settings.)",
    };
  }

  redirect("/onboarding");
}

export async function signOutAction(): Promise<never> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
