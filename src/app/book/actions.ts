"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { bookingSchema } from "@/lib/validation/booking";
import { getSiteBusiness } from "@/lib/site/data";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { confirmationCookie } from "@/lib/booking/confirmation";
export async function submitBooking(input: unknown): Promise<{ error: string }> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check your selection and customer details." };
  let reference: string;
  try {
    const business = await getSiteBusiness();
    if (!business) return { error: "Booking is unavailable. Please contact the shop." };
    const value = parsed.data;
    const { data, error } = await createServiceRoleSupabaseClient().rpc("create_guest_booking", {
      p_business: business.id, p_service: value.service, p_barber: value.barber ?? null!,
      p_starts_at: value.startsAt, p_request: value.requestId,
      p_name: value.name, p_email: value.email, p_phone: value.phone, p_notes: value.notes,
    });
    if (error) return { error: error.code === "23P01"
      ? "That time is no longer available. Please choose another time."
      : "We couldn’t save your appointment. Please try again or contact the shop." };
    reference = data;
    (await cookies()).set("booking-confirmation", confirmationCookie(reference), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: "/book/confirmed", maxAge: 60 * 60 * 24 * 7,
    });
  } catch {
    return { error: "We couldn’t verify your booking. Retry with the same details or contact the shop." };
  }
  redirect(`/book/confirmed/${reference}`);
}
