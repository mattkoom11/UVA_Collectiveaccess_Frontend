"use client";

import { useState, useEffect } from "react";
import { Eye, Contrast, Type } from "lucide-react";

export default function AccessibilityControls() {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");

  useEffect(() => {
    // Load preferences from localStorage
    const savedContrast = localStorage.getItem("high-contrast") === "true";
    const savedFontSize = (localStorage.getItem("font-size") || "normal") as typeof fontSize;
    
    setHighContrast(savedContrast);
    setFontSize(savedFontSize);
    applyAccessibilitySettings(savedContrast, savedFontSize);
  }, []);

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

  return (
    <div className="fixed bottom-4 left-4 z-40 print-hide">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 space-y-2">
        <button
          onClick={toggleHighContrast}
          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors w-full"
          aria-label="Toggle high contrast mode"
        >
          <Contrast className="w-4 h-4" />
          <span>High Contrast</span>
        </button>
        
        <div className="flex items-center gap-2 px-3 py-2">
          <Type className="w-4 h-4 text-zinc-400" />
          <div className="flex gap-1">
            <button
              onClick={() => changeFontSize("normal")}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                fontSize === "normal"
                  ? "bg-zinc-800 text-zinc-200"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              aria-label="Normal font size"
            >
              A
            </button>
            <button
              onClick={() => changeFontSize("large")}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                fontSize === "large"
                  ? "bg-zinc-800 text-zinc-200"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              aria-label="Large font size"
            >
              A
            </button>
            <button
              onClick={() => changeFontSize("xlarge")}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                fontSize === "xlarge"
                  ? "bg-zinc-800 text-zinc-200"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              aria-label="Extra large font size"
            >
              A
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
