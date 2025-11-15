import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-sm tracking-[0.25em] uppercase">
          UVA Fashion
        </Link>
        <nav className="flex gap-6 text-xs md:text-sm uppercase tracking-[0.2em]">
          <Link href="/garments">Closet</Link>
          <Link href="/stories">Stories</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </header>
  );
}
