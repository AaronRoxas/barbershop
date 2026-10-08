import Link from "next/link";
import { getSiteCatalog } from "@/lib/site/data";
import { ServiceList } from "@/components/public/service-list";
import { BarberList } from "@/components/public/barber-list";
import { Visit } from "@/components/public/visit";
import { Arrow, ShopImage, Unavailable } from "@/components/public/ui";

export default async function HomePage() {
  const catalog = await getSiteCatalog();
  if (!catalog) return <Unavailable />;
  const { business, testimonials } = catalog;
  return <main id="main-content">
    <section className="container hero">
      <div className="hero-copy"><p className="eyebrow"><span className="small-line" /> YOUR NEIGHBORHOOD BARBERSHOP</p>
        <h1>A good cut.<br />A better <em>day.</em></h1>
        <p>Come as you are. Leave feeling like yourself.<br className="desktop-break" /> Thoughtful cuts, a comfortable chair, and a little time for you.</p>
        <div className="hero-actions"><Link href="/book" className="button button-dark">Book an appointment <Arrow /></Link><Link href="/services" className="text-link">Explore services <Arrow /></Link></div>
        <div className="hero-footnote"><span className="sun-symbol" aria-hidden="true">✳</span><span>A little care goes a long way.<br /><strong>Make yourself at home.</strong></span></div>
      </div>
      <div className="hero-visual"><ShopImage business={business} preload /><div className="hero-stamp" aria-hidden="true"><span>LOOK GOOD</span><b>r.</b><span>FEEL GOOD</span></div></div>
    </section>
    <div className="values-strip"><div className="container"><span>GOOD CUTS</span><span aria-hidden="true">✳</span><span>GOOD COMPANY</span><span aria-hidden="true">✳</span><span>YOUR KIND OF PLACE</span></div></div>
    <section className="container section-space" aria-labelledby="services-heading">
      <div className="section-heading"><div><p className="eyebrow">THE SERVICE MENU</p><h2 id="services-heading">Keep it fresh.</h2></div><Link href="/services" className="text-link">All services <Arrow /></Link></div>
      <ServiceList catalog={catalog} limit={3} />
    </section>
    <section className="story-section"><div className="container story-grid"><div><p className="eyebrow">MORE THAN A HAIRCUT</p><h2>Good hair.<br />No airs.</h2></div><div><p className="story-lead">A small pause in a busy day. A conversation, a careful cut, and the confidence to get on with it.</p><p>{business.philosophy || "We believe the best haircut starts with listening. Tell us what you have in mind, settle in, and let’s find a style that feels right for you."}</p><Link href="/about" className="text-link">Get to know us <Arrow /></Link></div></div>
      <div className="container values-grid"><div><span>01 /</span><h3>Time for you.</h3><p>A comfortable chair and room to take a breath.</p></div><div><span>02 /</span><h3>Care in the details.</h3><p>A considered approach, from consultation to finish.</p></div><div><span>03 /</span><h3>Your style, always.</h3><p>Classic or contemporary. A cut that feels like you.</p></div></div>
    </section>
    <section className="container section-space" aria-labelledby="barbers-heading"><div className="section-heading"><div><p className="eyebrow">THE PEOPLE BEHIND THE CUT</p><h2 id="barbers-heading">You’re in good hands.</h2></div><Link href="/barbers" className="text-link">Meet the barbers <Arrow /></Link></div><BarberList catalog={catalog} /></section>
    <section className="reviews-section"><div className="container"><p className="eyebrow">FROM THE CHAIR</p><h2>Good words.<br />From good people.</h2>
      {testimonials.length ? <div className="review-grid">{testimonials.map((review) => <figure key={review.id}><blockquote>“{review.quote}”</blockquote><figcaption>— {review.customer_display_name}</figcaption></figure>)}</div>
        : <p className="review-empty">Our story is just getting started. Customer reviews will be shared here when available.</p>}
    </div></section>
    <section className="container section-space" aria-label="Location and business hours"><Visit catalog={catalog} /></section>
  </main>;
}
