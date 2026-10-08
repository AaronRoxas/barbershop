import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <PlaceholderPage
      title="Contact"
      description="Address, hours, and map details will be added with the public website in Phase 3."
    />
  );
}
