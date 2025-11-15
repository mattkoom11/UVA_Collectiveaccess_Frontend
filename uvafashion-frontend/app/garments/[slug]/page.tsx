import { notFound } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { getAllGarments, getGarmentBySlug } from "@/lib/garments";
import { Garment } from "@/types/garment";
import Link from "next/link";

export async function generateStaticParams() {
  const garments = getAllGarments();
  return garments.map((g) => ({ slug: g.slug }));
}

interface Props {
  params: { slug: string };
}

export default function GarmentDetailPage({ params }: Props) {
  const garment = getGarmentBySlug(params.slug);

  if (!garment) {
    notFound();
  }

  return (
    <PageShell
      title={garment!.label}
      subtitle={`${garment!.work_type || "Garment"} · ${garment!.decade || garment!.date || ""}`}
    >
      <div className="grid md:grid-cols-[2fr,1.5fr] gap-8">
        {/* Image area */}
        <div className="space-y-4">
          <div className="border border-zinc-700 bg-zinc-900 aspect-[3/4] flex items-center justify-center text-xs text-zinc-500">
            Primary image
          </div>
          <div className="grid grid-cols-3 gap-2">
            {garment!.images.slice(1).map((src, i) => (
              <div
                key={i}
                className="border border-zinc-700 bg-zinc-900 aspect-[3/4] flex items-center justify-center text-[0.6rem] text-zinc-500"
              >
                Alt {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Text + metadata */}
        <div className="space-y-6">
          <section className="space-y-3">
            <p className="text-sm md:text-base text-zinc-200 leading-relaxed">
              {garment!.description || "No description yet."}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400">
              Details
            </h2>
            <dl className="grid grid-cols-[minmax(0,120px),1fr] gap-y-2 text-sm">
              {garment!.date && (
                <>
                  <dt className="text-zinc-400">Date</dt>
                  <dd>{garment!.date}</dd>
                </>
              )}
              {garment!.decade && (
                <>
                  <dt className="text-zinc-400">Decade</dt>
                  <dd>{garment!.decade}</dd>
                </>
              )}
              {garment!.work_type && (
                <>
                  <dt className="text-zinc-400">Work type</dt>
                  <dd>{garment!.work_type}</dd>
                </>
              )}
              {garment!.colors && garment!.colors.length > 0 && (
                <>
                  <dt className="text-zinc-400">Colors</dt>
                  <dd>{garment!.colors.join(", ")}</dd>
                </>
              )}
              {garment!.materials && garment!.materials.length > 0 && (
                <>
                  <dt className="text-zinc-400">Materials</dt>
                  <dd>{garment!.materials.join(", ")}</dd>
                </>
              )}
              {garment!.function && garment!.function.length > 0 && (
                <>
                  <dt className="text-zinc-400">Function</dt>
                  <dd>{garment!.function.join(", ")}</dd>
                </>
              )}
              {garment!.gender && (
                <>
                  <dt className="text-zinc-400">Gender</dt>
                  <dd>{garment!.gender}</dd>
                </>
              )}
              {garment!.age && (
                <>
                  <dt className="text-zinc-400">Age</dt>
                  <dd>{garment!.age}</dd>
                </>
              )}
              {garment!.condition && (
                <>
                  <dt className="text-zinc-400">Condition</dt>
                  <dd>{garment!.condition}</dd>
                </>
              )}
            </dl>
          </section>

          <section>
            <Link
              href="/garments"
              className="text-xs uppercase tracking-[0.25em] text-zinc-400 underline"
            >
              ← Back to closet
            </Link>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
