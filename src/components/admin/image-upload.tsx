import Image from "next/image";
import { AdminForm } from "@/components/admin/form";
import { Hidden, Field } from "@/components/admin/fields";
import { uploadImage } from "@/app/admin/actions";
import { businessImage } from "@/lib/site/data";

export function ImageUpload({ kind, id, businessId, path }: { kind: "service" | "barber" | "hero"; id: string; businessId: string; path: string | null }) {
  const url = businessImage(path, businessId);
  return <details className="admin-details"><summary>Upload {kind === "barber" ? "photo" : "image"}</summary>
    {url && <Image className="admin-image" src={url} alt="Current marketing image" width={200} height={150} />}
    <AdminForm action={uploadImage} submit="Upload image"><Hidden name="kind" value={kind} /><Hidden name="id" value={id} />
      <Field label="Image (JPEG, PNG, WebP or AVIF, up to 5 MiB)" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required />
      <p className="fine-print">Images are public. Upload only marketing photos you have permission to use.</p>
    </AdminForm>
  </details>;
}
