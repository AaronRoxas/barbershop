import { AdminForm } from "@/components/admin/form";
import { Field } from "@/components/admin/fields";
import { signIn, signOut } from "@/app/admin/auth-actions";
import { isPublicEnvConfigured } from "@/lib/env/public";

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const params = await searchParams;
  return <main id="main-content" className="container admin-login">
    <p className="eyebrow">For owners & staff</p><h1>Welcome back.</h1>
    <p>Sign in with the account provided by your shop owner.</p>
    {params.link === "invalid" && <p className="booking-error" role="alert">This invitation or recovery link has expired or is invalid. Ask your owner for a new link.</p>}
    {params.access === "denied" && <><p role="alert" className="booking-error">This account has no access to this shop. Contact the owner.</p>
      <form action={signOut}><button className="text-link">Sign out of this account</button></form></>}
    {isPublicEnvConfigured() ? <AdminForm action={signIn} submit="Sign in">
      <Field label="Email" name="email" type="email" autoComplete="username" required maxLength={254} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required maxLength={200} />
    </AdminForm> : <p className="empty-state">Shop administration is awaiting configuration.</p>}
  </main>;
}
