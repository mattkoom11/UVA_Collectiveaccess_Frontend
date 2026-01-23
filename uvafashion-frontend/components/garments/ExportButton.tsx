"use client";

import { Download, FileText, FileJson, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { Garment } from "@/types/garment";
import { exportGarmentsToJSON, exportGarmentsToCSV, exportGarmentToPDF } from "@/lib/export";

interface ExportButtonProps {
  garments: Garment[];
  variant?: "button" | "menu";
}

export default function ExportButton({ garments, variant = "button" }: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  if (variant === "menu") {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700 px-4 py-2 hover:border-zinc-500 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-[200px]">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    exportGarmentsToJSON(garments);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors rounded"
                >
                  <FileJson className="w-4 h-4" />
                  Export as JSON
                </button>
                <button
                  onClick={() => {
                    exportGarmentsToCSV(garments);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors rounded"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export as CSV
                </button>
                {garments.length === 1 && (
                  <button
                    onClick={() => {
                      exportGarmentToPDF(garments[0]);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors rounded"
                  >
                    <FileText className="w-4 h-4" />
                    Export as PDF
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => exportGarmentsToJSON(garments)}
      className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700 px-4 py-2 hover:border-zinc-500 flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      Export
    </button>
  );
}

