import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Shop management", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-site-shell">
    <header className="admin-site-header"><nav className="container" aria-label="Admin site">
      <Link href="/admin" className="admin-brand">Shop management</Link><Link href="/" className="text-link">View website ↗</Link>
    </nav></header>
    {children}
    <footer className="admin-site-footer"><div className="container"><p>Shop administration</p><Link href="/" className="text-link">Return to website</Link></div></footer>
  </div>;
}
