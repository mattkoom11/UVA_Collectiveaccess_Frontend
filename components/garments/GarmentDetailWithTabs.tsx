"use client";

import { useState } from "react";
import { Garment } from "@/types/garment";
import GarmentDetailClient from "./GarmentDetailClient";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/backstage/ErrorBoundary";
import { useRouter } from "next/navigation";

const Runway3D = dynamic(() => import("./Runway3D"), { ssr: false });
const Backstage3D = dynamic(() => import("@/components/backstage/Backstage3D"), { ssr: false });
import PageLayout from "@/components/layout/PageLayout";

interface GarmentDetailWithTabsProps {
  garment: Garment;
  relatedGarments: Garment[];
  allGarments: Garment[];
}

type TabType = "detail" | "runway" | "backstage";

export default function GarmentDetailWithTabs({ garment, relatedGarments, allGarments }: GarmentDetailWithTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("detail");
  const router = useRouter();

  const handleGarmentSelected = (garmentId: string) => {
    const selectedGarment = allGarments.find(g => g.id === garmentId);
    if (selectedGarment) {
      router.push(`/garments/${selectedGarment.slug}`);
    }
  };

  return (
    <PageLayout>
      {/* Tab Navigation */}
      <div className="border-b border-zinc-800 sticky top-[73px] md:top-[81px] bg-zinc-950/95 backdrop-blur-sm z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("detail")}
              className={`py-4 text-sm uppercase tracking-[0.2em] font-light transition-colors border-b-2 ${
                activeTab === "detail"
                  ? "text-zinc-50 border-zinc-50"
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              Detail View
            </button>
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

      {/* Tab Content */}
      {activeTab === "detail" ? (
        <GarmentDetailClient garment={garment} relatedGarments={relatedGarments} />
      ) : activeTab === "runway" ? (
        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4">
            <Runway3D garments={allGarments} />
          </div>
        </section>
      ) : (
        <section className="w-full h-[calc(100vh-200px)] min-h-[600px]">
          <ErrorBoundary>
            <Backstage3D
              onGarmentSelected={handleGarmentSelected}
              garmentIds={allGarments.slice(0, 6).map(g => g.id)}
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

