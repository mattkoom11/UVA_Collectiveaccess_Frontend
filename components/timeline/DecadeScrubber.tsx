"use client";

import type { DecadeWeave } from "@/types/collectionWeave";
import { decadeLabel, garmentCount } from "@/lib/weave";

interface Props {
  decades: DecadeWeave[];
  index: number;
  onChange: (index: number) => void;
}

// A native range input over the decades, so arrows, Home, End and
// PageUp/PageDown work as standard, above a row of bars showing how many
// garments each decade holds (log-scaled so sparse decades stay visible).
export default function DecadeScrubber({ decades, index, onChange }: Props) {
  const max = Math.max(1, ...decades.map((d) => d.garments));
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
        max={decades.length - 1}
        step={1}
        value={index}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Decade"
        aria-valuetext={`${decadeLabel(current.decade)}, ${count} ${count === 1 ? "garment" : "garments"}`}
        className="w-full mt-2 accent-archive-fg"
      />
      <div className="relative h-5 mt-1 text-[10px] uppercase tracking-[0.2em] text-archive-muted" aria-hidden>
        {decades.map((d, i) =>
          d.decade % 50 === 0 ? (
            <span
              key={d.decade}
              className="absolute -translate-x-1/2"
              style={{ left: `${decades.length === 1 ? 50 : (i / (decades.length - 1)) * 100}%` }}
            >
              {d.decade}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}
