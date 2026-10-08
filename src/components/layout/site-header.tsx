import Link from "next/link";
import { getSiteBusiness } from "@/lib/site/data";
import { SiteNav } from "./site-nav";

export async function SiteHeader() {
  const business = await getSiteBusiness().catch(() => null);
  return <header className="site-header">
    <div className="container header-inner">
      <Link href="/" className="brand" aria-label={`${business?.name || "Barbershop"} home`}>
        <span className="brand-mark" aria-hidden="true">r<span>.</span></span>
        <span>{business?.name || "Barbershop"}<small>GOOD CUTS. GOOD COMPANY.</small></span>
      </Link>
      <SiteNav />
    </div>
  </header>;
}
