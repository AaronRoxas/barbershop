type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <main className="mx-auto flex max-w-5xl flex-1 flex-col justify-center px-4 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-stone-400">Coming soon</p>
      <h1 className="mt-3 font-serif text-4xl text-stone-50 sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-stone-300">{description}</p>
    </main>
  );
}
