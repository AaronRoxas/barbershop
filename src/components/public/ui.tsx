import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Tables } from "@/lib/types/database";
import { businessImage } from "@/lib/site/data";

export function Arrow() { return <span aria-hidden="true">↗</span>; }

export function PageIntro({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <section className="container page-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="intro-copy">{description}</p>{children}</section>;
}

export function Unavailable() {
  return <main id="main-content"><PageIntro eyebrow="COME BACK SOON" title="A fresh start is on its way." description="We’re getting the shop ready. Our services and shop information will be available here soon." /><div className="container empty-state"><Link href="/" className="text-link">Back to home <Arrow /></Link></div></main>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty-state">{children}</p>;
}

export function ShopImage({ business, className = "", preload = false }: { business: Tables<"businesses">; className?: string; preload?: boolean }) {
  const source = businessImage(business.hero_image_path, business.id);
  const reference = business.slug === "reference";
  return <figure className={`shop-image ${className}`}>
    {source || reference ? <Image src={source || "/images/reference-shop.webp"} alt={source ? `Inside ${business.name}` : "Sample interior with a leather barber chair, oak cabinets, and warm natural light"} fill sizes="(max-width: 760px) 100vw, 60vw" preload={preload} className="object-cover" />
      : <div className="image-monogram" aria-label={`${business.name} shop photography coming soon`}>{business.name.charAt(0)}<span>YOUR NEIGHBORHOOD BARBERSHOP</span></div>}
    {!source && reference && <figcaption>Reference shop · sample visual</figcaption>}
  </figure>;
}
