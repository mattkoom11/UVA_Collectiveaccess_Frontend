"use client";

import { useState, useMemo } from "react";
import Runway3D from "./Runway3D";
import Backstage3D from "@/components/backstage/Backstage3D";
import { getAllGarments } from "@/lib/garments";
import PageLayout from "@/components/layout/PageLayout";
import { useRouter } from "next/navigation";

export interface Garment {
  id: string;
  title: string;
  year: string;
  designer: string;
  collection: string;
  accessionNumber: string;
  primaryImage: string;
  detailImages: string[];
  silhouette: string;
  materials: string[];
  colors: string[];
  eraStory: string;
  narrative: string;
  condition: string;
  tags: string[];
}

interface GarmentPageProps {
  garment: Garment;
}

type TabType = "detail" | "runway" | "backstage";

export default function GarmentPage({ garment }: GarmentPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("detail");
  const runwayGarments = useMemo(() => getAllGarments(), []);
  const router = useRouter();

  const handleGarmentSelected = (garmentId: string) => {
    router.push(`/backstage/${garmentId}`);
  };

  return (
    <PageLayout>
      {/* Tab Navigation */}
      <div className="border-b border-zinc-800 sticky top-[73px] md:top-[81px] bg-zinc-950/95 backdrop-blur-sm z-[9]">
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
        <>
      {/* Top Section: Hero Image + Title/Year/Designer */}
      <section className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            {/* Large Hero Image */}
            <div className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-zinc-900 overflow-hidden group">
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                {/* Placeholder for image - replace with Next/Image when ready */}
                <div className="text-center">
                  <p className="mb-2">Primary Image</p>
                  <p className="text-xs text-zinc-700">{garment.primaryImage}</p>
                </div>
              </div>
              {/* Hover overlay effect */}
              <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/10 transition-colors duration-300" />
            </div>

            {/* Title/Year/Designer - Elegant Typography */}
            <div className="space-y-6 md:space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1] mb-4">
                  {garment.title}
                </h1>
                <div className="flex flex-wrap items-baseline gap-4 text-zinc-400">
                  <span className="text-lg md:text-xl font-light">{garment.year}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-lg md:text-xl font-light">{garment.designer}</span>
                </div>
              </div>
              
              {/* Decorative divider */}
              <div className="h-px w-24 bg-zinc-800" />
              
              {/* Collection info */}
              <div className="text-sm text-zinc-400 uppercase tracking-[0.15em]">
                {garment.collection}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Middle Section: Narrative + Metadata Sidebar */}
      <section className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
            {/* Left: Rich Narrative Text - Multi-column on larger screens */}
            <div className="lg:col-span-2">
              <div className="prose prose-invert prose-lg max-w-none">
                {/* Multi-column layout for larger screens */}
                <div className="columns-1 md:columns-2 gap-8 md:gap-12 space-y-6">
                  <p className="text-base md:text-lg leading-relaxed text-zinc-200 font-light tracking-wide break-inside-avoid">
                    {garment.narrative}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Narrow Metadata Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">
                      Silhouette
                    </h3>
                    <p className="text-sm text-zinc-300 font-light">{garment.silhouette}</p>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">
                      Materials
                    </h3>
                    <ul className="space-y-1">
                      {garment.materials.map((material, index) => (
                        <li key={index} className="text-sm text-zinc-300 font-light">
                          {material}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">
                      Colors
                    </h3>
                    <ul className="space-y-1">
                      {garment.colors.map((color, index) => (
                        <li key={index} className="text-sm text-zinc-300 font-light">
                          {color}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">
                      Collection
                    </h3>
                    <p className="text-sm text-zinc-300 font-light">{garment.collection}</p>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">
                      Accession Number
                    </h3>
                    <p className="text-sm text-zinc-300 font-light font-mono">
                      {garment.accessionNumber}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">
                      Condition
                    </h3>
                    <p className="text-sm text-zinc-300 font-light">{garment.condition}</p>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {garment.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs text-zinc-400 border border-zinc-700 px-3 py-1 font-light"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section: Horizontal Strip of Detail Photos */}
      {garment.detailImages && garment.detailImages.length > 0 && (
        <section className="border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-8 text-center">
              Detail Views
            </h2>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {garment.detailImages.map((image, index) => (
                <div
                  key={index}
                  className="relative flex-shrink-0 w-64 md:w-80 aspect-[3/4] bg-zinc-900 overflow-hidden group cursor-pointer"
                >
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                    {/* Placeholder for image - replace with Next/Image when ready */}
                    <div className="text-center">
                      <p className="mb-1">Detail {index + 1}</p>
                      <p className="text-[0.65rem] text-zinc-700 truncate max-w-[200px]">
                        {image}
                      </p>
                    </div>
                  </div>
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/20 transition-colors duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Era Story Section (optional, if space allows) */}
      {garment.eraStory && (
        <section>
          <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-6 text-center">
              Historical Context
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-zinc-300 font-light text-center max-w-3xl mx-auto">
              {garment.eraStory}
            </p>
          </div>
        </section>
      )}
        </>
      ) : activeTab === "runway" ? (
        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4">
            <Runway3D garments={runwayGarments} />
          </div>
        </section>
      ) : (
        <section className="w-full h-[calc(100vh-200px)] min-h-[600px]">
          <Backstage3D
            onGarmentSelected={handleGarmentSelected}
            garmentId={garment.id}
            garmentPositions={[[0, 0.45, -8]]}
          />
        </section>
      )}
    </PageLayout>
  );
}

