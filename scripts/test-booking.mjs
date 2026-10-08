import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const result = spawnSync(process.execPath, ["node_modules/supabase/dist/supabase.js", "status", "--output", "json"], { encoding: "utf8" });
assert.equal(result.status, 0, "Start local Supabase first.");
const status = JSON.parse(result.stdout);
assert.ok(["127.0.0.1", "localhost"].includes(new URL(status.API_URL).hostname));
const options = { auth: { persistSession: false }, realtime: { transport: WebSocket } };
const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, options);
const guest = createClient(status.API_URL, status.ANON_KEY, options);
const business = randomUUID(), service = randomUUID(), barber = randomUUID(), second = randomUUID();
const verify = (r) => { assert.equal(r.error?.code, undefined, r.error?.message); return r.data; };
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const weekday = new Date(`${tomorrow}T12:00Z`).getUTCDay() || 7;
const slots = async (date = tomorrow, staff = barber) => verify(await admin.rpc("booking_slots", { p_business: business, p_service: service, p_barber: staff, p_date: date }));
const booking = (start, staff = barber, request = randomUUID()) => ({ p_business: business, p_service: service, p_barber: staff,
  p_starts_at: start, p_request: request, p_name: "Booking Test", p_email: "booking@example.com", p_phone: "+123456789", p_notes: "" });

try {
  verify(await admin.from("businesses").insert({ id: business, slug: `booking-${business}`, name: "Booking fixture", timezone: "Asia/Manila", is_active: true, minimum_notice_minutes: 0, maximum_booking_days: 30 }));
  verify(await admin.from("services").insert({ id: service, business_id: business, name: "Cut", duration_minutes: 30, price_minor: 12345 }));
  verify(await admin.from("barbers").insert([barber, second].map((id) => ({ id, business_id: business, name: id }))));
  verify(await admin.from("barber_services").insert([barber, second].map((id) => ({ business_id: business, service_id: service, barber_id: id }))));
  verify(await admin.from("business_hours").insert([{ business_id: business, weekday, opens_at: "09:00", closes_at: "12:00" }, { business_id: business, weekday, opens_at: "13:00", closes_at: "15:00" }]));
  verify(await admin.from("barber_hours").insert([barber, second].map((id) => ({ business_id: business, barber_id: id, weekday, opens_at: "10:00", closes_at: "14:00" }))));
  const initial = await slots();
  assert.equal(initial.length, 10, "Intersects shop/staff hours and respects breaks, duration and interval.");
  assert.equal(initial[0].starts_at, `${tomorrow}T02:00:00+00:00`, "Shop timezone is converted to UTC.");
  assert.equal((await slots("2000-01-01")).length, 0, "Past dates are unavailable.");
  assert.equal((await slots("2100-01-01")).length, 0, "Dates outside the window are unavailable.");
  const availabilityArgs = { p_business: business, p_service: service, p_barber: null, p_date: tomorrow };
  assert.equal((await guest.rpc("booking_availability", availabilityArgs)).error?.code, "42501");
  assert.equal((await guest.rpc("create_guest_booking", booking(initial[0].starts_at))).error?.code, "42501");
  const publicSlots = verify(await admin.rpc("booking_availability", availabilityArgs));
  assert.equal(publicSlots.length, 20);
  assert.deepEqual(Object.keys(publicSlots[0]).sort(), ["barberId", "date", "endsAt", "startsAt"], "Availability contains no customer data.");
  const retries = booking(initial[0].starts_at);
  const retried = await Promise.all([admin.rpc("create_guest_booking", retries), admin.rpc("create_guest_booking", retries)]);
  assert.equal(verify(retried[0]), verify(retried[1]), "Concurrent retries create one appointment.");
  assert.equal((await admin.rpc("create_guest_booking", { ...retries, p_name: "Changed" })).error?.code, "22023");
  const races = await Promise.all([admin.rpc("create_guest_booking", booking(initial[2].starts_at)), admin.rpc("create_guest_booking", booking(initial[2].starts_at))]);
  assert.equal(races.filter((r) => !r.error).length, 1);
  assert.equal(races.find((r) => r.error).error.code, "23P01", "Exactly one competing booking succeeds.");
  verify(await admin.rpc("create_guest_booking", booking(initial[0].starts_at, null)));
  assert.equal((await admin.rpc("create_guest_booking", booking(initial[0].starts_at, null))).error?.code, "23P01", "Any-barber fills a concrete second chair.");
  const saved = verify(await admin.from("appointments").select("*").eq("business_id", business));
  assert.equal(saved.length, 3);
  assert.ok(saved.every((a) => a.price_minor === 12345 && a.service_name === "Cut" && a.duration_minutes === 30 && a.currency === "PHP"));
  assert.equal((await admin.rpc("create_guest_booking", booking(`${tomorrow}T02:07:00Z`))).error?.code, "23P01", "Off-grid bookings are rejected.");
  assert.equal((await admin.rpc("create_guest_booking", { ...booking(initial[5].starts_at), p_email: "invalid" })).error?.code, "22023");
  assert.equal((await admin.rpc("create_guest_booking", { ...booking(initial[5].starts_at), p_service: randomUUID() })).error?.code, "22023", "Unknown or foreign services are rejected.");
  verify(await admin.from("appointments").update({ status: "cancelled" }).eq("business_id", business));
  assert.equal((await slots()).length, 10, "Cancellation releases chairs.");
  verify(await admin.from("time_off").insert({ business_id: business, barber_id: barber, starts_at: initial[0].starts_at, ends_at: initial[0].ends_at, reason: "Private reason" }));
  assert.equal((await slots()).length, 8, "Time off blocks all overlapping slots, permitting boundary adjacency.");
  verify(await admin.from("time_off").insert({ business_id: business, starts_at: initial[7].starts_at, ends_at: initial[7].ends_at, reason: "Shop break" }));
  assert.equal((await slots(tomorrow, second)).length, 8, "Shop-wide time off blocks all barbers.");
  verify(await admin.from("time_off").delete().eq("business_id", business).is("barber_id", null));
  verify(await admin.from("schedule_overrides").insert({ business_id: business, barber_id: barber, date: tomorrow, is_closed: true }));
  assert.equal((await slots()).length, 0, "Barber day off replaces weekly hours.");
  assert.equal((await slots(tomorrow, second)).length, 10);
  verify(await admin.from("schedule_overrides").insert({ business_id: business, date: tomorrow, is_closed: true }));
  assert.equal((await slots(tomorrow, null)).length, 0, "Shop closure blocks every barber.");
  verify(await admin.from("schedule_overrides").update({ is_closed: false, opens_at: "13:00", closes_at: "13:45" }).eq("business_id", business).is("barber_id", null));
  assert.equal((await slots(tomorrow, second)).length, 2, "Special hours replace usual hours.");
  verify(await admin.from("barbers").update({ is_active: false }).eq("id", second));
  assert.equal((await slots(tomorrow, null)).length, 0, "Inactive barbers are unavailable.");
  verify(await admin.from("barbers").update({ is_active: true }).eq("id", second));
  verify(await admin.from("businesses").update({ minimum_notice_minutes: 4320 }).eq("id", business));
  assert.equal((await slots(tomorrow, null)).length, 0, "Minimum notice is enforced.");
  verify(await admin.from("businesses").update({ is_active: false }).eq("id", business));
  assert.equal((await slots(tomorrow, null)).length, 0, "Inactive shops cannot accept bookings.");
  // Both upcoming US transitions fit in the rolling 365-day window.
  verify(await admin.from("businesses").update({ is_active: true, timezone: "America/New_York", minimum_notice_minutes: 0, maximum_booking_days: 365, slot_interval_minutes: 30 }).eq("id", business));
  function nextTransition(month, sundayNumber) {
    let year = new Date().getUTCFullYear();
    const day = (y) => { const first = new Date(Date.UTC(y, month, 1)); return 1 + (7 - first.getUTCDay()) % 7 + (sundayNumber - 1) * 7; };
    if (new Date(Date.UTC(year, month, day(year), 12)) <= new Date()) year++;
    return new Date(Date.UTC(year, month, day(year), 12)).toISOString().slice(0, 10);
  }
  const spring = nextTransition(2, 2), fall = nextTransition(10, 1);
  for (const date of [spring, fall]) {
    verify(await admin.from("schedule_overrides").insert([null, second].map((id) => ({ business_id: business, barber_id: id, date, opens_at: "01:00", closes_at: "04:00" }))));
  }
  const springSlots = await slots(spring, second);
  assert.equal(springSlots.length, 4, "Nonexistent spring-forward civil times are excluded.");
  assert.ok(springSlots.every((s) => Date.parse(s.ends_at) - Date.parse(s.starts_at) === 1800000));
  const fallSlots = await slots(fall, second);
  assert.equal(fallSlots.length, 6, "Fall-back ambiguous times are emitted once using standard time.");
  assert.equal(fallSlots[0].starts_at, `${fall}T06:00:00+00:00`);
  console.log("Booking schedules, timezone/DST, privacy, validation, retries, snapshots and concurrency passed.");
} finally {
  verify(await admin.from("appointments").delete().eq("business_id", business));
  verify(await admin.from("businesses").delete().eq("id", business));
}
