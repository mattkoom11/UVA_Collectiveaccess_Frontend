"use client";

import { useState, useEffect } from "react";
import { Accessibility, Contrast, Type } from "lucide-react";

export default function AccessibilityControls() {
  const [open, setOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");

  const applyAccessibilitySettings = (contrast: boolean, size: typeof fontSize) => {
    const root = document.documentElement;

    if (contrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    root.classList.remove("font-normal", "font-large", "font-xlarge");
    root.classList.add(`font-${size}`);
  };

  useEffect(() => {
    const savedContrast = localStorage.getItem("high-contrast") === "true";
    const savedFontSize = (localStorage.getItem("font-size") || "normal") as typeof fontSize;

    setHighContrast(savedContrast);
    setFontSize(savedFontSize);
    applyAccessibilitySettings(savedContrast, savedFontSize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem("high-contrast", String(newValue));
    applyAccessibilitySettings(newValue, fontSize);
  };

  const changeFontSize = (size: typeof fontSize) => {
    setFontSize(size);
    localStorage.setItem("font-size", size);
    applyAccessibilitySettings(highContrast, size);
  };

  const sizeButton = (size: typeof fontSize, label: string, textClass: string) => (
    <button
      type="button"
      onClick={() => changeFontSize(size)}
      aria-label={label}
      aria-pressed={fontSize === size}
      className={`w-8 h-8 ${textClass} transition-colors ${
        fontSize === size ? "bg-archive-surface-muted text-archive-fg" : "text-archive-muted hover:text-archive-fg"
      }`}
    >
      A
    </button>
  );

  // Collapsed to one button by default, so it doesn't sit over page content
  // (or the museum hall) until someone asks for it.
  return (
    <div className="fixed bottom-4 left-4 z-40 print-hide flex flex-col items-start gap-2">
      {open && (
        <div id="accessibility-panel" className="bg-archive-surface border border-archive-border p-3 space-y-2">
          <button
            type="button"
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            className="flex items-center gap-2 px-3 py-2 text-sm text-archive-muted-subtle hover:text-archive-fg hover:bg-archive-surface-muted transition-colors w-full"
          >
            <Contrast className="w-4 h-4" aria-hidden="true" />
            <span>High contrast</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1">
            <Type className="w-4 h-4 text-archive-muted" aria-hidden="true" />
            {sizeButton("normal", "Normal text size", "text-xs")}
            {sizeButton("large", "Large text size", "text-sm")}
            {sizeButton("xlarge", "Extra large text size", "text-base")}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Accessibility settings"
        aria-expanded={open}
        aria-controls="accessibility-panel"
        className="w-11 h-11 flex items-center justify-center bg-archive-surface/90 border border-archive-border text-archive-muted hover:text-archive-fg hover:border-archive-border-hover transition-colors"
      >
        <Accessibility className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}
