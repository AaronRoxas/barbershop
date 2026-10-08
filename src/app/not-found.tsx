import Link from "next/link";
import { PageIntro, Arrow } from "@/components/public/ui";

export default function NotFound() {
  return <main id="main-content"><PageIntro eyebrow="404 / WRONG TURN" title="A little off the beaten path." description="We couldn’t find that page. Let’s get you back to familiar ground." /><div className="container page-section"><Link href="/" className="button button-dark">Back to home <Arrow /></Link></div></main>;
}
