type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <main id="main-content" className="container page-intro">
      <p className="text-sm uppercase tracking-[0.2em] text-stone-400">Coming soon</p>
      <h1>{title}</h1>
      <p className="intro-copy">{description}</p>
    </main>
  );
}
