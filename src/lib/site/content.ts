import { z } from "zod";
import type { Json } from "@/lib/types/database";

// Shared by the public renderer and owner editor so existing shops keep their copy.
export const landingFields = {
  hero_eyebrow: { label: "Hero tagline", value: "YOUR NEIGHBORHOOD BARBERSHOP", group: "Welcome" },
  hero_title: { label: "Hero heading", value: "A good cut.\nA better day.", group: "Welcome" },
  hero_description: { label: "Hero introduction", value: "Come as you are. Leave feeling like yourself.\nThoughtful cuts, a comfortable chair, and a little time for you.", group: "Welcome" },
  hero_note: { label: "Welcome note", value: "A little care goes a long way.", group: "Welcome" },
  hero_note_emphasis: { label: "Welcome note emphasis", value: "Make yourself at home.", group: "Welcome" },
  strip_one: { label: "Banner phrase 1", value: "GOOD CUTS", group: "Welcome" },
  strip_two: { label: "Banner phrase 2", value: "GOOD COMPANY", group: "Welcome" },
  strip_three: { label: "Banner phrase 3", value: "YOUR KIND OF PLACE", group: "Welcome" },
  services_eyebrow: { label: "Services tagline", value: "THE SERVICE MENU", group: "Sections" },
  services_title: { label: "Services heading", value: "Keep it fresh.", group: "Sections" },
  story_eyebrow: { label: "Story tagline", value: "MORE THAN A HAIRCUT", group: "Sections" },
  story_title: { label: "Story heading", value: "Good hair.\nNo airs.", group: "Sections" },
  story_lead: { label: "Story introduction", value: "A small pause in a busy day. A conversation, a careful cut, and the confidence to get on with it.", group: "Sections" },
  story_body: { label: "Story body", value: "We believe the best haircut starts with listening. Tell us what you have in mind, settle in, and let’s find a style that feels right for you.", group: "Sections" },
  barbers_eyebrow: { label: "Barbers tagline", value: "THE PEOPLE BEHIND THE CUT", group: "Sections" },
  barbers_title: { label: "Barbers heading", value: "You’re in good hands.", group: "Sections" },
  reviews_eyebrow: { label: "Reviews tagline", value: "FROM THE CHAIR", group: "Sections" },
  reviews_title: { label: "Reviews heading", value: "Good words.\nFrom good people.", group: "Sections" },
  reviews_empty: { label: "Message when there are no reviews", value: "Our story is just getting started. Customer reviews will be shared here when available.", group: "Sections" },
  value_one_title: { label: "Value 1 heading", value: "Time for you.", group: "Our values" },
  value_one_body: { label: "Value 1 description", value: "A comfortable chair and room to take a breath.", group: "Our values" },
  value_two_title: { label: "Value 2 heading", value: "Care in the details.", group: "Our values" },
  value_two_body: { label: "Value 2 description", value: "A considered approach, from consultation to finish.", group: "Our values" },
  value_three_title: { label: "Value 3 heading", value: "Your style, always.", group: "Our values" },
  value_three_body: { label: "Value 3 description", value: "Classic or contemporary. A cut that feels like you.", group: "Our values" },
  footer_eyebrow: { label: "Footer tagline", value: "YOUR NEXT GOOD HAIR DAY", group: "Public footer" },
  footer_title: { label: "Footer heading", value: "See you in the chair.", group: "Public footer" },
  footer_note: { label: "Footer note", value: "Made for a little self-care.", group: "Public footer" },
} as const;

export type LandingKey = keyof typeof landingFields;
export const landingKeys = Object.keys(landingFields) as LandingKey[];
export const landingContentSchema = z.object(Object.fromEntries(landingKeys.map((key) =>
  [key, z.string().trim().min(1, `${landingFields[key].label} is required.`).max(2000)])) as Record<LandingKey, z.ZodString>);

export function getLandingContent(value: Json | undefined, philosophy = ""): Record<LandingKey, string> {
  const stored = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(landingKeys.map((key) => [key,
    typeof stored[key] === "string" && stored[key].trim() ? stored[key] :
      key === "story_body" && philosophy ? philosophy : landingFields[key].value,
  ])) as Record<LandingKey, string>;
}
