"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitBooking } from "@/app/(public)/book/actions";
import { bookingSchema } from "@/lib/validation/booking";
import { addDays, appointmentDate, appointmentTime, TIME_PERIODS, timePeriod, type TimePeriod } from "@/lib/time/booking";
import { BookingCalendar, monthDates, monthStart } from "@/components/booking/booking-calendar";
import { formatPrice } from "@/lib/site/format";
import type { BookingSlot } from "@/lib/types/booking";

type Props = {
  services: { id: string; name: string; description: string; duration_minutes: number; price_minor: number }[];
  barbers: { id: string; name: string }[]; assignments: { service_id: string; barber_id: string }[];
  timezone: string; currency: string; today: string; lastDate: string; initialService: string; initialBarber: string;
};
const steps = ["Service", "Barber", "Date", "Time", "Your details", "Review"];

export function BookingWizard(props: Props) {
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(props.services.some((s) => s.id === props.initialService) ? props.initialService : "");
  const [barberId, setBarberId] = useState(props.barbers.some((b) => b.id === props.initialBarber) && (!props.initialService || props.assignments.some((a) => a.service_id === props.initialService && a.barber_id === props.initialBarber)) ? props.initialBarber : "");
  const [month, setMonth] = useState(monthStart(props.today));
  const [period, setPeriod] = useState<TimePeriod | "">("");
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [date, setDate] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", notes: "" });
  const [pending, startTransition] = useTransition();
  const request = useRef<{ payload: string; id: string } | null>(null);
  const fetchSequence = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [step]);
  const service = props.services.find((s) => s.id === serviceId);
  const eligible = props.barbers.filter((b) => props.assignments.some((a) => a.service_id === serviceId && a.barber_id === b.id));
  const times = [...new Map(slots.filter((s) => s.date === date).map((s) => [s.startsAt, s])).values()];
  const periodTimes = times.filter((s) => timePeriod(s.startsAt, props.timezone) === period);
  const selected = slots.find((s) => s.startsAt === startsAt);
  const busy = pending || loading;

  async function loadMonth(value: string) {
    const sequence = ++fetchSequence.current;
    setMonth(value); setLoading(true); setError(""); setSlots([]); setDate(""); setStartsAt(""); setPeriod("");
    const dates = monthDates(value).filter((day) => day >= props.today && day <= props.lastDate);
    const batches: string[] = [];
    for (let day = dates[0]; day && day <= dates.at(-1)!; day = addDays(day, 7)) batches.push(day);
    try {
      const results = await Promise.all(batches.map(async (day) => {
        const query = new URLSearchParams({ service: serviceId, date: day });
        if (barberId) query.set("barber", barberId);
        const response = await fetch(`/api/booking/availability?${query}`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Availability could not be loaded.");
        return result.slots as BookingSlot[];
      }));
      if (sequence === fetchSequence.current) setSlots(results.flat().filter((slot) => slot.date.startsWith(value.slice(0, 7))));
    } catch (cause) {
      if (sequence === fetchSequence.current) setError(cause instanceof Error ? cause.message : "Availability could not be loaded. Please retry.");
    } finally { if (sequence === fetchSequence.current) setLoading(false); }
  }

  function book() {
    const payload = { service: serviceId, barber: barberId || null, startsAt, ...customer };
    const serialized = JSON.stringify(payload);
    if (request.current?.payload !== serialized) request.current = { payload: serialized, id: crypto.randomUUID() };
    const input = { ...payload, requestId: request.current.id };
    if (!bookingSchema.safeParse(input).success) { setError("Please check your selection and customer details."); return; }
    setError("");
    startTransition(async () => {
      try { const result = await submitBooking(input); setError(result.error); }
      catch { setError("We couldn’t verify your booking. Retry with the same details or contact the shop."); }
    });
  }

  if (!props.services.length || !props.barbers.length) return <section className="container booking-wizard"><p>Online booking isn’t available yet. Please contact the shop.</p></section>;
  return <section className="container booking-wizard" aria-busy={busy}>
    <ol className="booking-progress" aria-label="Booking progress">{steps.map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
    <p className="fine-print">All times are in {props.timezone}. A slot is reserved only after you submit your booking.</p>
    <h2 ref={heading} tabIndex={-1}>{steps[step]}</h2>
    {error && <p role="alert" className="booking-error">{error}</p>}
    {step === 0 && <fieldset className="booking-options"><legend className="sr-only">Choose a service</legend>{props.services.map((item) => <label key={item.id} className="booking-option">
      <input type="radio" name="service" value={item.id} checked={serviceId === item.id} onChange={() => { setServiceId(item.id); setBarberId(props.assignments.some((a) => a.service_id === item.id && a.barber_id === props.initialBarber) ? props.initialBarber : ""); setStartsAt(""); setError(""); }} />
      <span><strong>{item.name}</strong><span>{item.description}</span><span>{item.duration_minutes} minutes · {formatPrice(item.price_minor, props.currency)}</span></span>
    </label>)}</fieldset>}
    {step === 1 && <fieldset className="booking-options"><legend className="sr-only">Choose a barber</legend>
      <label className="booking-option"><input type="radio" name="barber" checked={!barberId} onChange={() => setBarberId("")} /><span><strong>Any available barber</strong><span>We’ll assign an available barber who offers your service.</span></span></label>
      {eligible.map((barber) => <label className="booking-option" key={barber.id}><input type="radio" name="barber" checked={barberId === barber.id} onChange={() => setBarberId(barber.id)} /><span><strong>{barber.name}</strong></span></label>)}
      {!eligible.length && <p>No barbers offer this service. Please choose another service.</p>}
    </fieldset>}
    {step === 2 && <>
      <BookingCalendar month={month} today={props.today} lastDate={props.lastDate} selected={date} availableDates={new Set(slots.map((s) => s.date))}
        loading={loading} onMonthChange={(value) => void loadMonth(value)} onSelect={(value) => { setDate(value); setStartsAt(""); setPeriod(""); }} />
      {loading && <p role="status">Finding available dates…</p>}
      {!loading && !slots.length && !error && <p>No appointments are available this month. Try the next month or another barber.</p>}
      {!loading && <button type="button" className="text-link" onClick={() => void loadMonth(month)}>Refresh availability</button>}
    </>}
    {step === 3 && <><p>{appointmentDate(`${date}T12:00:00Z`, "UTC")}</p>
      <fieldset className="booking-periods"><legend>When would you like to visit?</legend>{TIME_PERIODS.map((item) => {
        const count = times.filter((s) => timePeriod(s.startsAt, props.timezone) === item.id).length;
        return <label className={`booking-option ${count ? "" : "is-unavailable"}`} key={item.id}><input type="radio" name="period" checked={period === item.id} disabled={!count} onChange={() => { setPeriod(item.id); setStartsAt(""); setError(""); }} /><span><strong>{item.label}</strong><span>{item.description}</span><small>{count ? `${count} available times` : "No available times"}</small></span></label>;
      })}</fieldset>
      {period && <label className="booking-time-select">Appointment time<select name="time" value={startsAt} onChange={(e) => { setStartsAt(e.target.value); setError(""); }}><option value="">Choose a time</option>{periodTimes.map((slot) => <option key={slot.startsAt} value={slot.startsAt}>{appointmentTime(slot.startsAt, props.timezone)}</option>)}</select></label>}
    </>}
    {step === 4 && <form id="customer-details" className="booking-fields" onSubmit={(event) => {
      event.preventDefault();
      const valid = bookingSchema.safeParse({ service: serviceId, barber: barberId || null, startsAt, requestId: crypto.randomUUID(), ...customer });
      if (!valid.success) { setError(valid.error.issues[0].message); return; }
      setError(""); setStep(5);
    }}>
      <label>Full name *<input name="name" autoComplete="name" required maxLength={120} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></label>
      <label>Email *<input name="email" type="email" autoComplete="email" required maxLength={254} value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></label>
      <label>Phone *<input name="phone" type="tel" autoComplete="tel" required minLength={3} maxLength={40} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></label>
      <label>Notes (optional)<textarea name="notes" rows={3} maxLength={2000} value={customer.notes} onChange={(e) => setCustomer({ ...customer, notes: e.target.value })} /></label>
      <p className="fine-print">The shop will use your contact details to manage your appointment.</p>
    </form>}
    {step === 5 && service && selected && <><dl className="booking-summary"><dt>Service</dt><dd>{service.name} · {service.duration_minutes} minutes</dd><dt>Price</dt><dd>{formatPrice(service.price_minor, props.currency)}</dd><dt>Barber</dt><dd>{props.barbers.find((b) => b.id === barberId)?.name || "Any available barber · assigned when booked"}</dd><dt>When</dt><dd>{appointmentDate(startsAt, props.timezone)}<br />{appointmentTime(startsAt, props.timezone)}–{appointmentTime(selected.endsAt, props.timezone)} ({props.timezone})</dd><dt>Your details</dt><dd>{customer.name}<br />{customer.email}<br />{customer.phone}</dd>{customer.notes && <><dt>Notes</dt><dd>{customer.notes}</dd></>}</dl><p>Your appointment will be saved as pending shop confirmation.</p>
      {error && <button type="button" className="text-link" disabled={pending} onClick={() => { setStep(2); void loadMonth(month); }}>Choose another time</button>}
    </>}
    <div className="booking-actions">
      {step > 0 && <button type="button" className="text-link" disabled={busy} onClick={() => { setStep(step - 1); setError(""); }}>Back</button>}
      {step < 4 && <button type="button" className="button button-dark" disabled={busy || (step === 0 && !service) || (step === 1 && !eligible.length) || (step === 2 && !date) || (step === 3 && !startsAt)} onClick={() => { setStep(step + 1); setError(""); if (step === 1) void loadMonth(monthStart(props.today)); }}>Continue</button>}
      {step === 4 && <button type="submit" form="customer-details" className="button button-dark">Review booking</button>}
      {step === 5 && <button type="button" className="button button-dark" disabled={pending} onClick={book}>{pending ? "Saving your appointment…" : "Book appointment"}</button>}
    </div>
  </section>;
}
