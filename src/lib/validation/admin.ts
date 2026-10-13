import { z } from "zod";
import { APPOINTMENT_STATUSES } from "@/lib/types/appointment";
import { maxWholePrice } from "@/lib/money";

const name = z.string().trim().min(1).max(120);
const text = z.string().trim().max(2000);
const integer = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
const optionalId = z.union([z.guid(), z.literal("")]).transform((v) => v || null);
const localTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/)
  .refine((v) => z.iso.date().safeParse(v.slice(0, 10)).success && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(v.slice(11)), "Enter a valid shop-local time.");
export const appointmentSchema = z.object({
  id: optionalId, expected: z.union([z.iso.datetime({ offset: true }), z.literal("")]).transform((v) => v || null),
  service: z.guid(), barber: z.guid(), localStart: localTime, status: z.enum(APPOINTMENT_STATUSES),
  name, email: z.email().max(254), phone: z.string().trim().min(3).max(40).regex(/^[+\d() .-]+$/), notes: text,
  request: z.uuid(),
});
export const serviceSchema = (currency: string) => z.object({ id: optionalId, name, description: text,
  price: z.string().trim().min(1, "Enter a price.").pipe(z.coerce.number<string>()
    .int("Enter a whole-number price.").min(0, "Price cannot be negative.").max(maxWholePrice(currency), "Price is too large.")),
  duration_minutes: integer(5, 480), sort_order: integer(-10000, 10000),
  is_active: z.boolean() });
export const barberSchema = z.object({ id: optionalId, name, biography: text, specialty: z.string().trim().max(500),
  is_active: z.boolean() });
const social = z.union([z.literal(""), z.url().max(500).refine((v) => {
  const url = new URL(v); return url.protocol === "https:" && !url.username && !url.password;
}, "Use an HTTPS social link.")]);
export const businessSchema = z.object({
  name, description: text, address: z.string().trim().max(1000), phone: z.string().trim().max(40),
  email: z.union([z.email().max(254), z.literal("")]), story: z.string().trim().max(10000), philosophy: text,
  timezone: z.string().min(1).max(100).refine((v) => { try { new Intl.DateTimeFormat("en", { timeZone: v }); return true; } catch { return false; } }, "Unknown timezone."),
  currency: z.string().regex(/^[A-Z]{3}$/).refine((v) => Intl.supportedValuesOf("currency").includes(v), "Unknown currency."),
  slot_interval_minutes: integer(5, 120), minimum_notice_minutes: integer(0, 525600), maximum_booking_days: integer(1, 365),
  instagram: social, facebook: social, tiktok: social, is_active: z.boolean(),
});
export const overrideSchema = z.object({ barber: optionalId, date: z.iso.date(), is_closed: z.boolean(),
  opens_at: z.string(), closes_at: z.string() }).refine((v) => v.is_closed ||
  (/^([01]\d|2[0-3]):[0-5]\d$/.test(v.opens_at) && /^([01]\d|2[0-3]):[0-5]\d$/.test(v.closes_at) && v.opens_at < v.closes_at), "Opening time must be before closing time.");
export const timeOffSchema = z.object({ barber: optionalId, start: localTime, end: localTime, reason: text })
  .refine((v) => v.start < v.end, "End must be after start.");
export function parseWeeklyHours(form: FormData) {
  const intervals: { weekday: number; opens_at: string; closes_at: string }[] = [];
  for (let day = 1; day <= 7; day++) {
    const value = z.string().max(500).parse(form.get(`day${day}`) ?? "");
    if (!value.trim()) continue;
    for (const interval of value.split(",")) {
      const match = interval.trim().match(/^(([01]\d|2[0-3]):[0-5]\d)-(([01]\d|2[0-3]):[0-5]\d)$/);
      if (!match || match[1] >= match[3]) throw new Error("Use opening-closing intervals, for example 09:00-12:00, 13:00-19:00.");
      intervals.push({ weekday: day, opens_at: match[1], closes_at: match[3] });
    }
  }
  if (intervals.length > 70) throw new Error("Use no more than 70 weekly intervals.");
  return { barber: optionalId.parse(form.get("barber")), intervals };
}
