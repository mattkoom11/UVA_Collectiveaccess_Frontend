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
        className="flex items-center gap-2 px-4 py-2 bg-archive-surface-muted hover:bg-archive-border-hover border border-archive-border transition-colors text-sm text-archive-muted-subtle"
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
          <div className="absolute top-full right-0 mt-2 bg-archive-surface border border-archive-border shadow-xl z-50 min-w-[250px] p-4 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.1em] text-archive-muted mb-2">
                Quality
              </label>
              <div className="flex gap-2">
                {(["high", "medium", "low"] as ImageQuality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`flex-1 px-3 py-2 text-xs transition-colors ${
 quality === q
                        ? "bg-archive-surface-muted text-archive-fg"
                        : "bg-archive-surface-muted/50 text-archive-muted hover:text-archive-fg"
                    }`}
                  >
                    {q.charAt(0).toUpperCase() + q.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.1em] text-archive-muted mb-2">
                Format
              </label>
              <div className="flex gap-2">
                {(["jpg", "png", "webp"] as ImageFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex-1 px-3 py-2 text-xs transition-colors uppercase ${
 format === f
                        ? "bg-archive-surface-muted text-archive-fg"
                        : "bg-archive-surface-muted/50 text-archive-muted hover:text-archive-fg"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-archive-surface-muted hover:bg-archive-border-hover border border-archive-border transition-colors text-sm text-archive-fg"
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
