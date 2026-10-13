import { getAdminCatalog } from "@/lib/db/admin";
import { AdminForm } from "@/components/admin/form";
import { Field, Hidden, TextField } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { saveBarber, saveAssignments, deleteBarber } from "@/app/admin/actions";
import type { Tables } from "@/lib/types/database";

function BarberFields({ barber: b }: { barber?: Tables<"barbers"> }) {
  return <><Hidden name="id" value={b?.id ?? ""} />
    <div className="admin-grid"><Field label="Barber name" name="name" required maxLength={120} defaultValue={b?.name} />
      <Field label="Specialty" name="specialty" maxLength={500} defaultValue={b?.specialty} /></div>
    <TextField label="Biography" name="biography" value={b?.biography} />
    <label className="admin-checkbox"><input type="checkbox" name="is_active" defaultChecked={b?.is_active ?? true} />Available for booking</label>
  </>;
}
export default async function BarbersPage() {
  const { business, barbers, services, assignments } = await getAdminCatalog(true);
  return <section className="admin-section"><h1>Barbers</h1><p>Manage the team, assign services, and add working hours under Availability.</p>
    <details className="admin-details"><summary>Add a barber</summary><AdminForm action={saveBarber} submit="Create barber"><BarberFields /></AdminForm></details>
    {!barbers.length && <p className="empty-state">No barbers yet. Add your first barber above.</p>}
    {barbers.map((b) => <article key={b.id} className="admin-record"><div className="admin-title"><h2>{b.name}</h2><span className="admin-status">{b.is_active ? "Active" : "Disabled"}</span></div>
      <details className="admin-details"><summary>Edit profile</summary><AdminForm action={saveBarber}><BarberFields barber={b} /></AdminForm></details>
      <details className="admin-details"><summary>Assign services</summary><AdminForm action={saveAssignments}><Hidden name="barber" value={b.id} />
        <fieldset><legend>Services performed by {b.name}</legend>{services.map((s) => <label key={s.id} className="admin-checkbox"><input type="checkbox" name="services" value={s.id}
          defaultChecked={assignments.some((a) => a.barber_id === b.id && a.service_id === s.id)} />{s.name}{s.is_active ? "" : " (disabled)"}</label>)}</fieldset>
        <p className="fine-print">Keep assignments used by appointment history. Disable the service to stop new bookings.</p>
      </AdminForm></details><ImageUpload kind="barber" id={b.id} businessId={business.id} path={b.image_path} name={b.name} />
      <details className="admin-details"><summary>Delete barber</summary>
        <AdminForm action={deleteBarber} submit="Delete barber permanently" destructive>
          <Hidden name="id" value={b.id} />
          <p>This removes the profile, assigned services, and barber schedules. Barbers with appointment history must be disabled instead. Uploaded photos remain in Storage.</p>
          <label className="admin-checkbox"><input type="checkbox" name="confirm" required />Permanently delete {b.name}</label>
        </AdminForm>
      </details>
    </article>)}
  </section>;
}
