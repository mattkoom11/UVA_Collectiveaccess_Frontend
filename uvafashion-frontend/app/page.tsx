import PageShell from "@/components/layout/PageShell";
import Link from "next/link";
import Runway3D from "@/components/garments/Runway3D";
import { getAllGarments } from "@/lib/garments";

export default function HomePage() {
  const garments = getAllGarments();

  return (
    <PageShell
      title="UVA Fashion Archive"
      subtitle="An editorial glimpse into the University of Virginia's historic garments. Walk the closet, explore the runway, and uncover stories stitched into fabric."
    >
      {/* 3D Runway Hero */}
      <section className="mb-12 md:mb-16 -mx-4 md:-mx-0">
        <Runway3D garments={garments} />
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Step onto the runway. Watch as history comes to life through our collection&apos;s finest pieces, 
            each garment telling its own story through fabric, form, and time.
          </p>
          <Link
            href="/garments"
            className="inline-block text-xs uppercase tracking-[0.25em] text-zinc-300 border border-zinc-600 px-6 py-3 hover:bg-zinc-100 hover:text-zinc-950 hover:border-zinc-100 transition mt-4"
          >
            Explore the Closet
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
