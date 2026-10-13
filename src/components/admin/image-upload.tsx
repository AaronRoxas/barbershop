import Image from "next/image";
import { AdminForm } from "@/components/admin/form";
import { Hidden, Field } from "@/components/admin/fields";
import { uploadImage } from "@/app/admin/actions";
import { businessImage } from "@/lib/site/data";

export function ImageUpload({ kind, id, businessId, path, name }: { kind: "service" | "barber" | "hero"; id: string; businessId: string; path: string | null; name: string }) {
  const url = businessImage(path, businessId);
  const placement = {
    hero: { title: "Shop hero image", description: `Appears as the large welcome image on the landing page and the main shop photo on the Our story page for ${name}.`, alt: `Current shop hero image for ${name}` },
    service: { title: "Service menu image", description: `Appears beside ${name} on the Services page and in the landing-page service menu when this service is featured.`, alt: `Current service menu image for ${name}` },
    barber: { title: "Barber profile photo", description: `Appears on ${name}’s profile card in the landing-page team section and on the Barbers page.`, alt: `Current profile photo for ${name}` },
  }[kind];
  return <details className="admin-details"><summary>{url ? "Replace" : "Upload"} {placement.title.toLowerCase()}</summary>
    <p className="fine-print">{placement.description} Saving an upload replaces the image in these locations.</p>
    {url && <Image className="admin-image" src={url} alt={placement.alt} width={200} height={150} />}
    <AdminForm action={uploadImage} submit={url ? `Replace ${placement.title.toLowerCase()}` : `Upload ${placement.title.toLowerCase()}`}><Hidden name="kind" value={kind} /><Hidden name="id" value={id} />
      <Field label={`${placement.title} (JPEG, PNG, WebP or AVIF, up to 5 MiB)`} name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required />
      <p className="fine-print">Images are public. Upload only marketing photos you have permission to use.</p>
    </AdminForm>
  </details>;
}
