"use client";

import { useState } from "react";
import { pickHallQuality, type HallQuality } from "@/lib/hallLighting";

/** The hall's quality tier, decided once on mount. The hall only renders in the browser. */
export function useHallQuality(): HallQuality {
  const [quality] = useState(() =>
    pickHallQuality({
      coarsePointer: window.matchMedia("(pointer: coarse)").matches,
      viewportWidth: window.innerWidth,
      cores: navigator.hardwareConcurrency || undefined,
    }),
  );
  return quality;
}
