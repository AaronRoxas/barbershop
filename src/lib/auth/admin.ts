import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPublicEnv, isPublicEnvConfigured } from "@/lib/env/public";

// Request-scoped only. Every page, query and mutation calls this guard.
export const requireAdmin = cache(async (ownerOnly = false) => {
  if (!isPublicEnvConfigured()) redirect("/admin/login");
  const client = await createServerSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: business, error } = await client.from("businesses").select("*")
    .eq("slug", getPublicEnv().NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG).maybeSingle();
  if (error) throw new Error("Unable to load your shop.");
  if (!business) redirect("/admin/login?access=denied");
  const { data: membership, error: memberError } = await client.from("business_members").select("role")
    .eq("business_id", business.id).eq("user_id", user.id).maybeSingle();
  if (memberError) throw new Error("Unable to verify shop access.");
  if (!membership) redirect("/admin/login?access=denied");
  if (ownerOnly && membership.role !== "owner") redirect("/admin?access=owner");
  return { client, business, user, role: membership.role };
});
