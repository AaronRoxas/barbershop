import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

function readPublicEnvInput() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG:
      process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG,
  };
}

export function isPublicEnvConfigured(): boolean {
  return publicEnvSchema.safeParse(readPublicEnvInput()).success;
}

export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse(readPublicEnvInput());

  if (!parsed.success) {
    throw new Error(
      "Missing or invalid public environment variables. Copy .env.example to .env.local.",
    );
  }

  return parsed.data;
}
