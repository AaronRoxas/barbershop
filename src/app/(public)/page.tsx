import Link from "next/link";
import { getSiteCatalog } from "@/lib/site/data";
import { ServiceList } from "@/components/public/service-list";
import { BarberList } from "@/components/public/barber-list";
import { Visit } from "@/components/public/visit";
import { Arrow, ShopImage, Unavailable } from "@/components/public/ui";
import { getLandingContent, landingFields } from "@/lib/site/content";

export default async function HomePage() {
  const catalog = await getSiteCatalog();
  if (!catalog) return <Unavailable />;
  const { business, testimonials } = catalog;
  const copy = getLandingContent(business.landing_content, business.philosophy);
  return <main id="main-content">
    <section className="container hero">
      <div className="hero-copy"><p className="eyebrow"><span className="small-line" /> {copy.hero_eyebrow}</p>
        <h1 className="public-copy">{copy.hero_title === landingFields.hero_title.value ? <>A good cut.<br />A better <em>day.</em></> : copy.hero_title}</h1>
        <p className="public-copy">{copy.hero_description}</p>
        <div className="hero-actions"><Link href="/book" className="button button-dark">Book an appointment <Arrow /></Link><Link href="/services" className="text-link">Explore services <Arrow /></Link></div>
        <div className="hero-footnote"><span className="sun-symbol" aria-hidden="true">✳</span><span>{copy.hero_note}<br /><strong>{copy.hero_note_emphasis}</strong></span></div>
      </div>
      <div className="hero-visual"><ShopImage business={business} preload /><div className="hero-stamp" aria-hidden="true"><span>LOOK GOOD</span><b>r.</b><span>FEEL GOOD</span></div></div>
    </section>
    <div className="values-strip"><div className="container"><span>{copy.strip_one}</span><span aria-hidden="true">✳</span><span>{copy.strip_two}</span><span aria-hidden="true">✳</span><span>{copy.strip_three}</span></div></div>
    <section className="container section-space" aria-labelledby="services-heading">
      <div className="section-heading"><div><p className="eyebrow">{copy.services_eyebrow}</p><h2 id="services-heading" className="public-copy">{copy.services_title}</h2></div><Link href="/services" className="text-link">All services <Arrow /></Link></div>
      <ServiceList catalog={catalog} limit={3} />
    </section>
    <section className="story-section"><div className="container story-grid"><div><p className="eyebrow">{copy.story_eyebrow}</p><h2 className="public-copy">{copy.story_title}</h2></div><div><p className="story-lead public-copy">{copy.story_lead}</p><p className="public-copy">{copy.story_body}</p><Link href="/about" className="text-link">Get to know us <Arrow /></Link></div></div>
      <div className="container values-grid"><div><span>01 /</span><h3>{copy.value_one_title}</h3><p className="public-copy">{copy.value_one_body}</p></div><div><span>02 /</span><h3>{copy.value_two_title}</h3><p className="public-copy">{copy.value_two_body}</p></div><div><span>03 /</span><h3>{copy.value_three_title}</h3><p className="public-copy">{copy.value_three_body}</p></div></div>
    </section>
    <section className="container section-space" aria-labelledby="barbers-heading"><div className="section-heading"><div><p className="eyebrow">{copy.barbers_eyebrow}</p><h2 id="barbers-heading" className="public-copy">{copy.barbers_title}</h2></div><Link href="/barbers" className="text-link">Meet the barbers <Arrow /></Link></div><BarberList catalog={catalog} /></section>
    <section className="reviews-section"><div className="container"><p className="eyebrow">{copy.reviews_eyebrow}</p><h2 className="public-copy">{copy.reviews_title}</h2>
      {testimonials.length ? <div className="review-grid">{testimonials.map((review) => <figure key={review.id}><blockquote>“{review.quote}”</blockquote><figcaption>— {review.customer_display_name}</figcaption></figure>)}</div>
        : <p className="review-empty public-copy">{copy.reviews_empty}</p>}
    </div></section>
    <section className="container section-space" aria-label="Location and business hours"><Visit catalog={catalog} /></section>
  </main>;
}
