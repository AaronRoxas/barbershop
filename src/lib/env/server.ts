import "server-only";

import { z } from "zod";
import { getPublicEnv } from "@/lib/env/public";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export function getServerEnv() {
  const publicEnv = getPublicEnv();
  const parsed = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and never expose this key to the client.",
    );
  }

  return {
    ...publicEnv,
    ...parsed.data,
  };
}
