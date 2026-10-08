import { z } from "zod";
// Existing catalog fixtures use UUIDs without RFC version bits; Postgres accepts them.
export const availabilitySchema = z.object({ service: z.guid(), barber: z.guid().optional(), date: z.iso.date() });
export const bookingSchema = z.object({
  service: z.guid(), barber: z.guid().nullable(), startsAt: z.iso.datetime({ offset: true }),
  requestId: z.uuid(), name: z.string().trim().min(1).max(120), email: z.email().max(254),
  phone: z.string().trim().min(3).max(40).regex(/^[+\d() .-]+$/), notes: z.string().trim().max(2000),
});
