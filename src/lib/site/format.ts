import type { Tables } from "@/lib/types/database";

export function formatPrice(priceMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-PH", { style: "currency", currency });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return new Intl.NumberFormat("en-PH", {
    style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: digits,
  }).format(priceMinor / 10 ** digits);
}

export function formatTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour % 12 || 12}${minute ? `:${String(minute).padStart(2, "0")}` : ""}${hour < 12 ? "am" : "pm"}`;
}

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function weeklyHours(hours: Pick<Tables<"business_hours">, "weekday" | "opens_at" | "closes_at">[]) {
  return WEEKDAYS.map((day, index) => ({
    day,
    intervals: hours.filter((row) => row.weekday === index + 1)
      .map((row) => `${formatTime(row.opens_at)}–${formatTime(row.closes_at)}`),
  }));
}

export function safeSocialLinks(value: Tables<"businesses">["social_links"]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const platforms: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" };
  return Object.entries(value).flatMap(([key, url]) => {
    if (!platforms[key] || typeof url !== "string") return [];
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && !parsed.username && !parsed.password
        ? [{ label: platforms[key], href: parsed.href }] : [];
    } catch { return []; }
  });
}
