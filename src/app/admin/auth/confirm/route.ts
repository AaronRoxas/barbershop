import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPublicEnvConfigured } from "@/lib/env/public";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const token = params.get("token_hash"), type = params.get("type");
  if (isPublicEnvConfigured() && token && token.length <= 512 && (type === "invite" || type === "recovery")) {
    const client = await createServerSupabaseClient();
    const { error } = await client.auth.verifyOtp({ token_hash: token, type });
    if (!error) redirect("/admin/password");
  }
  redirect("/admin/login?link=invalid");
}
