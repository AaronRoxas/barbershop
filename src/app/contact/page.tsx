import { getSiteCatalog } from "@/lib/site/data";
import { publicMetadata } from "@/lib/site/metadata";
import { PageIntro, Unavailable } from "@/components/public/ui";
import { Visit } from "@/components/public/visit";

export async function generateMetadata() { return publicMetadata("Visit us", "Find the shop, get in touch, and view our opening hours.", "/contact"); }

export default async function ContactPage() {
  const catalog = await getSiteCatalog();
  if (!catalog) return <Unavailable />;
  return <main id="main-content"><PageIntro eyebrow="COME ON IN" title="Your chair is waiting." description="Find us, get in touch, or make a little room in your week for a fresh cut." />
    <section className="container page-section"><h2 className="sr-only">Location, contact details, and opening hours</h2><Visit catalog={catalog} showMap /></section>
  </main>;
}
