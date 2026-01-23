"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Garment } from "@/types/garment";
import { getGarmentById } from "@/lib/garments";
import Link from "next/link";
import { X, Plus, Download, FileText, FileSpreadsheet, File } from "lucide-react";
import Garment3DViewer from "./Garment3DViewer";
import { exportToCSV, exportToJSON, exportToPDF } from "@/lib/exportUtils";

interface ComparePageClientProps {
  allGarments: Garment[];
}

export default function ComparePageClient({ allGarments }: ComparePageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    const ids = searchParams.get("ids");
    return ids ? ids.split(",").filter(Boolean) : [];
  });

  const compareGarments = useMemo(() => {
    return compareIds
      .map((id) => getGarmentById(id))
      .filter((g): g is Garment => g !== undefined)
      .slice(0, 4); // Max 4 garments
  }, [compareIds]);

  // Update URL when compareIds change
  useEffect(() => {
    if (compareIds.length > 0) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("ids", compareIds.join(","));
      router.replace(`/compare?${newParams.toString()}`, { scroll: false });
    } else {
      router.replace("/compare", { scroll: false });
    }
  }, [compareIds, router, searchParams]);

  const addToCompare = (garmentId: string) => {
    if (compareIds.length < 4 && !compareIds.includes(garmentId)) {
      setCompareIds([...compareIds, garmentId]);
    }
  };

  const removeFromCompare = (garmentId: string) => {
    setCompareIds(compareIds.filter((id) => id !== garmentId));
  };

  const exportComparisonJSON = () => {
    exportToJSON(compareGarments, `garment-comparison-${Date.now()}.json`);
  };

  const exportComparisonCSV = () => {
    exportToCSV(compareGarments, `garment-comparison-${Date.now()}.csv`);
  };

  const exportComparisonPDF = async () => {
    await exportToPDF(compareGarments, `garment-comparison-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="mb-12 md:mb-16 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
            Compare Garments
          </h1>
          <p className="text-sm md:text-base text-zinc-400 font-light max-w-2xl mx-auto">
            Select up to 4 garments to compare side-by-side
          </p>
        </div>

        {/* Add Garments Section */}
        {compareIds.length < 4 && (
          <div className="mb-8 p-6 border border-zinc-800 bg-zinc-900/30 rounded-lg">
            <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-400 mb-4">
              Add Garments to Compare
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allGarments
                .filter((g) => !compareIds.includes(g.id))
                .slice(0, 12)
                .map((garment) => (
                  <button
                    key={garment.id}
                    onClick={() => addToCompare(garment.id)}
                    className="p-4 border border-zinc-700 hover:border-zinc-500 transition-colors text-left group"
                  >
                    <div className="aspect-[3/4] bg-zinc-900 mb-2 flex items-center justify-center text-zinc-600 text-xs">
                      Image
                    </div>
                    <p className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors line-clamp-2">
                      {garment.name || garment.label || garment.editorial_title}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-zinc-500">
                      <Plus className="w-3 h-3" />
                      <span className="text-xs">Add</span>
                    </div>
                  </button>
                ))}
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/collection"
                className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Browse all garments →
              </Link>
            </div>
          </div>
        )}

        {/* Comparison Grid */}
        {compareGarments.length > 0 ? (
          <div className="space-y-8">
            {/* Actions */}
            <div className="flex justify-end gap-4 flex-wrap">
              <div className="flex gap-2">
                <button
                  onClick={exportComparisonJSON}
                  className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700 px-4 py-2 hover:border-zinc-500 flex items-center gap-2"
                  title="Export as JSON"
                >
                  <FileText className="w-4 h-4" />
                  JSON
                </button>
                <button
                  onClick={exportComparisonCSV}
                  className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700 px-4 py-2 hover:border-zinc-500 flex items-center gap-2"
                  title="Export as CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={exportComparisonPDF}
                  className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700 px-4 py-2 hover:border-zinc-500 flex items-center gap-2"
                  title="Export as PDF"
                >
                  <File className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto" id="comparison-table">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="p-4 text-left text-xs uppercase tracking-[0.2em] text-zinc-400 font-light">
                      Property
                    </th>
                    {compareGarments.map((garment) => (
                      <th key={garment.id} className="p-4 text-left min-w-[200px]">
                        <div className="relative">
                          <button
                            onClick={() => removeFromCompare(garment.id)}
                            className="absolute top-0 right-0 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                            aria-label="Remove from comparison"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/garments/${garment.slug}`}
                            className="block group"
                          >
                            <div className="aspect-[3/4] bg-zinc-900 mb-3 flex items-center justify-center text-zinc-600 text-xs">
                              Image
                            </div>
                            <h3 className="text-sm font-light mb-1 group-hover:text-zinc-200 transition-colors">
                              {garment.name || garment.label || garment.editorial_title}
                            </h3>
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-800">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-zinc-500">ID</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-zinc-300">
                        {garment.id}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-zinc-500">Date</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-zinc-300">
                        {garment.decade || garment.date || garment.yearApprox || "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-zinc-500">Era</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-zinc-300">
                        {garment.era || "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-zinc-500">Type</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-zinc-300">
                        {garment.work_type || garment.type || "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-zinc-500">Colors</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-zinc-300">
                        {garment.colors && (Array.isArray(garment.colors) ? garment.colors.length > 0 : garment.colors)
                          ? (Array.isArray(garment.colors) ? garment.colors.join(", ") : garment.colors)
                          : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-zinc-500">Materials</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-zinc-300">
                        {garment.materials && (Array.isArray(garment.materials) ? garment.materials.length > 0 : garment.materials)
                          ? (Array.isArray(garment.materials) ? garment.materials.join(", ") : garment.materials)
                          : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-zinc-500">Dimensions</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-zinc-300">
                        {garment.dimensions || "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-zinc-500">Condition</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-zinc-300">
                        {garment.condition || "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-zinc-500">Collection</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-zinc-300">
                        {garment.collection || "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-zinc-500">3D View</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4">
                        <div className="h-64 border border-zinc-800">
                          <Garment3DViewer garment={garment} />
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-zinc-400 font-light mb-4">
              No garments selected for comparison
            </p>
            <p className="text-sm text-zinc-500 font-light mb-6">
              Select garments from the collection to compare
            </p>
            <Link
              href="/collection"
              className="inline-block text-xs uppercase tracking-[0.25em] text-zinc-400 hover:text-zinc-200 transition border border-zinc-700 px-6 py-3 hover:border-zinc-500"
            >
              Browse Collection
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

