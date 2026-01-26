"use client";

import { useState } from "react";
import Runway3D from "@/components/garments/Runway3D";
import Backstage3D from "@/components/backstage/Backstage3D";
import { ErrorBoundary } from "@/components/backstage/ErrorBoundary";
import { getAllGarments } from "@/lib/garments";
import PageLayout from "@/components/layout/PageLayout";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { sampleExhibitions } from "@/data/exhibitions";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type TabType = "runway" | "backstage";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("runway");
  const router = useRouter();
  const garments = useMemo(() => getAllGarments(), []);

  const handleGarmentSelected = (garmentId: string) => {
    router.push(`/backstage/${garmentId}`);
  };

  return (
    <PageLayout>
      {/* Tab Navigation */}
      <div className="border-b border-zinc-800 sticky top-[73px] md:top-[81px] bg-zinc-950/95 backdrop-blur-sm z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("runway")}
              className={`py-4 text-sm uppercase tracking-[0.2em] font-light transition-colors border-b-2 ${
                activeTab === "runway"
                  ? "text-zinc-50 border-zinc-50"
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              3D Runway
            </button>
            <button
              onClick={() => setActiveTab("backstage")}
              className={`py-4 text-sm uppercase tracking-[0.2em] font-light transition-colors border-b-2 ${
                activeTab === "backstage"
                  ? "text-zinc-50 border-zinc-50"
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              3D Backstage
            </button>
          </div>
        </div>
      </div>

      {/* Featured Exhibitions */}
      <section className="py-8 md:py-12 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-light text-zinc-300">Featured Exhibitions</h2>
            <Link
              href="/exhibitions"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-2"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sampleExhibitions
              .filter(e => e.featured)
              .slice(0, 2)
              .map((exhibition) => (
                <Link
                  key={exhibition.id}
                  href={`/exhibitions/${exhibition.id}`}
                  className="group border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300"
                >
                  <div className="aspect-[16/9] bg-zinc-900 flex items-center justify-center text-zinc-600">
                    {exhibition.imageUrl ? (
                      <span className="text-sm">Image: {exhibition.imageUrl}</span>
                    ) : (
                      <span className="text-sm">Exhibition Image</span>
                    )}
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="text-lg font-light group-hover:text-zinc-200 transition-colors">
                      {exhibition.title}
                    </h3>
                    {exhibition.subtitle && (
                      <p className="text-sm text-zinc-400 font-light">
                        {exhibition.subtitle}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500 font-light line-clamp-2">
                      {exhibition.description}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      {activeTab === "runway" ? (
        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4">
            <Runway3D garments={garments} />
          </div>
        </section>
      ) : (
        <section className="w-full h-[calc(100vh-200px)] min-h-[600px]">
          <ErrorBoundary>
            <Backstage3D
              onGarmentSelected={handleGarmentSelected}
              garmentIds={garments.slice(0, 6).map(g => g.id)}
              garmentPositions={[
                [-3, 0.45, -8],   // Left front
                [0, 0.45, -8],    // Center front
                [3, 0.45, -8],    // Right front
                [-3, 0.45, -12],  // Left back
                [0, 0.45, -12],   // Center back
                [3, 0.45, -12],   // Right back
              ]}
            />
          </ErrorBoundary>
        </section>
      )}
    </PageLayout>
  );
}

