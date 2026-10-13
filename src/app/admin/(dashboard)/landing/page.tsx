import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminForm } from "@/components/admin/form";
import { TextField } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { saveLandingContent } from "@/app/admin/actions";
import { getLandingContent, landingFields, landingKeys } from "@/lib/site/content";

export default async function LandingPageEditor() {
  const { business } = await requireAdmin(true);
  const content = getLandingContent(business.landing_content, business.philosophy);
  const groups = [...new Set(landingKeys.map((key) => landingFields[key].group))];
  return <section className="admin-section"><h1>Landing page</h1>
    <p>Customize the welcome message, section headings, values, and public footer. Saved changes appear immediately on your website.</p>
    <p><Link href="/" className="text-link" target="_blank" rel="noopener noreferrer">View website ↗</Link> · <Link href="/admin/settings" className="text-link">Edit shop contact details and story</Link></p>
    <AdminForm action={saveLandingContent} submit="Save landing page">
      {groups.map((group) => <fieldset key={group}><legend>{group}</legend><div className="admin-grid">
        {landingKeys.filter((key) => landingFields[key].group === group).map((key) =>
          <TextField key={key} label={landingFields[key].label} name={key} value={content[key]} />)}
      </div></fieldset>)}
    </AdminForm>
    <ImageUpload kind="hero" id={business.id} businessId={business.id} path={business.hero_image_path} name={business.name} />
  </section>;
}
