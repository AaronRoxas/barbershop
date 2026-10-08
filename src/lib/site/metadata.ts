import "server-only";
import type { Metadata } from "next";
import { getSiteBusiness } from "./data";

export function siteOrigin() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || "");
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.origin : null;
  } catch { return null; }
}

export async function publicMetadata(title: string, description: string, path: string): Promise<Metadata> {
  const business = await getSiteBusiness().catch(() => null);
  const name = business?.name || "Barbershop";
  const origin = siteOrigin();
  return {
    title, description,
    alternates: origin ? { canonical: `${origin}${path}` } : undefined,
    openGraph: { type: "website", title: `${title} | ${name}`, description, siteName: name,
      ...(origin ? { url: `${origin}${path}` } : {}),
      ...(business?.slug === "reference" && origin ? { images: [{ url: `${origin}/images/reference-shop.webp`, width: 1536, height: 1024, alt: "Reference barbershop sample interior" }] } : {}),
    },
    robots: !business || business.slug === "reference" ? { index: false, follow: true } : undefined,
  };
}
