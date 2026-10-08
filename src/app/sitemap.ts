import type { MetadataRoute } from "next";
import { getSiteBusiness } from "@/lib/site/data";
import { siteOrigin } from "@/lib/site/metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const business = await getSiteBusiness().catch(() => null);
  const origin = siteOrigin();
  if (!business || business.slug === "reference" || !origin) return [];
  return ["/", "/services", "/about", "/barbers", "/contact"].map((path) => ({ url: `${origin}${path}` }));
}
