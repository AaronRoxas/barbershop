import Link from "next/link";
import type { Tables } from "@/lib/types/database";
import { appointmentDate, appointmentTime } from "@/lib/time/booking";
import { formatPrice } from "@/lib/site/format";

export function statusLabel(status: string) { return status === "no_show" ? "No-show" : status.charAt(0).toUpperCase() + status.slice(1); }
export function AppointmentList({ rows, barbers, timezone }: { rows: Tables<"appointments">[]; barbers: Tables<"barbers">[]; timezone: string }) {
  if (!rows.length) return <p className="empty-state">No appointments match this view.</p>;
  return <div className="admin-appointments">{rows.map((a) => <article key={a.id} className="admin-appointment">
    <div><p className="eyebrow">{appointmentDate(a.starts_at, timezone)}</p><h3>{appointmentTime(a.starts_at, timezone)} · {a.customer_name}</h3>
      <p>{a.service_name} · {barbers.find((b) => b.id === a.barber_id)?.name ?? "Barber"} · {formatPrice(a.price_minor, a.currency)}</p></div>
    <div className="admin-appointment-actions"><span className={`admin-status status-${a.status}`}>{statusLabel(a.status)}</span>
      <Link className="text-link" href={`/admin/appointments/${a.id}`}>Manage <span aria-hidden="true">↗</span></Link></div>
  </article>)}</div>;
}
