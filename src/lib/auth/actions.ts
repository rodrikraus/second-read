"use server";

import { redirect } from "next/navigation";
import { isDemoAccount } from "@/lib/auth/demo-accounts";
import { createClient } from "@/lib/supabase/server";

// The stub. It opens a real Supabase session for a seeded account with a
// shared password, so auth.uid() is real and every policy applies exactly as
// it would behind a real login. It is also an account takeover button, which
// is why DEMO_PASSWORD only exists in local env files.
export async function signInAs(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = process.env.DEMO_PASSWORD;

  if (!isDemoAccount(email)) {
    redirect("/sign-in?error=unknown-account");
  }
  if (!password) {
    throw new Error("DEMO_PASSWORD is not set. Copy .env.example to .env.local, as the README describes.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/sign-in?error=sign-in-failed");
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
