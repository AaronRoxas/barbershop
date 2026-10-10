import { getAdminSchedule } from "@/lib/db/admin";
import { AdminForm } from "@/components/admin/form";
import { Field, Hidden, SelectField } from "@/components/admin/fields";
import { saveHours, saveOverride, saveTimeOff, deleteScheduleEntry } from "@/app/admin/actions";
import { WEEKDAYS, formatTime } from "@/lib/site/format";
import { appointmentDate, appointmentTime } from "@/lib/time/booking";
import type { Tables } from "@/lib/types/database";

function WeeklyHours({ barber = "", hours }: { barber?: string; hours: Pick<Tables<"business_hours">, "weekday" | "opens_at" | "closes_at">[] }) {
  return <AdminForm action={saveHours} submit="Save weekly hours"><Hidden name="barber" value={barber} />
    <p className="fine-print">Use 24-hour intervals separated by commas, e.g. 09:00-12:00, 13:00-19:00. Leave a day empty for closed. Overnight hours must be split across days.</p>
    <div className="admin-grid">{WEEKDAYS.map((day, i) => <Field key={day} label={day} name={`day${i + 1}`} maxLength={500}
      defaultValue={hours.filter((h) => h.weekday === i + 1).map((h) => `${h.opens_at.slice(0, 5)}-${h.closes_at.slice(0, 5)}`).join(", ")} />)}</div>
  </AdminForm>;
}
export default async function SchedulePage() {
  const { business, barbers, shopHours, barberHours, overrides, timeOff } = await getAdminSchedule();
  const barberOptions = <><option value="">Whole shop</option>{barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</>;
  const target = (id: string | null) => id ? barbers.find((b) => b.id === id)?.name ?? "Barber" : "Whole shop";
  return <section className="admin-section"><h1>Availability</h1><p>All dates and times use {business.timezone}. Bookings require both shop and barber hours.</p>
    <p className="fine-print">Schedule changes affect new bookings. They do not cancel existing appointments. Review affected bookings and reschedule or cancel them individually.</p>
    <article className="admin-record"><h2>Shop hours</h2><WeeklyHours hours={shopHours} /></article>
    {barbers.map((b) => <details key={b.id} className="admin-details"><summary>{b.name} — weekly hours{b.is_active ? "" : " (disabled)"}</summary>
      <WeeklyHours barber={b.id} hours={barberHours.filter((h) => h.barber_id === b.id)} /></details>)}
    <article className="admin-record"><h2>Special dates</h2><p>Close a date or replace its usual hours. Time off can add breaks within special hours.</p>
      <AdminForm action={saveOverride} submit="Add special date"><div className="admin-grid">
        <SelectField label="Applies to" name="barber" value="">{barberOptions}</SelectField>
        <Field label="Date" name="date" type="date" required />
        <Field label="Opens at (if open)" name="opens_at" type="time" /><Field label="Closes at (if open)" name="closes_at" type="time" /></div>
        <label className="admin-checkbox"><input name="is_closed" type="checkbox" defaultChecked />Closed all day</label>
      </AdminForm>
      {!overrides.length && <p className="empty-state">No special dates.</p>}
      {overrides.map((o) => <div key={o.id} className="admin-schedule-entry"><p>{o.date} · {target(o.barber_id)} · {o.is_closed ? "Closed" : `${formatTime(o.opens_at!)}–${formatTime(o.closes_at!)}`}</p>
        <AdminForm action={deleteScheduleEntry} submit="Remove"><Hidden name="id" value={o.id} /><Hidden name="table" value="schedule_overrides" /></AdminForm></div>)}
    </article>
    <article className="admin-record"><h2>Time off & breaks</h2>
      <AdminForm action={saveTimeOff} submit="Block time"><div className="admin-grid">
        <SelectField label="Applies to" name="barber" value="">{barberOptions}</SelectField>
        <Field label="Start" name="start" type="datetime-local" required /><Field label="End" name="end" type="datetime-local" required />
        <Field label="Private reason (optional)" name="reason" maxLength={2000} /></div>
      </AdminForm>
      {!timeOff.length && <p className="empty-state">No blocked time.</p>}
      {timeOff.map((t) => <div key={t.id} className="admin-schedule-entry"><div><p>{target(t.barber_id)} · {appointmentDate(t.starts_at, business.timezone)} {appointmentTime(t.starts_at, business.timezone)} – {appointmentDate(t.ends_at, business.timezone)} {appointmentTime(t.ends_at, business.timezone)}</p><p>{t.reason}</p></div>
        <AdminForm action={deleteScheduleEntry} submit="Remove"><Hidden name="id" value={t.id} /><Hidden name="table" value="time_off" /></AdminForm></div>)}
      {(overrides.length === 500 || timeOff.length === 500) && <p className="fine-print">Showing the first 500 entries. Remove outdated entries to see more.</p>}
    </article>
  </section>;
}
