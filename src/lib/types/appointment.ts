export const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const BLOCKING_APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
] as const satisfies readonly AppointmentStatus[];
