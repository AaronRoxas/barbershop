import type { Database } from "@/lib/types/database";

export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const satisfies readonly AppointmentStatus[];

export const BLOCKING_APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
] as const satisfies readonly AppointmentStatus[];
