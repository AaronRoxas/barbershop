import "server-only";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type { BookingSlot } from "@/lib/types/booking";
export async function getAvailability(business: string, service: string, barber: string | undefined, date: string) {
  const { data, error } = await createServiceRoleSupabaseClient().rpc("booking_availability", {
    p_business: business, p_service: service, p_barber: barber ?? null!, p_date: date,
  });
  if (error) throw new Error("Availability could not be loaded.");
  return data as unknown as BookingSlot[];
}
