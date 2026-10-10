"use server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { appointmentSchema, serviceSchema, barberSchema, businessSchema, overrideSchema, timeOffSchema, parseWeeklyHours } from "@/lib/validation/admin";
import type { AdminFormState } from "@/lib/types/admin";

function failure(error: { code?: string } | null): AdminFormState | null {
  if (!error) return null;
  const messages: Record<string, string> = {
    "23P01": "That time is unavailable. Choose another time or barber.",
    "40001": "Someone changed this appointment. Reload the page before saving.",
    "23503": "This record is used by appointment history, or an assignment belongs to another shop. Keep historical assignments and disable used services instead.",
    "23505": "This date already has special hours. Remove the existing entry before adding a replacement.",
    "22023": "These changes are invalid. Check the schedule and status. Finished appointments cannot be reopened; future appointments cannot be completed or marked no-show.",
    "23514": "Check your values and opening/closing times.",
    "42501": "Your account cannot make this change.",
  };
  return { error: messages[error.code ?? ""] ?? "Unable to save. Please try again." };
}
function refresh() {
  revalidatePath("/admin", "layout");
  for (const path of ["/", "/services", "/barbers", "/about", "/contact", "/book"]) revalidatePath(path);
}
function input(form: FormData) { return { ...Object.fromEntries(form), is_active: form.get("is_active") === "on" }; }
function invalid(): AdminFormState { return { error: "Please check the form values and required fields." }; }

export async function saveAppointment(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const { client, business } = await requireAdmin();
  const parsed = appointmentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return invalid();
  const v = parsed.data;
  let id: string;
  try {
    // The generated RPC types omit SQL nullability; these parameters intentionally accept NULL.
    const result = await client.rpc("manage_admin_appointment", { p_business: business.id,
      p_id: v.id ?? null!, p_expected: v.expected ?? null!, p_service: v.service, p_barber: v.barber,
      p_local_start: v.localStart, p_status: v.status, p_name: v.name, p_email: v.email,
      p_phone: v.phone, p_notes: v.notes, p_request: v.request });
    const error = failure(result.error); if (error) return error;
    id = result.data!;
  } catch { return { error: "Unable to save. Please retry with the same details." }; }
  refresh();
  redirect(`/admin/appointments/${id}?saved=1`);
}
export async function saveService(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const { client, business } = await requireAdmin(true);
  const parsed = serviceSchema.safeParse(input(form)); if (!parsed.success) return invalid();
  const { id, ...values } = parsed.data;
  const result = id ? await client.from("services").update(values).eq("business_id", business.id).eq("id", id).select("id").single()
    : await client.from("services").insert({ ...values, business_id: business.id }).select("id").single();
  const error = failure(result.error); if (error) return error;
  refresh(); return { success: "Service saved." };
}
export async function deleteService(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const { client, business } = await requireAdmin(true);
  const id = z.guid().safeParse(form.get("id")); if (!id.success) return invalid();
  const result = await client.from("services").delete().eq("business_id", business.id).eq("id", id.data).select("id").single();
  const error = failure(result.error); if (error) return error;
  refresh(); return { success: "Service deleted." };
}
export async function saveBarber(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const { client, business } = await requireAdmin(true);
  const parsed = barberSchema.safeParse(input(form)); if (!parsed.success) return invalid();
  const { id, ...values } = parsed.data;
  const result = id ? await client.from("barbers").update(values).eq("business_id", business.id).eq("id", id).select("id").single()
    : await client.from("barbers").insert({ ...values, business_id: business.id }).select("id").single();
  const error = failure(result.error); if (error) return error;
  refresh(); return { success: "Barber saved. Assign services and working hours before taking bookings." };
}
export async function saveAssignments(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const { client, business } = await requireAdmin(true);
  const parsed = z.object({ barber: z.guid(), services: z.array(z.guid()).max(500) })
    .safeParse({ barber: form.get("barber"), services: form.getAll("services") });
  if (!parsed.success) return invalid();
  const result = await client.rpc("set_barber_services", { p_business: business.id, p_barber: parsed.data.barber, p_services: parsed.data.services });
  const error = failure(result.error); if (error) return error;
  refresh(); return { success: "Assigned services saved." };
}
export async function saveBusiness(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const { client, business } = await requireAdmin(true);
  const parsed = businessSchema.safeParse(input(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your shop settings." };
  const { instagram, facebook, tiktok, ...values } = parsed.data;
  const result = await client.from("businesses").update({ ...values, social_links: { instagram, facebook, tiktok } }).eq("id", business.id).select("id").single();
  const error = failure(result.error); if (error) return error;
  refresh(); return { success: "Shop details saved." };
}
export async function saveHours(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const { client, business } = await requireAdmin(true);
  let parsed: ReturnType<typeof parseWeeklyHours>;
  try { parsed = parseWeeklyHours(form); } catch (error) { return { error: error instanceof Error ? error.message : "Check your hours." }; }
  const result = await client.rpc("replace_weekly_hours", { p_business: business.id, p_barber: parsed.barber ?? null!, p_intervals: parsed.intervals });
  const error = failure(result.error); if (error) return error;
  refresh(); return { success: "Weekly hours saved." };
}
export async function saveOverride(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const { client, business } = await requireAdmin(true);
  const parsed = overrideSchema.safeParse({ ...Object.fromEntries(form), is_closed: form.get("is_closed") === "on" });
  if (!parsed.success) return invalid();
  const v = parsed.data;
  const result = await client.from("schedule_overrides").insert({ business_id: business.id, barber_id: v.barber, date: v.date,
    is_closed: v.is_closed, opens_at: v.is_closed ? null : v.opens_at, closes_at: v.is_closed ? null : v.closes_at });
  const error = failure(result.error); if (error) return error;
  refresh(); return { success: "Special date saved." };
}
export async function saveTimeOff(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const { client, business } = await requireAdmin(true);
  const parsed = timeOffSchema.safeParse(Object.fromEntries(form)); if (!parsed.success) return invalid();
  const v = parsed.data;
  const result = await client.rpc("add_admin_time_off", { p_business: business.id, p_barber: v.barber ?? null!, p_start: v.start, p_end: v.end, p_reason: v.reason });
  const error = failure(result.error); if (error) return error;
  refresh(); return { success: "Time off saved. Existing appointments remain booked; review any conflicts." };
}
export async function deleteScheduleEntry(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const { client, business } = await requireAdmin(true);
  const parsed = z.object({ id: z.guid(), table: z.enum(["time_off", "schedule_overrides"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return invalid();
  const result = await client.from(parsed.data.table).delete().eq("business_id", business.id).eq("id", parsed.data.id).select("id").single();
  const error = failure(result.error); if (error) return error;
  refresh(); return { success: "Schedule entry removed." };
}
export async function uploadImage(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const { client, business } = await requireAdmin(true);
  const parsed = z.object({ kind: z.enum(["service", "barber", "hero"]), id: z.guid() }).safeParse(Object.fromEntries(form));
  const file = form.get("image");
  if (!parsed.success || !(file instanceof File) || !file.size || file.size > 5242880) return { error: "Select an image up to 5 MiB." };
  const bytes = Buffer.from(await file.arrayBuffer());
  let format: { mime: string; extension: string } | null = null;
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) format = { mime: "image/jpeg", extension: "jpg" };
  else if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) format = { mime: "image/png", extension: "png" };
  else if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") format = { mime: "image/webp", extension: "webp" };
  else if (bytes.toString("ascii", 4, 8) === "ftyp" && ["avif", "avis"].includes(bytes.toString("ascii", 8, 12))) format = { mime: "image/avif", extension: "avif" };
  if (!format || format.mime !== file.type) return { error: "Use a JPEG, PNG, WebP or AVIF image." };
  const { kind, id } = parsed.data;
  const target = kind === "hero"
    ? await client.from("businesses").select("id").eq("id", business.id).eq("id", id).single()
    : await client.from(kind === "service" ? "services" : "barbers").select("id").eq("business_id", business.id).eq("id", id).single();
  if (target.error) return { error: "Image target unavailable." };
  const path = `${business.id}/${randomUUID()}.${format.extension}`;
  const uploaded = await client.storage.from("business-images").upload(path, bytes, { contentType: format.mime, upsert: false });
  if (uploaded.error) return { error: "Unable to upload your image. Please try again." };
  const result = kind === "hero"
    ? await client.from("businesses").update({ hero_image_path: path }).eq("id", business.id).eq("id", id).select("id").single()
    : await client.from(kind === "service" ? "services" : "barbers").update({ image_path: path }).eq("business_id", business.id).eq("id", id).select("id").single();
  if (result.error) { await client.storage.from("business-images").remove([path]); return { error: "Unable to save the image. Please retry." }; }
  refresh(); return { success: "Image uploaded." };
}
