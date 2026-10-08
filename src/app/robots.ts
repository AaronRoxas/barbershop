import type { MetadataRoute } from "next";
import { getSiteBusiness } from "@/lib/site/data";
import { siteOrigin } from "@/lib/site/metadata";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const business = await getSiteBusiness().catch(() => null);
  const origin = siteOrigin();
  if (!business || business.slug === "reference" || !origin) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/book"] }, sitemap: `${origin}/sitemap.xml` };
}
