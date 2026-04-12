"use client";

import { useState, useEffect } from "react";
import { getAllGarments } from "@/lib/garments";
import { getAnalytics } from "@/lib/analytics";
import { exportToCSV, exportToJSON } from "@/lib/exportUtils";
import { Garment } from "@/types/garment";
import { BarChart3, Download, RefreshCw, Database, TrendingUp, Users, Eye } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import AdminAuthGate from "@/components/admin/AdminAuthGate";

export default function AdminPage() {
  return (
    <AdminAuthGate>
      <AdminDashboard />
    </AdminAuthGate>
  );
}

function AdminDashboard() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("");

  useEffect(() => {
    setGarments(getAllGarments());
    setAnalytics(getAnalytics().getAnalytics());
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus("Syncing from CollectiveAccess...");
    try {
      const res = await fetch("/api/admin/sync", { method: "POST", credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setSyncStatus(`Synced ${data.count ?? 0} garments. Refresh the page to see updated counts.`);
    } catch (error) {
      setSyncStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportData = (format: "csv" | "json") => {
    if (format === "csv") {
      exportToCSV(garments, "garments-export.csv");
    } else {
      exportToJSON(garments, "garments-export.json");
    }
  };

  const handleExportAnalytics = () => {
    const data = getAnalytics().exportAnalytics();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-zinc-950 text-zinc-50">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
              Admin Dashboard
            </h1>
            <p className="text-sm md:text-base text-zinc-400 font-light">
              Manage content, view analytics, and sync data
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-zinc-400" />
                <h3 className="text-xs uppercase tracking-[0.1em] text-zinc-400">Total Garments</h3>
              </div>
              <p className="text-3xl font-light text-zinc-200">{garments.length}</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-5 h-5 text-zinc-400" />
                <h3 className="text-xs uppercase tracking-[0.1em] text-zinc-400">Total Views</h3>
              </div>
              <p className="text-3xl font-light text-zinc-200">
                {analytics?.totalEvents || 0}
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-zinc-400" />
                <h3 className="text-xs uppercase tracking-[0.1em] text-zinc-400">Popular Garments</h3>
              </div>
              <p className="text-3xl font-light text-zinc-200">
                {analytics?.popularGarments?.length || 0}
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-zinc-400" />
                <h3 className="text-xs uppercase tracking-[0.1em] text-zinc-400">Searches</h3>
              </div>
              <p className="text-3xl font-light text-zinc-200">
                {analytics?.popularSearches?.length || 0}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Sync from CollectiveAccess */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-lg font-light mb-4">Data Sync</h2>
              <p className="text-sm text-zinc-400 mb-4">
                Sync garments from CollectiveAccess CMS
              </p>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync from CollectiveAccess"}
              </button>
              {syncStatus && (
                <p className="text-xs text-zinc-500 mt-2">{syncStatus}</p>
              )}
            </div>

            {/* Export Data */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-lg font-light mb-4">Export Data</h2>
              <p className="text-sm text-zinc-400 mb-4">
                Export garment data for backup or analysis
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportData("csv")}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => handleExportData("json")}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
              </div>
            </div>
          </div>

          {/* Analytics */}
          {analytics && (
            <div className="space-y-6">
              {/* Popular Garments */}
              {analytics.popularGarments && analytics.popularGarments.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                  <h2 className="text-lg font-light mb-4">Most Viewed Garments</h2>
                  <div className="space-y-2">
                    {analytics.popularGarments.slice(0, 10).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-300">{item.id}</span>
                        <span className="text-zinc-400">{item.views} views</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              {analytics.popularSearches && analytics.popularSearches.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                  <h2 className="text-lg font-light mb-4">Popular Searches</h2>
                  <div className="space-y-2">
                    {analytics.popularSearches.slice(0, 10).map((item: any) => (
                      <div key={item.query} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-300">{item.query}</span>
                        <span className="text-zinc-400">{item.count} searches</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Analytics */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-lg font-light mb-4">Analytics Export</h2>
                <button
                  onClick={handleExportAnalytics}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export Analytics Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
