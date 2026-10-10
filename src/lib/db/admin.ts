import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import type { AppointmentStatus } from "@/lib/types/appointment";

export async function getAdminCatalog(ownerOnly = false) {
  const context = await requireAdmin(ownerOnly);
  const { client, business } = context;
  const results = await Promise.all([
    client.from("services").select("*").eq("business_id", business.id).order("sort_order").order("name"),
    client.from("barbers").select("*").eq("business_id", business.id).order("sort_order").order("name"),
    client.from("barber_services").select("*").eq("business_id", business.id),
  ]);
  for (const result of results) if (result.error) throw new Error("Unable to load your catalog.");
  return { ...context, services: results[0].data!, barbers: results[1].data!, assignments: results[2].data! };
}
export async function getAdminAppointments(filters: { from?: string; to?: string; status?: AppointmentStatus; barber?: string; page?: number; upcoming?: boolean } = {}) {
  const { client, business } = await requireAdmin();
  const { data, error } = await client.rpc("list_admin_appointments", { p_business: business.id,
    p_from: filters.from ?? null!, p_to: filters.to ?? null!, p_status: filters.status ?? null!,
    p_barber: filters.barber ?? null!, p_page: filters.page ?? 0, p_upcoming: filters.upcoming ?? false });
  if (error) throw new Error("Unable to load appointments.");
  return { rows: data.slice(0, 50), hasNext: data.length > 50 };
}
export async function getAdminCounts() {
  const { client, business } = await requireAdmin();
  const { data, error } = await client.rpc("admin_appointment_counts", { p_business: business.id });
  if (error) throw new Error("Unable to load appointment counts.");
  return z.object({ today: z.number(), upcoming: z.number(), pending: z.number(), completed: z.number(), cancelled: z.number() }).parse(data);
}
export async function getAdminSchedule() {
  const context = await getAdminCatalog(true);
  const { client, business } = context;
  const results = await Promise.all([
    client.from("business_hours").select("*").eq("business_id", business.id).order("opens_at"),
    client.from("barber_hours").select("*").eq("business_id", business.id).order("opens_at"),
    client.from("schedule_overrides").select("*").eq("business_id", business.id).order("date").limit(500),
    client.from("time_off").select("*").eq("business_id", business.id).order("starts_at").limit(500),
  ]);
  for (const result of results) if (result.error) throw new Error("Unable to load availability settings.");
  return { ...context, shopHours: results[0].data!, barberHours: results[1].data!, overrides: results[2].data!, timeOff: results[3].data! };
}
