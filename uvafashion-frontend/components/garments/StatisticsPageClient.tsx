"use client";

import { CollectionStatistics } from "@/lib/statistics";
import { BarChart3, TrendingUp, Calendar, Palette, Scissors } from "lucide-react";

interface StatisticsPageClientProps {
  statistics: CollectionStatistics;
}

export default function StatisticsPageClient({ statistics }: StatisticsPageClientProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="mb-12 md:mb-16 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
            Collection Statistics
          </h1>
          <p className="text-sm md:text-base text-zinc-400 font-light max-w-2xl mx-auto">
            Insights and breakdowns of the UVA Fashion Archive collection
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-zinc-400" />
              <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-400">Total Garments</h2>
            </div>
            <p className="text-4xl font-light text-zinc-100">{statistics.total}</p>
          </div>

          {statistics.dateRange.earliest && statistics.dateRange.latest && (
            <div className="border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-zinc-400" />
                <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-400">Date Range</h2>
              </div>
              <p className="text-4xl font-light text-zinc-100">
                {statistics.dateRange.earliest}–{statistics.dateRange.latest}
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                {statistics.dateRange.latest - statistics.dateRange.earliest} years
              </p>
            </div>
          )}

          <div className="border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-zinc-400" />
              <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-400">Unique Materials</h2>
            </div>
            <p className="text-4xl font-light text-zinc-100">{statistics.topMaterials.length}</p>
          </div>
        </div>

        {/* Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* By Era */}
          <div className="border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-light mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-zinc-400" />
              By Era
            </h2>
            <div className="space-y-3">
              {Object.entries(statistics.byEra)
                .sort(([, a], [, b]) => b - a)
                .map(([era, count]) => (
                  <div key={era} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300 capitalize">{era}</span>
                    <div className="flex items-center gap-3 flex-1 mx-4">
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-600 rounded-full"
                          style={{
                            width: `${(count / statistics.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-zinc-400 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* By Type */}
          <div className="border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-light mb-6 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-zinc-400" />
              By Type
            </h2>
            <div className="space-y-3">
              {Object.entries(statistics.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300 capitalize">{type}</span>
                    <div className="flex items-center gap-3 flex-1 mx-4">
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-600 rounded-full"
                          style={{
                            width: `${(count / statistics.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-zinc-400 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Top Materials and Colors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Materials */}
          <div className="border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-light mb-6 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-zinc-400" />
              Top Materials
            </h2>
            <div className="space-y-3">
              {statistics.topMaterials.map(({ material, count }) => (
                <div key={material} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300 capitalize">{material}</span>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-600 rounded-full"
                        style={{
                          width: `${(count / statistics.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-zinc-400 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Colors */}
          <div className="border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-light mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5 text-zinc-400" />
              Top Colors
            </h2>
            <div className="space-y-3">
              {statistics.topColors.map(({ color, count }) => (
                <div key={color} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300 capitalize">{color}</span>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-600 rounded-full"
                        style={{
                          width: `${(count / statistics.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-zinc-400 w-8 text-right">{count}</span>
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

