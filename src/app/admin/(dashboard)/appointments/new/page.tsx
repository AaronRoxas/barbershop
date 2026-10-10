import Link from "next/link";
import { getAdminCatalog } from "@/lib/db/admin";
import { AppointmentForm } from "@/components/admin/appointment-form";
export default async function NewAppointmentPage() {
  const { business, services, barbers, assignments } = await getAdminCatalog();
  return <section className="admin-section"><Link className="text-link" href="/admin/appointments">Back to appointments</Link><h1>New appointment</h1>
    <p>Choose a service, an assigned barber, and a shop-local start time.</p>
    <p className="fine-print">{barbers.filter((b) => b.is_active).map((b) => `${b.name}: ${services.filter((s) => s.is_active && assignments.some((a) => a.barber_id === b.id && a.service_id === s.id)).map((s) => s.name).join(", ") || "no assigned services"}`).join(" · ")}</p>
    <AppointmentForm services={services} barbers={barbers} timezone={business.timezone} />
  </section>;
}
