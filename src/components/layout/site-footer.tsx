import Link from "next/link";
import { getSiteBusiness } from "@/lib/site/data";
import { safeSocialLinks } from "@/lib/site/format";

export async function SiteFooter() {
  const business = await getSiteBusiness().catch(() => null);
  const socials = safeSocialLinks(business?.social_links ?? {});
  return <footer className="site-footer">
    <div className="container footer-top">
      <div><p className="eyebrow">YOUR NEXT GOOD HAIR DAY</p><p className="footer-title">See you in the chair.</p></div>
      <Link href="/book" className="button button-light">Book an appointment <span aria-hidden="true">↗</span></Link>
    </div>
    <div className="container footer-bottom">
      <Link href="/" className="footer-brand">{business?.name || "Barbershop"}</Link>
      <nav aria-label="Footer"><Link href="/services">Services</Link><Link href="/about">Our story</Link><Link href="/contact">Visit us</Link>
        {socials.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer">{social.label}</a>)}
      </nav>
      <p>Made for a little self-care.</p>
    </div>
  </footer>;
}
