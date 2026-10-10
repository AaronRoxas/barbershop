import Link from "next/link";
import { z } from "zod";
import { getAdminCatalog, getAdminAppointments } from "@/lib/db/admin";
import { APPOINTMENT_STATUSES } from "@/lib/types/appointment";
import { AppointmentList, statusLabel } from "@/components/admin/appointments";
import { Field, SelectField } from "@/components/admin/fields";

export default async function AppointmentsPage({ searchParams }: PageProps<"/admin/appointments">) {
  const { business, barbers } = await getAdminCatalog();
  const raw = await searchParams;
  const filters = { from: z.iso.date().safeParse(raw.from).data, to: z.iso.date().safeParse(raw.to).data,
    status: z.enum(APPOINTMENT_STATUSES).safeParse(raw.status).data, barber: z.guid().safeParse(raw.barber).data,
    page: z.coerce.number().int().min(0).max(10000).safeParse(raw.page ?? 0).data ?? 0, upcoming: raw.upcoming === "true" };
  const valid = !filters.from || !filters.to || filters.from <= filters.to;
  const appointments = valid ? await getAdminAppointments(filters) : { rows: [], hasNext: false };
  function pageLink(page: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value !== undefined) query.set(key, String(value));
    query.set("page", String(page)); return `/admin/appointments?${query}`;
  }
  return <section className="admin-section"><div className="admin-title"><div><h1>Appointments</h1><p>Find a booking, adjust a schedule, or check in a customer. Times in {business.timezone}.</p></div>
    <Link className="button button-dark" href="/admin/appointments/new">New appointment</Link></div>
    <form className="admin-form admin-filters" action="/admin/appointments">
      {filters.upcoming && <input name="upcoming" type="hidden" value="true" />}
      <Field label="From date" name="from" type="date" defaultValue={filters.from} />
      <Field label="Through date" name="to" type="date" defaultValue={filters.to} />
      <SelectField label="Status" name="status" value={filters.status ?? ""}><option value="">All statuses</option>{APPOINTMENT_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</SelectField>
      <SelectField label="Barber" name="barber" value={filters.barber ?? ""}><option value="">All barbers</option>{barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</SelectField>
      <button className="button button-dark">Filter</button><Link className="text-link" href="/admin/appointments">Clear</Link>
    </form>
    {!valid && <p className="booking-error" role="alert">From date must be before or equal to through date.</p>}
    {filters.upcoming && <p className="fine-print">Showing future pending and confirmed appointments. Clear filters to see history.</p>}
    <AppointmentList rows={appointments.rows} barbers={barbers} timezone={business.timezone} />
    <nav className="admin-pagination" aria-label="Appointment pages">
      {filters.page > 0 && <Link className="text-link" href={pageLink(filters.page - 1)}>Previous</Link>}
      <span>Page {filters.page + 1}</span>{appointments.hasNext && <Link className="text-link" href={pageLink(filters.page + 1)}>Next</Link>}
    </nav>
  </section>;
}
