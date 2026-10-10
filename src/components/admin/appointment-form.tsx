import { randomUUID } from "node:crypto";
import { AdminForm } from "@/components/admin/form";
import { Field, Hidden, SelectField, TextField } from "@/components/admin/fields";
import { saveAppointment } from "@/app/admin/actions";
import { APPOINTMENT_STATUSES } from "@/lib/types/appointment";
import { statusLabel } from "@/components/admin/appointments";
import { shopLocalInput } from "@/lib/time/admin";
import type { Tables } from "@/lib/types/database";

export function AppointmentForm({ appointment: a, services, barbers, timezone }: {
  appointment?: Tables<"appointments">; services: Tables<"services">[]; barbers: Tables<"barbers">[]; timezone: string;
}) {
  const terminal = a && ["completed", "cancelled", "no_show"].includes(a.status);
  const statuses = terminal ? [a.status] : a ? APPOINTMENT_STATUSES : ["pending", "confirmed"];
  return <AdminForm action={saveAppointment} submit={a ? "Save appointment" : "Create appointment"}>
    <Hidden name="id" value={a?.id ?? ""} /><Hidden name="expected" value={a?.updated_at ?? ""} />
    <Hidden name="request" value={a?.request_id ?? randomUUID()} />
    <div className="admin-grid">
      <SelectField label="Service" name="service" value={a?.service_id}>
        {services.filter((s) => s.is_active || s.id === a?.service_id).map((s) => <option key={s.id} value={s.id}>{s.name}{s.is_active ? "" : " (disabled)"}</option>)}
      </SelectField>
      <SelectField label="Barber" name="barber" value={a?.barber_id}>
        {barbers.filter((b) => b.is_active || b.id === a?.barber_id).map((b) => <option key={b.id} value={b.id}>{b.name}{b.is_active ? "" : " (disabled)"}</option>)}
      </SelectField>
      <Field label={`Start (${timezone})`} name="localStart" type="datetime-local" step="1" required defaultValue={a ? shopLocalInput(a.starts_at, timezone) : ""} />
      <SelectField label="Status" name="status" value={a?.status ?? "confirmed"}>
        {statuses.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
      </SelectField>
      <Field label="Customer name" name="name" defaultValue={a?.customer_name} required maxLength={120} autoComplete="name" />
      <Field label="Customer email" name="email" type="email" defaultValue={a?.customer_email} required maxLength={254} autoComplete="email" />
      <Field label="Customer phone" name="phone" type="tel" defaultValue={a?.customer_phone} required maxLength={40} autoComplete="tel" />
    </div>
    <TextField label="Customer notes" name="notes" value={a?.customer_notes} />
    <p className="fine-print">Times use the shop timezone. The full service must fit an assigned barber’s available hours and booking window.
      {a && " Rescheduling the same service keeps its booked price and duration. Changing service uses current catalog values."}
      {terminal && " Finished appointments allow contact corrections only."}</p>
  </AdminForm>;
}
