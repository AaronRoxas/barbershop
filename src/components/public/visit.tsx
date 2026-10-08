import type { SiteCatalog } from "@/lib/site/data";
import { safeSocialLinks, weeklyHours } from "@/lib/site/format";
import { Arrow } from "./ui";

export function Visit({ catalog, showMap = false }: { catalog: SiteCatalog; showMap?: boolean }) {
  const { business, hours } = catalog;
  const maps = business.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name} ${business.address}`)}` : null;
  const socials = safeSocialLinks(business.social_links);
  return <div className="visit-grid">
    <div><p className="eyebrow">FIND YOUR WAY HERE</p><h3>A place to<br />look forward to.</h3><address>{business.address || "Our address will be shared soon."}</address>
      {maps && <a className="text-link" href={maps} target="_blank" rel="noopener noreferrer">Get directions <Arrow /></a>}
      <div className="contact-links">{business.phone && <a href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}>{business.phone}</a>}{business.email && <a href={`mailto:${business.email}`}>{business.email}</a>}
        {!business.phone && !business.email && <p>Contact details coming soon.</p>}</div>
      {socials.length > 0 && <nav aria-label="Social media" className="social-links">{socials.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer">{social.label} <Arrow /></a>)}</nav>}
      {showMap && maps && <div className="map-panel"><span aria-hidden="true">⌖</span><p>{business.address}</p><a href={maps} target="_blank" rel="noopener noreferrer" className="button button-dark">Open in Google Maps <Arrow /></a></div>}
    </div>
    <div><p className="eyebrow">MAKE A LITTLE TIME</p><h3>Opening hours.</h3>
      {hours.length ? <dl className="hours-list">{weeklyHours(hours).map(({ day, intervals }) => <div key={day}><dt>{day}</dt><dd>{intervals.length ? intervals.map((interval) => <span key={interval}>{interval}</span>) : "Closed"}</dd></div>)}</dl> : <p className="empty-state">Opening hours are being updated.</p>}
      <p className="fine-print">All times are in {business.timezone.replaceAll("_", " ")}. Holiday hours may vary.</p>
    </div>
  </div>;
}
