import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

// Public catalog queries deliberately use the cookie/anon client, so RLS applies.
// Never use the service-role client for public page rendering.
export async function getBusinessBySlug(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error("Unable to load business information.", { cause: error });
  return data;
}

export async function getServices(businessId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) throw new Error("Unable to load services.", { cause: error });
  return data;
}

export async function getBarbers(businessId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("barbers")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) throw new Error("Unable to load barbers.", { cause: error });
  return data;
}

export async function getBusinessHours(businessId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("business_hours")
    .select("*")
    .eq("business_id", businessId)
    .order("weekday")
    .order("opens_at");

  if (error) throw new Error("Unable to load business hours.", { cause: error });
  return data;
}
