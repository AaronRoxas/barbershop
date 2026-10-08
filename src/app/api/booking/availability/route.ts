import { availabilitySchema } from "@/lib/validation/booking";
import { getSiteBusiness } from "@/lib/site/data";
import { getAvailability } from "@/lib/booking/availability";
import { addDays, shopDate } from "@/lib/time/booking";
export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const parsed = availabilitySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return Response.json({ error: "Invalid selection." }, { status: 400, headers });
  try {
    const business = await getSiteBusiness();
    if (!business) return Response.json({ error: "Booking is unavailable." }, { status: 503, headers });
    const today = shopDate(business.timezone);
    if (parsed.data.date < today || parsed.data.date > addDays(today, business.maximum_booking_days))
      return Response.json({ error: "Choose a date within the booking window." }, { status: 400, headers });
    const slots = await getAvailability(business.id, parsed.data.service, parsed.data.barber, parsed.data.date);
    return Response.json({ slots }, { headers });
  } catch {
    return Response.json({ error: "We couldn’t load availability. Please try again." }, { status: 503, headers });
  }
}
