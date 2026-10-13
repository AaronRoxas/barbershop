import { getAdminCatalog } from "@/lib/db/admin";
import { AdminForm } from "@/components/admin/form";
import { Field, Hidden, TextField } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { saveService, deleteService } from "@/app/admin/actions";
import { formatPrice } from "@/lib/site/format";
import type { Tables } from "@/lib/types/database";
import { currencyScale } from "@/lib/money";
import { PriceField } from "@/components/admin/price-field";

function ServiceFields({ service: s, currency }: { service?: Tables<"services">; currency: string }) {
  return <><Hidden name="id" value={s?.id ?? ""} />
    <div className="admin-grid"><Field label="Service name" name="name" required maxLength={120} defaultValue={s?.name} />
      <PriceField currency={currency} priceMinor={s?.price_minor} />
      <Field label="Duration (minutes)" name="duration_minutes" type="number" min={5} max={480} step={1} required defaultValue={s?.duration_minutes ?? 30} />
      <Field label="Display order" name="sort_order" type="number" min={-10000} max={10000} step={1} required defaultValue={s?.sort_order ?? 0} /></div>
    <TextField label="Description" name="description" value={s?.description} />
    {s && s.price_minor % currencyScale(currency) !== 0 && <p className="fine-print">The current price includes a fractional amount. Enter a whole-number price before saving; the existing price stays unchanged until you save.</p>}
    <label className="admin-checkbox"><input type="checkbox" name="is_active" defaultChecked={s?.is_active ?? true} />Available for booking</label>
  </>;
}
export default async function ServicesPage() {
  const { business, services } = await getAdminCatalog(true);
  return <section className="admin-section"><h1>Services</h1><p>Set your menu, prices, duration, and display order. Existing bookings keep their original values.</p>
    <p className="fine-print">Enter whole-number prices in {business.currency}, for example 500 for {formatPrice(500 * currencyScale(business.currency), business.currency)}. Prices cannot be negative. Lower display orders appear first.</p>
    <details className="admin-details"><summary>Add a service</summary><AdminForm action={saveService} submit="Create service"><ServiceFields currency={business.currency} /></AdminForm></details>
    {!services.length && <p className="empty-state">No services yet. Add your first service above.</p>}
    {services.map((s) => <article key={s.id} className="admin-record"><div className="admin-title"><h2>{s.name}</h2><span className="admin-status">{s.is_active ? "Active" : "Disabled"}</span></div>
      <p>{formatPrice(s.price_minor, business.currency)} · {s.duration_minutes} minutes</p>
      <details className="admin-details"><summary>Edit service</summary><AdminForm action={saveService}><ServiceFields service={s} currency={business.currency} /></AdminForm></details>
      <ImageUpload kind="service" id={s.id} businessId={business.id} path={s.image_path} name={s.name} />
      <details className="admin-details"><summary>Delete unused service</summary><p className="fine-print">This removes the service and its assignments. Services used by appointments must be disabled instead.</p>
        <AdminForm action={deleteService} submit="Delete service" destructive><Hidden name="id" value={s.id} /></AdminForm></details>
    </article>)}
  </section>;
}
