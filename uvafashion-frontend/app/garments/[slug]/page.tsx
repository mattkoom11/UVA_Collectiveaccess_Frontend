import { notFound } from "next/navigation";
import { getAllGarments, getGarmentBySlug } from "@/lib/garments";
import { Garment } from "@/types/garment";
import Link from "next/link";
import Garment3DViewer from "@/components/garments/Garment3DViewer";

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

  const editorialTitle = garment.editorial_title || garment.label;
  const editorialSubtitle = garment.editorial_subtitle || `${garment.work_type || "Garment"} · ${garment.decade || garment.date || ""}`;
  const aestheticDescription = garment.aesthetic_description || garment.description || "No description yet.";
  const story = garment.story;
  const inspiration = garment.inspiration;
  const context = garment.context;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero section - full width, magazine-style */}
      <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background image overlay */}
        {garment.images && garment.images.length > 0 && (
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-zinc-950" />
          </div>
        )}
        
        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
          {/* Category badge */}
          <div className="inline-block mb-8">
            <span className="text-xs uppercase tracking-[0.3em] text-zinc-400 border border-zinc-700 px-6 py-2">
              {garment.work_type || "Garment"}
            </span>
          </div>
          
          {/* Editorial title - Vogue-style large typography */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-6 leading-[0.95]">
            {editorialTitle}
          </h1>
          
          {/* Editorial subtitle - elegant tagline */}
          <p className="text-lg md:text-xl text-zinc-300 font-light tracking-wide mb-12 max-w-2xl mx-auto">
            {editorialSubtitle}
          </p>
          
          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="h-px w-16 bg-zinc-700" />
            <div className="w-2 h-2 border border-zinc-700 rotate-45" />
            <div className="h-px w-16 bg-zinc-700" />
          </div>
        </div>
      </section>

      {/* Main editorial content */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* 3D Model Viewer - if available, otherwise show images */}
        {garment.model3d_url ? (
          <section className="mb-20">
            <Garment3DViewer modelUrl={garment.model3d_url} garmentId={garment.id} />
            <p className="text-xs text-zinc-500 italic text-center tracking-wide mt-4">
              Interactive 3D model • {editorialTitle}
            </p>
          </section>
        ) : garment.images && garment.images.length > 0 ? (
          <section className="mb-20">
            <div className="relative w-full aspect-[4/5] md:aspect-[3/4] mb-8 overflow-hidden">
              <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                {/* Placeholder for primary image - replace with Next/Image when images are ready */}
                <div className="text-center text-zinc-500 text-sm">
                  <p>Primary Image</p>
                  <p className="text-xs mt-2 text-zinc-600">
                    {garment.images[0]}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Image caption */}
            <p className="text-xs text-zinc-500 italic text-center tracking-wide">
              {editorialTitle}
            </p>
          </section>
        ) : null}

        {/* Aesthetic description - flowing prose */}
        <section className="mb-20">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-xl md:text-2xl font-light leading-relaxed text-zinc-200 text-center mb-12 tracking-wide">
                {aestheticDescription}
              </p>
            </div>
          </div>
        </section>

        {/* Story section - if available */}
        {story && (
          <section className="mb-20">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-6 text-center">
                The Story
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-base md:text-lg leading-relaxed text-zinc-300 text-center font-light">
                  {story}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Additional images grid - editorial style */}
        {garment.images && garment.images.length > 1 && (
          <section className="mb-20 grid grid-cols-1 md:grid-cols-3 gap-4">
            {garment.images.slice(1).map((imageSrc, i) => (
              <div key={i} className="relative aspect-[3/4] bg-zinc-900 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
                  <p>Image {i + 2}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Inspiration & Context - side by side */}
        {(inspiration || context) && (
          <section className="mb-20 grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {inspiration && (
              <div>
                <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-4">
                  Inspiration
                </h2>
                <p className="text-sm md:text-base leading-relaxed text-zinc-300 font-light">
                  {inspiration}
                </p>
              </div>
            )}
            {context && (
              <div>
                <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-4">
                  Context
                </h2>
                <p className="text-sm md:text-base leading-relaxed text-zinc-300 font-light">
                  {context}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Technical details - elegant presentation */}
        <section className="mb-20 border-t border-zinc-800 pt-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-8 text-center">
              Details
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
              {garment.date && (
                <>
                  <dt className="text-zinc-400 font-light">Date</dt>
                  <dd className="text-zinc-200">{garment.date}</dd>
                </>
              )}
              {garment.decade && (
                <>
                  <dt className="text-zinc-400 font-light">Decade</dt>
                  <dd className="text-zinc-200">{garment.decade}</dd>
                </>
              )}
              {garment.colors && garment.colors.length > 0 && (
                <>
                  <dt className="text-zinc-400 font-light">Colors</dt>
                  <dd className="text-zinc-200">{garment.colors.join(", ")}</dd>
                </>
              )}
              {garment.materials && garment.materials.length > 0 && (
                <>
                  <dt className="text-zinc-400 font-light">Materials</dt>
                  <dd className="text-zinc-200">{garment.materials.join(", ")}</dd>
                </>
              )}
              {garment.function && garment.function.length > 0 && (
                <>
                  <dt className="text-zinc-400 font-light">Function</dt>
                  <dd className="text-zinc-200">{garment.function.join(", ")}</dd>
                </>
              )}
              {garment.gender && (
                <>
                  <dt className="text-zinc-400 font-light">Gender</dt>
                  <dd className="text-zinc-200">{garment.gender}</dd>
                </>
              )}
              {garment.age && (
                <>
                  <dt className="text-zinc-400 font-light">Age</dt>
                  <dd className="text-zinc-200">{garment.age}</dd>
                </>
              )}
              {garment.condition && (
                <>
                  <dt className="text-zinc-400 font-light">Condition</dt>
                  <dd className="text-zinc-200">{garment.condition}</dd>
                </>
              )}
            </dl>
          </div>
        </section>

        {/* Navigation */}
        <section className="text-center pt-8 border-t border-zinc-800">
          <Link
            href="/garments"
            className="inline-block text-xs uppercase tracking-[0.25em] text-zinc-400 hover:text-zinc-200 transition border border-zinc-700 px-6 py-3 hover:border-zinc-500"
          >
            ← Back to Closet
          </Link>
        </section>
      </div>
    </div>
  );
}
