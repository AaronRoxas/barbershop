import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Book an appointment",
};

export default function BookPage() {
  return (
    <PlaceholderPage
      title="Book an appointment"
      description="The booking wizard (service, barber, date, time, details, review) will be implemented in Phase 4."
    />
  );
}
