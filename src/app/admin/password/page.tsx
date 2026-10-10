import { requireAdmin } from "@/lib/auth/admin";
import { AdminForm } from "@/components/admin/form";
import { Field } from "@/components/admin/fields";
import { setPassword } from "@/app/admin/auth-actions";

export default async function PasswordPage() {
  await requireAdmin();
  return <main id="main-content" className="container admin-login"><p className="eyebrow">Shop account</p><h1>Set your password.</h1>
    <p>Choose at least 12 characters for your account.</p>
    <AdminForm action={setPassword} submit="Set password">
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={200} required />
      <Field label="Confirm password" name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={200} required />
    </AdminForm>
  </main>;
}
