import "server-only";

import { cache } from "react";
import { getPublicEnv, isPublicEnvConfigured } from "@/lib/env/public";
import { getBusinessBySlug, getServices, getBarbers, getBusinessHours,
  getBarberServices, getBarberHours, getTestimonials } from "@/lib/db/catalog";

// React cache deduplicates within a render; it does not retain tenant data across requests.
export const getSiteBusiness = cache(async () => {
  if (!isPublicEnvConfigured()) return null;
  return getBusinessBySlug(getPublicEnv().NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG);
});

export const getSiteCatalog = cache(async () => {
  const business = await getSiteBusiness();
  if (!business) return null;
  const [services, barbers, hours, assignments, barberHours, testimonials] = await Promise.all([
    getServices(business.id), getBarbers(business.id), getBusinessHours(business.id),
    getBarberServices(business.id), getBarberHours(business.id), getTestimonials(business.id),
  ]);
  return { business, services, barbers, hours, assignments, barberHours, testimonials };
});

export type SiteCatalog = NonNullable<Awaited<ReturnType<typeof getSiteCatalog>>>;

// Images are bucket-relative paths, scoped to the configured business. No arbitrary remote URLs.
export function businessImage(path: string | null, businessId: string) {
  if (!path || !path.startsWith(`${businessId}/`) || path.split("/").some((part) => part === ".." || part === ".")) return null;
  const base = getPublicEnv().NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/business-images/${path.split("/").map(encodeURIComponent).join("/")}`;
}
