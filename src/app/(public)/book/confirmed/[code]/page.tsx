import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSiteBusiness } from "@/lib/site/data";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { PageIntro } from "@/components/public/ui";
import { appointmentDate, appointmentTime } from "@/lib/time/booking";
import { formatPrice } from "@/lib/site/format";
import { canViewConfirmation } from "@/lib/booking/confirmation";
export const metadata: Metadata = { title: "Booking confirmation", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function BookingConfirmationPage({ params }: PageProps<"/book/confirmed/[code]">) {
  const { code } = await params;
  const authorized = canViewConfirmation(code, (await cookies()).get("booking-confirmation")?.value);
  const business = authorized ? await getSiteBusiness() : null;
  const { data: booking } = business ? await createServiceRoleSupabaseClient().from("appointments")
    .select("reference_code,status,starts_at,ends_at,service_name,price_minor,currency,barber_id")
    .eq("business_id", business.id).eq("reference_code", code).maybeSingle() : { data: null };
  const { data: barber } = booking && business ? await createServiceRoleSupabaseClient().from("barbers").select("name")
    .eq("business_id", business.id).eq("id", booking.barber_id).maybeSingle() : { data: null };
  return <main id="main-content"><PageIntro eyebrow="YOUR APPOINTMENT" title={booking ? "You’re on the calendar." : "Check your appointment."}
    description={booking ? "Your appointment has been saved. Keep your reference for any questions or changes." : "Open this page in the browser you used to book, or contact the shop with your booking reference."} />
    <section className="container booking-confirmation">{booking && business && <dl className="booking-summary">
      <dt>Reference</dt><dd>{booking.reference_code}</dd><dt>Status</dt><dd>{booking.status === "pending" ? "Booked · awaiting shop confirmation" : booking.status.replace("_", " ")}</dd>
      <dt>Service</dt><dd>{booking.service_name} · {formatPrice(booking.price_minor, booking.currency)}</dd>
      <dt>Barber</dt><dd>{barber?.name || "Your assigned barber"}</dd><dt>When</dt><dd>{appointmentDate(booking.starts_at, business.timezone)}<br />{appointmentTime(booking.starts_at, business.timezone)}–{appointmentTime(booking.ends_at, business.timezone)} ({business.timezone})</dd>
    </dl>}<p>For changes or cancellations, please contact the shop.</p><Link className="button button-dark" href="/contact">Contact the shop</Link></section>
  </main>;
}
