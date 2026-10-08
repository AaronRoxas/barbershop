import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Barbers",
};

export default function BarbersPage() {
  return (
    <PlaceholderPage
      title="Barbers"
      description="Barber profiles will be added with the public website in Phase 3."
    />
  );
}
