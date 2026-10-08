import { getSiteCatalog } from "@/lib/site/data";
import { publicMetadata } from "@/lib/site/metadata";
import { PageIntro, Unavailable } from "@/components/public/ui";
import { ServiceList } from "@/components/public/service-list";

export async function generateMetadata() { return publicMetadata("Services", "Explore our services, prices, and haircut durations.", "/services"); }

export default async function ServicesPage() {
  const catalog = await getSiteCatalog();
  if (!catalog) return <Unavailable />;
  return <main id="main-content"><PageIntro eyebrow="THE SERVICE MENU" title="A cut above the everyday." description="A tidy-up, a fresh look, or your usual done right. Find a little something for you." />
    <section className="container page-section" aria-label="Service menu"><h2 className="sr-only">Our services</h2><ServiceList catalog={catalog} /><p className="fine-print">Prices are in {catalog.business.currency}. The time shown is the service duration.</p></section>
    <section className="container service-note"><span aria-hidden="true">✳</span><div><h2>Not sure what to go for?</h2><p>Talk it through with your barber. A good cut starts with a good conversation.</p></div></section>
  </main>;
}
