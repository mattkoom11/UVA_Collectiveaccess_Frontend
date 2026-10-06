"use client";

import { CollectionStatistics } from "@/lib/statistics";
import { BarChart3, TrendingUp, Calendar, Palette, Scissors } from "lucide-react";

interface StatisticsPageClientProps {
  statistics: CollectionStatistics;
}

export default function StatisticsPageClient({ statistics }: StatisticsPageClientProps) {
  return (
    <div className="min-h-screen bg-archive-bg text-archive-fg">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="mb-12 md:mb-16 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
            Collection Statistics
          </h1>
          <p className="text-sm md:text-base text-archive-muted font-light max-w-2xl mx-auto">
            Insights and breakdowns of the UVA Fashion Archive collection
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="border border-archive-border bg-archive-surface/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-archive-muted" />
              <h2 className="text-sm uppercase tracking-[0.2em] text-archive-muted">Total Garments</h2>
            </div>
            <p className="text-4xl font-light text-archive-fg">{statistics.total}</p>
          </div>

          {statistics.dateRange.earliest && statistics.dateRange.latest && (
            <div className="border border-archive-border bg-archive-surface/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-archive-muted" />
                <h2 className="text-sm uppercase tracking-[0.2em] text-archive-muted">Date Range</h2>
              </div>
              <p className="text-4xl font-light text-archive-fg">
                {statistics.dateRange.earliest}–{statistics.dateRange.latest}
              </p>
              <p className="text-xs text-archive-muted mt-2">
                {statistics.dateRange.latest - statistics.dateRange.earliest} years
              </p>
            </div>
          )}

          <div className="border border-archive-border bg-archive-surface/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-archive-muted" />
              <h2 className="text-sm uppercase tracking-[0.2em] text-archive-muted">Unique Materials</h2>
            </div>
            <p className="text-4xl font-light text-archive-fg">{statistics.topMaterials.length}</p>
          </div>
        </div>

        {/* Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* By Era */}
          <div className="border border-archive-border bg-archive-surface/50 p-6">
            <h2 className="text-lg font-light mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-archive-muted" />
              By Era
            </h2>
            <div className="space-y-3">
              {Object.entries(statistics.byEra)
                .sort(([, a], [, b]) => b - a)
                .map(([era, count]) => (
                  <div key={era} className="flex items-center justify-between">
                    <span className="text-sm text-archive-muted-subtle capitalize">{era}</span>
                    <div className="flex items-center gap-3 flex-1 mx-4">
                      <div className="flex-1 h-2 bg-archive-surface-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-archive-border-hover rounded-full"
                          style={{
                            width: `${(count / statistics.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-archive-muted w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* By Type */}
          <div className="border border-archive-border bg-archive-surface/50 p-6">
            <h2 className="text-lg font-light mb-6 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-archive-muted" />
              By Type
            </h2>
            <div className="space-y-3">
              {Object.entries(statistics.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-archive-muted-subtle capitalize">{type}</span>
                    <div className="flex items-center gap-3 flex-1 mx-4">
                      <div className="flex-1 h-2 bg-archive-surface-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-archive-border-hover rounded-full"
                          style={{
                            width: `${(count / statistics.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-archive-muted w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Top Materials and Colors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Materials */}
          <div className="border border-archive-border bg-archive-surface/50 p-6">
            <h2 className="text-lg font-light mb-6 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-archive-muted" />
              Top Materials
            </h2>
            <div className="space-y-3">
              {statistics.topMaterials.map(({ material, count }) => (
                <div key={material} className="flex items-center justify-between">
                  <span className="text-sm text-archive-muted-subtle capitalize">{material}</span>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div className="flex-1 h-2 bg-archive-surface-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-archive-border-hover rounded-full"
                        style={{
                          width: `${(count / statistics.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-archive-muted w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Colors */}
          <div className="border border-archive-border bg-archive-surface/50 p-6">
            <h2 className="text-lg font-light mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5 text-archive-muted" />
              Top Colors
            </h2>
            <div className="space-y-3">
              {statistics.topColors.map(({ color, count }) => (
                <div key={color} className="flex items-center justify-between">
                  <span className="text-sm text-archive-muted-subtle capitalize">{color}</span>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div className="flex-1 h-2 bg-archive-surface-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-archive-border-hover rounded-full"
                        style={{
                          width: `${(count / statistics.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-archive-muted w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

