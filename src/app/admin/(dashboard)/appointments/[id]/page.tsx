import Link from "next/link";
import { z } from "zod";
import { notFound } from "next/navigation";
import { getAdminCatalog } from "@/lib/db/admin";
import { AppointmentForm } from "@/components/admin/appointment-form";
import { formatPrice } from "@/lib/site/format";
export default async function AppointmentPage({ params, searchParams }: PageProps<"/admin/appointments/[id]">) {
  const { client, business, services, barbers } = await getAdminCatalog();
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const { data: appointment, error } = await client.from("appointments").select("*").eq("business_id", business.id).eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load appointment.");
  if (!appointment) notFound();
  const query = await searchParams;
  return <section className="admin-section"><Link className="text-link" href="/admin/appointments">Back to appointments</Link><h1>Manage appointment</h1>
    <p className="admin-reference">{appointment.reference_code}</p>
    {query.saved === "1" && <p role="status" className="admin-success">Appointment saved.</p>}
    <p>Booked: {appointment.service_name} · {appointment.duration_minutes} minutes · {formatPrice(appointment.price_minor, appointment.currency)}</p>
    <AppointmentForm key={appointment.updated_at} appointment={appointment} services={services} barbers={barbers} timezone={business.timezone} />
  </section>;
}
