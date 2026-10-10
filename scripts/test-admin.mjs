import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const result = spawnSync(process.execPath, ["node_modules/supabase/dist/supabase.js", "status", "--output", "json"], { encoding: "utf8" });
assert.equal(result.status, 0, "Start local Supabase first.");
const status = JSON.parse(result.stdout);
assert.ok(["127.0.0.1", "localhost"].includes(new URL(status.API_URL).hostname));
const options = { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: WebSocket } };
const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, options);
const guest = createClient(status.API_URL, status.ANON_KEY, options);
const check = (r) => { assert.equal(r.error?.code, undefined, r.error?.message); return r.data; };
const business = randomUUID(), foreign = randomUUID(), service = randomUUID(), barber = randomUUID();
const users = [];
const date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const weekday = new Date(`${date}T12:00Z`).getUTCDay() || 7;
async function account(role) {
  const email = `admin-test-${randomUUID()}@example.com`, password = `Admin!${randomUUID()}`;
  const { user } = check(await admin.auth.admin.createUser({ email, password, email_confirm: true }));
  users.push(user.id);
  if (role) check(await admin.from("business_members").insert({ business_id: business, user_id: user.id, role }));
  const client = createClient(status.API_URL, status.ANON_KEY, options);
  check(await client.auth.signInWithPassword({ email, password }));
  return client;
}
const args = (time = "09:00") => ({ p_business: business, p_id: null, p_expected: null, p_service: service,
  p_barber: barber, p_local_start: `${date}T${time}:00`, p_status: "confirmed", p_name: "Admin customer",
  p_email: "admin-customer@example.com", p_phone: "+639123456789", p_notes: "Private", p_request: randomUUID() });
async function appointment(id) { return check(await admin.from("appointments").select("*").eq("id", id).single()); }
try {
  check(await admin.from("businesses").insert([{ id: business, slug: `admin-${business}`, name: "Admin fixture", timezone: "Asia/Manila", is_active: true, minimum_notice_minutes: 0 },
    { id: foreign, slug: `admin-${foreign}`, name: "Foreign fixture", timezone: "Asia/Manila", is_active: true, minimum_notice_minutes: 0 }]));
  check(await admin.from("services").insert({ id: service, business_id: business, name: "Original cut", price_minor: 25000, duration_minutes: 30 }));
  check(await admin.from("barbers").insert({ id: barber, business_id: business, name: "Test barber" }));
  check(await admin.from("barber_services").insert({ business_id: business, barber_id: barber, service_id: service }));
  const owner = await account("owner"), staff = await account("staff"), outsider = await account(null);
  const hours = { p_business: business, p_barber: null, p_intervals: [{ weekday, opens_at: "09:00", closes_at: "12:00" }] };
  check(await owner.rpc("replace_weekly_hours", hours));
  check(await owner.rpc("replace_weekly_hours", { ...hours, p_barber: barber }));
  assert.equal((await staff.rpc("replace_weekly_hours", hours)).error?.code, "42501");
  assert.equal((await owner.rpc("replace_weekly_hours", { ...hours, p_business: foreign })).error?.code, "42501");
  assert.equal((await owner.rpc("replace_weekly_hours", { ...hours, p_intervals: [...hours.p_intervals, { weekday, opens_at: "10:00", closes_at: "11:00" }] })).error?.code, "22023");
  assert.equal(check(await admin.from("business_hours").select("id").eq("business_id", business)).length, 1, "Rejected replacement preserves original hours.");
  assert.equal((await guest.rpc("manage_admin_appointment", args())).error?.code, "42501");
  assert.equal((await outsider.rpc("manage_admin_appointment", args())).error?.code, "42501");
  assert.equal((await staff.rpc("manage_admin_appointment", { ...args(), p_business: foreign })).error?.code, "42501");
  const initial = args();
  const id = check(await staff.rpc("manage_admin_appointment", initial));
  assert.equal(check(await staff.rpc("manage_admin_appointment", initial)), id, "Create retries are idempotent.");
  let a = await appointment(id);
  assert.equal(a.starts_at, `${date}T01:00:00+00:00`, "Admin local date is converted by shop timezone.");
  assert.equal((await staff.from("appointments").update({ status: "cancelled" }).eq("id", id)).error?.code, "42501", "Direct writes cannot bypass validation.");
  assert.equal(check(await outsider.from("appointments").select("*").eq("business_id", business)).length, 0);
  assert.equal((await staff.rpc("manage_admin_appointment", { ...initial, p_id: id, p_expected: a.updated_at, p_status: "completed" })).error?.code, "22023", "Future booking cannot be completed.");
  check(await owner.from("services").update({ price_minor: 30000, duration_minutes: 60, name: "Changed cut" }).eq("id", service));
  const move = { ...initial, p_id: id, p_expected: a.updated_at, p_local_start: `${date}T09:15:00` };
  check(await staff.rpc("manage_admin_appointment", move));
  a = await appointment(id);
  assert.equal(a.duration_minutes, 30); assert.equal(a.price_minor, 25000); assert.equal(a.service_name, "Original cut");
  assert.equal((await staff.rpc("manage_admin_appointment", { ...move, p_notes: "Stale edit" })).error?.code, "40001");
  const second = check(await staff.rpc("manage_admin_appointment", args("10:00")));
  assert.equal((await staff.rpc("manage_admin_appointment", { ...move, p_expected: a.updated_at, p_local_start: `${date}T10:00:00` })).error?.code, "23P01");
  assert.equal((await staff.rpc("manage_admin_appointment", { ...move, p_expected: a.updated_at, p_local_start: `${date}T09:07:00` })).error?.code, "23P01");
  assert.equal((await staff.rpc("set_barber_services", { p_business: business, p_barber: barber, p_services: [] })).error?.code, "42501");
  assert.equal((await owner.rpc("set_barber_services", { p_business: business, p_barber: barber, p_services: [] })).error?.code, "23503", "Historical assignments cannot be removed.");
  check(await owner.rpc("add_admin_time_off", { p_business: business, p_barber: barber, p_start: `${date}T11:00`, p_end: `${date}T12:00`, p_reason: "Private break" }));
  assert.equal((await staff.rpc("manage_admin_appointment", args("11:00"))).error?.code, "23P01");
  const query = { p_business: business, p_from: date, p_to: date, p_status: null, p_barber: null, p_page: 0 };
  assert.equal(check(await staff.rpc("list_admin_appointments", query)).length, 2);
  assert.equal((await outsider.rpc("list_admin_appointments", query)).error?.code, "42501");
  assert.equal((await guest.rpc("admin_appointment_counts", { p_business: business })).error?.code, "42501");
  check(await staff.rpc("manage_admin_appointment", { ...move, p_expected: a.updated_at, p_status: "cancelled" }));
  a = await appointment(id);
  assert.equal((await staff.rpc("manage_admin_appointment", { ...move, p_expected: a.updated_at, p_status: "confirmed" })).error?.code, "22023", "Cancelled bookings cannot be reopened.");
  check(await staff.rpc("manage_admin_appointment", { ...move, p_expected: a.updated_at, p_status: "cancelled", p_name: "Corrected customer" }));
  const counts = check(await staff.rpc("admin_appointment_counts", { p_business: business }));
  assert.equal(counts.cancelled, 1); assert.equal(counts.upcoming, 1);
  assert.equal(check(await staff.rpc("list_admin_appointments", { ...query, p_upcoming: true })).length, 1, "Upcoming view excludes cancelled appointments.");
  const b = await appointment(second);
  const edit = { ...args("10:00"), p_id: second, p_expected: b.updated_at };
  const races = await Promise.all([staff.rpc("manage_admin_appointment", { ...edit, p_notes: "First edit" }), owner.rpc("manage_admin_appointment", { ...edit, p_notes: "Second edit" })]);
  assert.equal(races.filter((r) => !r.error).length, 1);
  assert.equal(races.find((r) => r.error).error.code, "40001", "Concurrent edits reject one stale update.");
  // Past appointments can move to completed/no-show without recomputing past availability.
  for (const terminal of ["completed", "no_show"]) {
    const past = check(await admin.from("appointments").insert({ business_id: business, service_id: service, barber_id: barber,
      starts_at: "2000-01-01T01:00:00Z", ends_at: "2000-01-01T01:30:00Z", status: "confirmed", customer_name: "Past", customer_email: "past@example.com", customer_phone: "123456",
      service_name: "Old cut", price_minor: 100, duration_minutes: 30, currency: "PHP" }).select("*").single());
    check(await staff.rpc("manage_admin_appointment", { ...initial, p_id: past.id, p_expected: past.updated_at, p_local_start: "2000-01-01T09:00:00", p_status: terminal }));
  }
  console.log("Admin roles, tenant boundaries, atomic hours, rescheduling, snapshots, statuses, idempotency and concurrent edits passed.");
} finally {
  check(await admin.from("appointments").delete().eq("business_id", business));
  check(await admin.from("businesses").delete().in("id", [business, foreign]));
  for (const id of users) check(await admin.auth.admin.deleteUser(id));
}
