import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getSiteBusiness } from "@/lib/site/data";
import { siteOrigin } from "@/lib/site/metadata";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

export async function generateMetadata(): Promise<Metadata> {
  const business = await getSiteBusiness().catch(() => null);
  const name = business?.name || "Barbershop";
  const description = business?.description || "Thoughtful cuts, good company, and a little time for you.";
  const origin = siteOrigin();
  return {
    title: { default: name, template: `%s | ${name}` }, description,
    metadataBase: origin ? new URL(origin) : undefined,
    alternates: origin ? { canonical: origin } : undefined,
    openGraph: { type: "website", title: name, description, siteName: name,
      ...(origin ? { url: origin } : {}),
      ...(business?.slug === "reference" && origin ? { images: [{ url: `${origin}/images/reference-shop.webp`, width: 1536, height: 1024 }] } : {}),
    },
    robots: !business || business.slug === "reference" ? { index: false, follow: true } : undefined,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
