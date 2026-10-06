"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Garment } from "@/types/garment";
import { getGarmentById } from "@/lib/garments";
import Link from "next/link";
import { X, Plus, Download, FileText, FileSpreadsheet, File, GitCompare } from "lucide-react";
import EmptyState from "./EmptyState";
import Garment3DViewer from "./Garment3DViewer";
import ErrorBoundary from "./ErrorBoundary";
import { exportToCSV, exportToJSON, exportToPDF } from "@/lib/exportUtils";
import { getAnalytics } from "@/lib/analytics";

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
    getAnalytics().trackExport("json", compareGarments.length);
  };

  const exportComparisonCSV = () => {
    exportToCSV(compareGarments, `garment-comparison-${Date.now()}.csv`);
    getAnalytics().trackExport("csv", compareGarments.length);
  };

  const exportComparisonPDF = async () => {
    await exportToPDF(compareGarments, `garment-comparison-${Date.now()}.pdf`);
    getAnalytics().trackExport("pdf", compareGarments.length);
  };

  return (
    <div className="min-h-screen bg-archive-bg text-archive-fg">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="mb-12 md:mb-16 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
            Compare Garments
          </h1>
          <p className="text-sm md:text-base text-archive-muted font-light max-w-2xl mx-auto">
            Select up to 4 garments to compare side-by-side
          </p>
        </div>

        {/* Add Garments Section */}
        {compareIds.length < 4 && (
          <div className="print-hide mb-8 p-6 border border-archive-border bg-archive-surface/30">
            <h2 className="text-sm uppercase tracking-[0.2em] text-archive-muted mb-4">
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
                    className="p-4 border border-archive-border hover:border-archive-border-hover transition-colors text-left group"
                  >
                    <div className="aspect-[3/4] bg-archive-surface mb-2 flex items-center justify-center text-archive-muted text-xs">
                      Image
                    </div>
                    <p className="text-xs text-archive-muted group-hover:text-archive-fg transition-colors line-clamp-2">
                      {garment.name || garment.label || garment.editorial_title}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-archive-muted">
                      <Plus className="w-3 h-3" />
                      <span className="text-xs">Add</span>
                    </div>
                  </button>
                ))}
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/collection"
                className="text-xs uppercase tracking-[0.2em] text-archive-muted hover:text-archive-fg transition-colors"
              >
                Browse all garments →
              </Link>
            </div>
          </div>
        )}

        {/* Empty: no garments selected */}
        {compareGarments.length === 0 && (
          <EmptyState
            icon={GitCompare}
            title="Select garments to compare"
            description="Add up to 4 garments from the list above, or browse the collection to find more."
            actionLabel="Browse collection"
            actionHref="/collection"
          />
        )}

        {/* Comparison Grid */}
        {compareGarments.length > 0 ? (
          <div className="space-y-8">
            {/* Actions */}
            <div className="print-hide flex justify-end gap-4 flex-wrap">
              <div className="flex gap-2">
                <button
                  onClick={exportComparisonJSON}
                  className="text-xs uppercase tracking-[0.2em] text-archive-muted hover:text-archive-fg transition-colors border border-archive-border px-4 py-2 hover:border-archive-border-hover flex items-center gap-2"
                  title="Export as JSON"
                >
                  <FileText className="w-4 h-4" />
                  JSON
                </button>
                <button
                  onClick={exportComparisonCSV}
                  className="text-xs uppercase tracking-[0.2em] text-archive-muted hover:text-archive-fg transition-colors border border-archive-border px-4 py-2 hover:border-archive-border-hover flex items-center gap-2"
                  title="Export as CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={exportComparisonPDF}
                  className="text-xs uppercase tracking-[0.2em] text-archive-muted hover:text-archive-fg transition-colors border border-archive-border px-4 py-2 hover:border-archive-border-hover flex items-center gap-2"
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
                  <tr className="border-b border-archive-border">
                    <th className="p-4 text-left text-xs uppercase tracking-[0.2em] text-archive-muted font-light">
                      Property
                    </th>
                    {compareGarments.map((garment) => (
                      <th key={garment.id} className="p-4 text-left min-w-[200px]">
                        <div className="relative">
                          <button
                            onClick={() => removeFromCompare(garment.id)}
                            className="absolute top-0 right-0 p-1 text-archive-muted hover:text-archive-muted-subtle transition-colors"
                            aria-label="Remove from comparison"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <a
                            href={`/garments/${garment.slug}`}
                            className="block group"
                          >
                            <div className="aspect-[3/4] bg-archive-surface mb-3 flex items-center justify-center text-archive-muted text-xs">
                              Image
                            </div>
                            <h3 className="text-sm font-light mb-1 group-hover:text-archive-fg transition-colors">
                              {garment.name || garment.label || garment.editorial_title}
                            </h3>
                          </a>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-archive-border">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-archive-muted">ID</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-archive-muted-subtle">
                        {garment.id}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-archive-border">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-archive-muted">Date</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-archive-muted-subtle">
                        {garment.decade || garment.date || garment.yearApprox || "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-archive-border">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-archive-muted">Era</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-archive-muted-subtle">
                        {garment.era || "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-archive-border">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-archive-muted">Type</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-archive-muted-subtle">
                        {garment.work_type || garment.type || "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-archive-border">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-archive-muted">Colors</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-archive-muted-subtle">
                        {garment.colors && (Array.isArray(garment.colors) ? garment.colors.length > 0 : garment.colors)
                          ? (Array.isArray(garment.colors) ? garment.colors.join(", ") : garment.colors)
                          : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-archive-border">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-archive-muted">Materials</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-archive-muted-subtle">
                        {garment.materials && (Array.isArray(garment.materials) ? garment.materials.length > 0 : garment.materials)
                          ? (Array.isArray(garment.materials) ? garment.materials.join(", ") : garment.materials)
                          : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-archive-border">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-archive-muted">Dimensions</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-archive-muted-subtle">
                        {garment.dimensions || "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-archive-border">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-archive-muted">Condition</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-archive-muted-subtle">
                        {garment.condition || "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-archive-border">
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-archive-muted">Collection</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4 text-sm text-archive-muted-subtle">
                        {garment.collection || "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 text-xs uppercase tracking-[0.1em] text-archive-muted">3D View</td>
                    {compareGarments.map((garment) => (
                      <td key={garment.id} className="p-4">
                        <div className="h-64 border border-archive-border">
                          <ErrorBoundary
                            fallback={
                              <div className="w-full h-full flex items-center justify-center">
                                <p className="text-xs uppercase tracking-[0.15em] text-archive-muted">
                                  3D view unavailable
                                </p>
                              </div>
                            }
                          >
                            <Garment3DViewer garment={garment} />
                          </ErrorBoundary>
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
            <p className="text-lg text-archive-muted font-light mb-4">
              No garments selected for comparison
            </p>
            <p className="text-sm text-archive-muted font-light mb-6">
              Select garments from the collection to compare
            </p>
            <Link
              href="/collection"
              className="inline-block text-xs uppercase tracking-[0.25em] text-archive-muted hover:text-archive-fg transition border border-archive-border px-6 py-3 hover:border-archive-border-hover"
            >
              Browse Collection
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

