"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main-content" className="container page-intro"><p className="eyebrow">A SMALL DETOUR</p><h1>We couldn’t load the shop.</h1><p className="intro-copy">Please try again in a moment. Your visit matters to us.</p><div className="hero-actions"><button onClick={reset} className="button button-dark">Try again <span aria-hidden="true">↻</span></button><Link href="/" className="text-link">Back to home</Link></div></main>;
}
