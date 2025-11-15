import PageShell from "@/components/layout/PageShell";
import Link from "next/link";
import GarmentRunway from "@/components/garments/GarmentRunway";
import { getAllGarments } from "@/lib/garments";

export default function HomePage() {
  const garments = getAllGarments().slice(0, 8); // show a few featured

  return (
    <PageShell
      title="UVA Fashion Archive"
      subtitle="An editorial glimpse into the University of Virginia's historic garments. Walk the closet, explore the runway, and uncover stories stitched into fabric."
    >
      {/* Hero */}
      <section className="mb-12 md:mb-16">
        <div className="grid md:grid-cols-[2fr,1fr] gap-8 items-center">
          <div className="space-y-4">
            <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
              This site is a living, growing archive of garments from UVA&apos;s Historic
              Clothing Collection. It is not just a database—it&apos;s meant to feel like
              stepping backstage at a runway show or pulling open the doors of a very old,
              very full wardrobe.
            </p>
            <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.25em]">
              <Link
                href="/garments"
                className="border border-zinc-500 px-4 py-2 hover:bg-zinc-100 hover:text-zinc-950 transition"
              >
                Enter the Closet
              </Link>
              <Link
                href="/stories"
                className="border border-zinc-500/60 px-4 py-2 hover:border-zinc-100 transition"
              >
                View Stories
              </Link>
            </div>
          </div>
          <div className="border border-zinc-700 aspect-[3/4] bg-zinc-900 flex items-center justify-center text-xs text-zinc-500">
            {/* Placeholder image area until you add real ones */}
            Garment imagery coming soon
          </div>
        </div>
      </section>

      {/* Runway strip */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400">
            Featured from the closet
          </h2>
          <Link href="/garments" className="text-xs underline text-zinc-300">
            Browse all
          </Link>
        </div>
        <GarmentRunway garments={garments} />
      </section>
    </PageShell>
  );
}
