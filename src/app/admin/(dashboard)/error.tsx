"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return <div className="admin-section"><h1>Unable to load your shop.</h1><p>Please try again.</p><button className="button button-dark" onClick={reset}>Retry</button></div>;
}
