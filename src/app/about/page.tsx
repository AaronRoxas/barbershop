import Image from "next/image";
import Link from "next/link";
import { businessImage, getSiteCatalog } from "@/lib/site/data";
import { publicMetadata } from "@/lib/site/metadata";
import { Arrow, PageIntro, ShopImage, Unavailable } from "@/components/public/ui";

export async function generateMetadata() { return publicMetadata("Our story", "Get to know our barbershop, our philosophy, and the care behind every cut.", "/about"); }

export default async function AboutPage() {
  const catalog = await getSiteCatalog();
  if (!catalog) return <Unavailable />;
  const { business } = catalog;
  const gallery = business.gallery_image_paths.flatMap((path) => { const image = businessImage(path, business.id); return image ? [image] : []; });
  return <main id="main-content"><PageIntro eyebrow="OUR STORY" title="A familiar kind of feeling." description="The easy conversation. The comfortable chair. The feeling of walking out a little lighter." />
    <div className="container about-photo"><ShopImage business={business} /></div>
    <section className="container story-grid section-space"><div><p className="eyebrow">WELCOME TO {business.name.toUpperCase()}</p><h2>More than<br />a place for a cut.</h2></div><div><p className="story-lead">{business.story || business.description || "Our story will be shared here soon."}</p><p>{business.philosophy || "We believe a good haircut starts with listening, and ends with you feeling comfortable in your own style."}</p><Link href="/barbers" className="text-link">Meet your barber <Arrow /></Link></div></section>
    <section className="story-section"><div className="container"><p className="eyebrow">WHAT WE CARE ABOUT</p><h2>The little things<br />make the difference.</h2><div className="values-grid"><div><span>01 / LISTEN FIRST</span><h3>Your cut. Your call.</h3><p>Bring an idea or ask for a little guidance. We start with a conversation.</p></div><div><span>02 / TAKE CARE</span><h3>Never just a number.</h3><p>We make room for the details that help a haircut feel like yours.</p></div><div><span>03 / KEEP IT SIMPLE</span><h3>Everyone’s welcome.</h3><p>A relaxed place to settle in, refresh your look, and feel at home.</p></div></div></div></section>
    {gallery.length > 0 && <section className="container section-space"><div className="section-heading"><div><p className="eyebrow">A LOOK AROUND</p><h2>Inside the shop.</h2></div></div><div className="gallery-grid">{gallery.map((source, index) => <div className="gallery-image" key={`${source}-${index}`}><Image src={source} alt={`${business.name}, shop detail ${index + 1}`} fill sizes="(max-width: 760px) 100vw, 50vw" className="object-cover" /></div>)}</div></section>}
  </main>;
}
