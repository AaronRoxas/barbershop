import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Services",
};

export default function ServicesPage() {
  return (
    <PlaceholderPage
      title="Services"
      description="Service name, price, duration, and booking will be loaded from the database in Phase 3."
    />
  );
}
