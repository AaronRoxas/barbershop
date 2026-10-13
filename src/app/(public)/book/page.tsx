import type { Metadata } from "next";
import { getSiteCatalog } from "@/lib/site/data";
import { PageIntro, Unavailable } from "@/components/public/ui";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { addDays, shopDate } from "@/lib/time/booking";
export const metadata: Metadata = { title: "Book an appointment", robots: { index: false, follow: false } };
export default async function BookPage({ searchParams }: PageProps<"/book">) {
  const [catalog, params] = await Promise.all([getSiteCatalog(), searchParams]);
  if (!catalog) return <Unavailable />;
  const today = shopDate(catalog.business.timezone);
  return <main id="main-content"><PageIntro eyebrow="YOUR NEXT FRESH START" title="Make time for yourself." description="Choose your cut, find a time, and we’ll take care of the rest." />
    <BookingWizard services={catalog.services.map(({ id, name, description, duration_minutes, price_minor }) => ({ id, name, description, duration_minutes, price_minor }))}
      barbers={catalog.barbers.map(({ id, name }) => ({ id, name }))} assignments={catalog.assignments.map(({ service_id, barber_id }) => ({ service_id, barber_id }))}
      timezone={catalog.business.timezone} currency={catalog.business.currency} today={today}
      lastDate={addDays(today, catalog.business.maximum_booking_days)} initialService={typeof params.service === "string" ? params.service : ""}
      initialBarber={typeof params.barber === "string" ? params.barber : ""} />
  </main>;
}
