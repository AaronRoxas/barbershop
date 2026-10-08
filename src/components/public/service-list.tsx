import Link from "next/link";
import Image from "next/image";
import type { SiteCatalog } from "@/lib/site/data";
import { businessImage } from "@/lib/site/data";
import { formatPrice } from "@/lib/site/format";
import { Arrow, EmptyState } from "./ui";

export function ServiceList({ catalog, limit }: { catalog: SiteCatalog; limit?: number }) {
  const services = limit ? catalog.services.slice(0, limit) : catalog.services;
  if (!services.length) return <EmptyState>Our service menu is being updated. Please check back soon.</EmptyState>;
  return <div className="service-list">{services.map((service, index) => {
    const image = businessImage(service.image_path, catalog.business.id);
    return <article className="service-row" key={service.id}>
      <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
      {image && <div className="service-image"><Image src={image} alt={service.name} fill sizes="96px" className="object-cover" /></div>}
      <div className="service-details"><h3>{service.name}</h3>{service.description && <p>{service.description}</p>}<span className="service-duration">{service.duration_minutes} minutes</span></div>
      <p className="service-price">{formatPrice(service.price_minor, catalog.business.currency)}</p>
      <Link href={`/book?service=${service.id}`} className="service-book" aria-label={`Book ${service.name}`}>Book <Arrow /></Link>
    </article>;
  })}</div>;
}
