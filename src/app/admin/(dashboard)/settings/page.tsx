import { requireAdmin } from "@/lib/auth/admin";
import { AdminForm } from "@/components/admin/form";
import { Field, TextField } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { saveBusiness } from "@/app/admin/actions";

export default async function SettingsPage() {
  const { business: b } = await requireAdmin(true);
  const links = b.social_links && typeof b.social_links === "object" && !Array.isArray(b.social_links) ? b.social_links : {};
  return <section className="admin-section"><h1>Shop details</h1><p>Keep your public information and booking settings up to date.</p>
    <AdminForm action={saveBusiness}>
      <div className="admin-grid"><Field label="Shop name" name="name" defaultValue={b.name} required maxLength={120} />
        <Field label="Public phone" name="phone" defaultValue={b.phone} maxLength={40} />
        <Field label="Public email" name="email" type="email" defaultValue={b.email} maxLength={254} /></div>
      <TextField label="Description" name="description" value={b.description} />
      <TextField label="Address" name="address" value={b.address} maxLength={1000} />
      <TextField label="Our story" name="story" value={b.story} maxLength={10000} />
      <TextField label="Philosophy" name="philosophy" value={b.philosophy} />
      <fieldset><legend>Booking settings</legend><p className="fine-print">Changing timezone reinterprets weekly hours and special dates. Existing appointment instants remain fixed. Changing currency affects new bookings; update service prices to match.</p>
        <div className="admin-grid"><Field label="Timezone (IANA name)" name="timezone" defaultValue={b.timezone} required maxLength={100} />
          <Field label="Currency (ISO code)" name="currency" defaultValue={b.currency} required pattern="[A-Z]{3}" maxLength={3} />
          <Field label="Slot interval (minutes)" name="slot_interval_minutes" type="number" min={5} max={120} step={1} required defaultValue={b.slot_interval_minutes} />
          <Field label="Minimum notice (minutes)" name="minimum_notice_minutes" type="number" min={0} max={525600} step={1} required defaultValue={b.minimum_notice_minutes} />
          <Field label="Maximum booking window (days)" name="maximum_booking_days" type="number" min={1} max={365} step={1} required defaultValue={b.maximum_booking_days} /></div>
      </fieldset>
      <fieldset><legend>Social links</legend><div className="admin-grid">{["instagram", "facebook", "tiktok"].map((name) => <Field key={name} label={name.charAt(0).toUpperCase() + name.slice(1)} name={name} type="url" maxLength={500} defaultValue={typeof links[name] === "string" ? links[name] as string : ""} />)}</div></fieldset>
      <label className="admin-checkbox"><input name="is_active" type="checkbox" defaultChecked={b.is_active} />Shop is public and accepting bookings</label>
    </AdminForm><ImageUpload kind="hero" id={b.id} businessId={b.id} path={b.hero_image_path} />
  </section>;
}
