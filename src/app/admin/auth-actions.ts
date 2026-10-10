"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AdminFormState } from "@/lib/types/admin";
import { requireAdmin } from "@/lib/auth/admin";

export async function signIn(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const parsed = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const client = await createServerSupabaseClient();
  try {
    const { error } = await client.auth.signInWithPassword(parsed.data);
    if (error) return { error: "Sign-in failed. Check your credentials and try again." };
  } catch { return { error: "Sign-in is unavailable. Please try again." }; }
  redirect("/admin");
}
export async function signOut() {
  const client = await createServerSupabaseClient();
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) throw new Error("Unable to sign out. Please retry.");
  redirect("/admin/login");
}
export async function setPassword(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const { client } = await requireAdmin();
  const parsed = z.object({ password: z.string().min(12).max(200), confirmation: z.string() })
    .refine((v) => v.password === v.confirmation, "Passwords must match.").safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Use at least 12 characters and make sure passwords match." };
  const { error } = await client.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Unable to set your password. Please try again or request a new invitation." };
  redirect("/admin");
}
