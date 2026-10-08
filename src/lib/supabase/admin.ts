import "server-only";

import { createClient } from "@supabase/supabase-js";
import { serverWebSocketTransport } from "@/lib/supabase/transport";
import { getServerEnv } from "@/lib/env/server";
import type { Database } from "@/lib/types/database";

export function createServiceRoleSupabaseClient() {
  const env = getServerEnv();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      realtime: { transport: serverWebSocketTransport },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
