"use client";

import type { DecadeWeave } from "@/types/collectionWeave";
import { decadeLabel, garmentCount, tickLabels } from "@/lib/weave";
import { nudgePosition } from "@/lib/weaveBlend";

interface Props {
  decades: DecadeWeave[];
  position: number; // fractional decade index
  onChange: (position: number) => void;
  onRelease: () => void; // pointer let go: the parent settles on the nearest decade
}

// A continuous native range input over the decades, so dragging blends
// neighbouring decades, above a row of bars showing how many garments each
// decade holds (log-scaled so sparse decades stay visible). Keys move whole
// decades: arrows by one, PageUp/PageDown by five, Home/End to the ends.
export default function DecadeScrubber({ decades, position, onChange, onRelease }: Props) {
  const max = Math.max(1, ...decades.map((d) => d.garments));
  const last = decades.length - 1;
  const index = Math.round(position);
  const current = decades[index];
  const count = garmentCount(current);

  return (
    <div className="w-full">
      <div className="flex items-end gap-px h-10" aria-hidden>
        {decades.map((d, i) => (
          <div
            key={d.decade}
            className={`flex-1 transition-colors ${i === index ? "bg-archive-fg" : "bg-archive-border"}`}
            style={{ height: `${d.garments > 0 ? Math.max(8, (Math.log1p(d.garments) / Math.log1p(max)) * 100) : 2}%` }}
          />
        ))}
      </div>
      <input
        type="range"
        min={0}
        max={last}
        step={0.01}
        value={position}
        onChange={(e) => onChange(Number(e.target.value))}
        onKeyDown={(e) => {
          const next = nudgePosition(e.key, position, last);
          if (next === null) return;
          e.preventDefault();
          onChange(next);
        }}
        onPointerUp={onRelease}
        onPointerCancel={onRelease}
        aria-label="Decade"
        aria-valuetext={`${decadeLabel(current.decade)}, ${count} ${count === 1 ? "garment" : "garments"}`}
        className="w-full mt-2 accent-archive-fg"
      />
      <div className="relative h-5 mt-1 text-[10px] uppercase tracking-[0.2em] text-archive-muted" aria-hidden>
        {tickLabels(decades).map((t) => (
          <span
            key={t.decade}
            className={`absolute ${t.align === "center" ? "-translate-x-1/2" : t.align === "end" ? "-translate-x-full" : ""}`}
            style={{ left: `${t.left}%` }}
          >
            {t.decade}
          </span>
        ))}
      </div>
    </div>
  );
}
