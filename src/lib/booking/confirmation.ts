import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env/server";

export function confirmationCookie(reference: string) {
  const signature = createHmac("sha256", getServerEnv().SUPABASE_SERVICE_ROLE_KEY)
    .update(`booking-confirmation:${reference}`).digest("hex");
  return `${reference}.${signature}`;
}
export function canViewConfirmation(reference: string, cookie: string | undefined) {
  if (!/^BRB-[A-F0-9]{32}$/.test(reference) || !cookie) return false;
  const expected = Buffer.from(confirmationCookie(reference));
  const actual = Buffer.from(cookie);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
