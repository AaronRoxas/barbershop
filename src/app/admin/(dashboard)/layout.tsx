import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { signOut } from "@/app/admin/auth-actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { business, role } = await requireAdmin();
  return <main id="main-content" className="container admin-shell">
    <div className="admin-heading"><div><p className="eyebrow">Shop management · {role}</p><p className="admin-shop">{business.name}</p></div>
      <form action={signOut}><button className="text-link">Sign out</button></form></div>
    <nav className="admin-nav" aria-label="Administration">
      <Link href="/admin">Overview</Link><Link href="/admin/appointments">Appointments</Link>
      {role === "owner" && <><Link href="/admin/services">Services</Link><Link href="/admin/barbers">Barbers</Link>
        <Link href="/admin/schedule">Availability</Link><Link href="/admin/settings">Shop details</Link></>}
    </nav>{children}
  </main>;
}
