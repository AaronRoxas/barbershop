import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Booking confirmation",
};

export default async function BookingConfirmationPage({
  params,
}: PageProps<"/book/confirmed/[code]">) {
  const { code } = await params;

  return (
    <PlaceholderPage
      title="Booking confirmation"
      description={`Confirmation pages will show reference ${code.toUpperCase()} after Phase 4 booking is live.`}
    />
  );
}
