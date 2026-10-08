import Link from "next/link";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/barbers", label: "Barbers" },
  { href: "/contact", label: "Contact" },
  { href: "/book", label: "Book" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-stone-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-serif text-lg tracking-wide text-stone-100">
          Barbershop
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm text-stone-300">
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-stone-50">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
