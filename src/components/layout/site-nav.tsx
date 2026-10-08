"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/services", label: "Services" }, { href: "/about", label: "Our story" },
  { href: "/barbers", label: "The barbers" }, { href: "/contact", label: "Visit us" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <>
    <button className="menu-toggle" aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>
      {open ? "Close" : "Menu"}
    </button>
    <nav id="primary-navigation" aria-label="Primary" className={`site-nav ${open ? "is-open" : ""}`}>
      {links.map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}
      <Link href="/book" className="button button-dark nav-book" onClick={() => setOpen(false)}>Book an appointment <span aria-hidden="true">↗</span></Link>
    </nav>
  </>;
}
