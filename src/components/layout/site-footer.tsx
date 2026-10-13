import Link from "next/link";
import { getSiteBusiness } from "@/lib/site/data";
import { safeSocialLinks } from "@/lib/site/format";
import { getLandingContent } from "@/lib/site/content";

export async function SiteFooter() {
  const business = await getSiteBusiness().catch(() => null);
  const socials = safeSocialLinks(business?.social_links ?? {});
  const copy = getLandingContent(business?.landing_content);
  return <footer className="site-footer">
    <div className="container footer-top">
      <div><p className="eyebrow">{copy.footer_eyebrow}</p><p className="footer-title public-copy">{copy.footer_title}</p></div>
      <Link href="/book" className="button button-light">Book an appointment <span aria-hidden="true">↗</span></Link>
    </div>
    <div className="container footer-bottom">
      <Link href="/" className="footer-brand">{business?.name || "Barbershop"}</Link>
      <nav aria-label="Footer"><Link href="/services">Services</Link><Link href="/about">Our story</Link><Link href="/contact">Visit us</Link>
        {socials.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer">{social.label}</a>)}
      </nav>
      <p>{copy.footer_note}</p>
    </div>
  </footer>;
}
