import Link from "next/link";
import { getAdminCatalog, getAdminAppointments, getAdminCounts } from "@/lib/db/admin";
import { shopDate } from "@/lib/time/booking";
import { AppointmentList } from "@/components/admin/appointments";

export default async function AdminHomePage({ searchParams }: PageProps<"/admin">) {
  const { business, barbers } = await getAdminCatalog();
  const today = shopDate(business.timezone);
  const [counts, appointments, params] = await Promise.all([getAdminCounts(), getAdminAppointments({ from: today, to: today }), searchParams]);
  const stats = [
    { label: "Today", value: counts.today, query: `from=${today}&to=${today}` },
    { label: "Upcoming", value: counts.upcoming, query: "upcoming=true" },
    { label: "Pending", value: counts.pending, query: "status=pending" },
    { label: "Completed", value: counts.completed, query: "status=completed" },
    { label: "Cancelled", value: counts.cancelled, query: "status=cancelled" },
  ];
  return <section className="admin-section"><div className="admin-title"><div><h1>Your day, at a glance.</h1><p>All times in {business.timezone}.</p></div>
    <Link className="button button-dark" href="/admin/appointments/new">New appointment <span aria-hidden="true">+</span></Link></div>
    {params.access === "owner" && <p role="alert" className="booking-error">Only shop owners can manage these settings.</p>}
    <div className="admin-stats">{stats.map((s) => <Link key={s.label} href={`/admin/appointments?${s.query}`}><span>{s.label}</span><strong>{s.value}</strong></Link>)}</div>
    <div className="section-heading"><h2>Today’s appointments</h2><Link className="text-link" href="/admin/appointments">View all</Link></div>
    <AppointmentList rows={appointments.rows} barbers={barbers} timezone={business.timezone} />
    {appointments.hasNext && <Link className="text-link" href={`/admin/appointments?from=${today}&to=${today}`}>See the full day</Link>}
  </section>;
}
