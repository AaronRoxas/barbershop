import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

// Always target the CLI's local database, never a project from .env.local.
const cli = fileURLToPath(new URL("../node_modules/supabase/dist/supabase.js", import.meta.url));
const result = spawnSync(process.execPath, [cli, "status", "--output", "json"], { encoding: "utf8" });
assert.equal(result.status, 0, "Start local Supabase before running integration tests.");
const status = JSON.parse(result.stdout);
assert.ok(["127.0.0.1", "localhost"].includes(new URL(status.API_URL).hostname), "Tests require a local API.");
const options = { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: WebSocket } };
const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, options);
const guest = createClient(status.API_URL, status.ANON_KEY, options);
const businessId = randomUUID();
const barberId = randomUUID();
const serviceId = randomUUID();

function verify(response) {
  // Do not print response headers, request URLs, or credentials on failure.
  assert.equal(response.error?.code, undefined, response.error?.message);
  return response.data;
}

try {
  verify(await admin.from("businesses").insert({ id: businessId, slug: `test-${businessId}`, name: "Integration fixture", is_active: true }));
  verify(await admin.from("services").insert({ id: serviceId, business_id: businessId, name: "Test Cut", price_minor: 10000, duration_minutes: 30 }));
  verify(await admin.from("barbers").insert({ id: barberId, business_id: businessId, name: "Test Barber" }));
  verify(await admin.from("barber_services").insert({ business_id: businessId, barber_id: barberId, service_id: serviceId }));

  const catalog = verify(await guest.from("services").select("id").eq("business_id", businessId));
  assert.equal(catalog.length, 1, "Public catalog reads work through the REST API.");
  const privateRead = await guest.from("appointments").select("customer_email");
  assert.equal(privateRead.error?.code, "42501", "Guest requests cannot read customer data.");

  const appointment = {
    business_id: businessId, barber_id: barberId, service_id: serviceId,
    starts_at: "2030-01-01T09:00:00Z", ends_at: "2030-01-01T09:30:00Z",
    customer_name: "Test", customer_email: "test@example.com", customer_phone: "09123456789",
    service_name: "Test Cut", price_minor: 10000, duration_minutes: 30, currency: "PHP",
  };
  const guestWrite = await guest.from("appointments").insert(appointment);
  assert.equal(guestWrite.error?.code, "42501", "Guest requests cannot bypass server booking validation.");

  const races = await Promise.all([
    admin.from("appointments").insert(appointment).select("id"),
    admin.from("appointments").insert(appointment).select("id"),
  ]);
  assert.equal(races.filter((response) => !response.error).length, 1, "Exactly one concurrent booking succeeds.");
  assert.equal(races.find((response) => response.error)?.error.code, "23P01", "The losing booking reports an exclusion conflict.");

  verify(await admin.from("appointments").update({ status: "cancelled" }).eq("business_id", businessId));
  verify(await admin.from("appointments").insert(appointment));
  assert.equal(verify(await admin.from("appointments").select("id").eq("business_id", businessId)).length, 2,
    "Cancellation preserves history and permits rebooking.");

  console.log("REST catalog, guest access denial, concurrent booking conflict, and cancellation checks passed.");
} finally {
  // Only delete this run's generated fixtures; never touch other local records.
  verify(await admin.from("appointments").delete().eq("business_id", businessId));
  verify(await admin.from("businesses").delete().eq("id", businessId));
}
