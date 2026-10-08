import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Admin login",
};

export default function AdminLoginPage() {
  return (
    <PlaceholderPage
      title="Admin login"
      description="Supabase Auth for owners and staff will be implemented in Phase 5."
    />
  );
}
