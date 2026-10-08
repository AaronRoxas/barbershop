import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminHomePage() {
  return (
    <PlaceholderPage
      title="Admin dashboard"
      description="Authentication and appointment management will be implemented in Phase 5. This route is not protected yet."
    />
  );
}
