import Link from "next/link";
import Image from "next/image";
import type { SiteCatalog } from "@/lib/site/data";
import { businessImage } from "@/lib/site/data";
import { weeklyHours } from "@/lib/site/format";
import { Arrow, EmptyState } from "./ui";

export function BarberList({ catalog, detailed = false }: { catalog: SiteCatalog; detailed?: boolean }) {
  if (!catalog.barbers.length) return <EmptyState>Meet the team here soon. Barber profiles are being updated.</EmptyState>;
  return <div className="barber-grid">{catalog.barbers.map((barber) => {
    const image = businessImage(barber.image_path, catalog.business.id);
    const serviceIds = catalog.assignments.filter((row) => row.barber_id === barber.id).map((row) => row.service_id);
    const services = catalog.services.filter((service) => serviceIds.includes(service.id));
    const hours = weeklyHours(catalog.barberHours.filter((row) => row.barber_id === barber.id));
    return <article className="barber-profile" key={barber.id}>
      <div className="barber-image">{image ? <Image src={image} alt={barber.name} fill sizes="(max-width: 760px) 100vw, 50vw" className="object-cover" />
        : <><span className="barber-initial" aria-hidden="true">{barber.name.charAt(0)}</span><span className="portrait-note">PORTRAIT COMING SOON</span></>}</div>
      <div className="barber-heading"><div><h3>{barber.name}</h3><p>{barber.specialty || "Barber"}</p></div><Link href={`/book?barber=${barber.id}`} className="round-link" aria-label={`Book with ${barber.name}`}><Arrow /></Link></div>
      {detailed && <div className="barber-info">{barber.biography && <p>{barber.biography}</p>}
        <p><strong>In the chair</strong><br />{services.length ? services.map((service) => service.name).join(" · ") : "Service details coming soon"}</p>
        <details><summary>Usual working hours</summary><dl className="hours-list">{hours.map(({ day, intervals }) => <div key={day}><dt>{day}</dt><dd>{intervals.join(" / ") || "Off"}</dd></div>)}</dl><p className="fine-print">Hours are in {catalog.business.timezone.replaceAll("_", " ")}. Appointment availability may vary.</p></details>
      </div>}
    </article>;
  })}</div>;
}
