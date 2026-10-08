import { getSiteCatalog } from "@/lib/site/data";
import { publicMetadata } from "@/lib/site/metadata";
import { PageIntro, Unavailable } from "@/components/public/ui";
import { BarberList } from "@/components/public/barber-list";

export async function generateMetadata() { return publicMetadata("The barbers", "Meet the barbers, explore their services, and see usual working hours.", "/barbers"); }

export default async function BarbersPage() {
  const catalog = await getSiteCatalog();
  if (!catalog) return <Unavailable />;
  return <main id="main-content"><PageIntro eyebrow="THE PEOPLE BEHIND THE CUT" title="Good people. Great cuts." description={catalog.barbers.length === 1 ? "Meet your barber. A familiar face and a considered approach to your next cut." : "Different styles. The same care. Get to know the people who’ll make you feel at home."} />
    <section className="container page-section"><h2 className="sr-only">Our team</h2><BarberList catalog={catalog} detailed /></section>
  </main>;
}
