"use client";

import { useState } from "react";
import { Download, Settings } from "lucide-react";

export type ImageQuality = "high" | "medium" | "low";
export type ImageFormat = "jpg" | "png" | "webp";

interface ImageDownloadOptionsProps {
  imageUrl: string;
  filename?: string;
  onDownload?: (url: string, quality: ImageQuality, format: ImageFormat) => void;
}

export default function ImageDownloadOptions({
  imageUrl,
  filename = "garment-image",
  onDownload,
}: ImageDownloadOptionsProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [quality, setQuality] = useState<ImageQuality>("high");
  const [format, setFormat] = useState<ImageFormat>("jpg");

  const handleDownload = () => {
    if (onDownload) {
      onDownload(imageUrl, quality, format);
    } else {
      // Default download behavior
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `${filename}-${quality}.${format}`;
      link.click();
    }
    setShowOptions(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm text-zinc-300"
        aria-label="Download options"
      >
        <Settings className="w-4 h-4" />
        <span>Download</span>
      </button>

      {showOptions && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute top-full right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-[250px] p-4 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.1em] text-zinc-400 mb-2">
                Quality
              </label>
              <div className="flex gap-2">
                {(["high", "medium", "low"] as ImageQuality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                      quality === q
                        ? "bg-zinc-800 text-zinc-200"
                        : "bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {q.charAt(0).toUpperCase() + q.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.1em] text-zinc-400 mb-2">
                Format
              </label>
              <div className="flex gap-2">
                {(["jpg", "png", "webp"] as ImageFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex-1 px-3 py-2 text-xs rounded transition-colors uppercase ${
                      format === f
                        ? "bg-zinc-800 text-zinc-200"
                        : "bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm text-zinc-200"
            >
              <Download className="w-4 h-4" />
              Download {quality} {format.toUpperCase()}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
