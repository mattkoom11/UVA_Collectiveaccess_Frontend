"use client";

import { useEffect, useRef } from "react";
import type { DecadeWeave } from "@/types/collectionWeave";
import { barLayout, decadeLabel, garmentCount, tickLabels } from "@/lib/weave";
import { commitPosition, nudgePosition } from "@/lib/weaveBlend";

interface Props {
  decades: DecadeWeave[];
  position: number; // fractional decade index
  onChange: (position: number) => void;
  onCommit: (position: number) => void; // a whole decade to settle on
}

// A continuous native range input over the decades, so dragging blends
// neighbouring decades, above a row of bars showing how many garments each
// decade holds (log-scaled so sparse decades stay visible). Keys move whole
// decades: arrows by one, PageUp/PageDown by five, Home/End to the ends.
export default function DecadeScrubber({ decades, position, onChange, onCommit }: Props) {
  const max = Math.max(1, ...decades.map((d) => d.garments));
  const last = decades.length - 1;
  const inputRef = useRef<HTMLInputElement>(null);
  const lastWhole = useRef(Math.round(position));
  const commitRef = useRef(onCommit);

  useEffect(() => {
    commitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    if (Number.isInteger(position)) lastWhole.current = position;
  }, [position]);

  // The native change event fires when a value is committed: a pointer
  // release (even outside the input) or a screen reader's increment, which
  // moves the value by one native step. React's onChange fires on every
  // input instead, so commits are handled here.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onNativeChange = () => {
      const next = commitPosition(lastWhole.current, Number(el.value), Number(el.max));
      lastWhole.current = next;
      commitRef.current(next);
    };
    el.addEventListener("change", onNativeChange);
    return () => el.removeEventListener("change", onNativeChange);
  }, []);
  const index = Math.round(position);
  const current = decades[index];
  const count = garmentCount(current);

  return (
    <div className="w-full">
      {/* Bars and labels sit on a track inset by half the handle's width, so
          bar i is centred exactly where the handle sits at decade i. */}
      <div className="overflow-hidden" aria-hidden>
        <div className="relative h-10 mx-2">
          {decades.map((d, i) => {
            const { center, width } = barLayout(i, decades.length);
            return (
              <div
                key={d.decade}
                className={`absolute bottom-0 border-x border-transparent bg-clip-padding transition-colors ${i === index ? "bg-archive-fg" : "bg-archive-border"}`}
                style={{
                  left: `${center - width / 2}%`,
                  width: `${width}%`,
                  height: `${d.garments > 0 ? Math.max(8, (Math.log1p(d.garments) / Math.log1p(max)) * 100) : 2}%`,
                }}
              />
            );
          })}
        </div>
      </div>
      <input
        ref={inputRef}
        type="range"
        min={0}
        max={last}
        step={0.01}
        value={position}
        onChange={(e) => {
          if (e.nativeEvent.type === "change") return; // committed by the listener above
          onChange(Number(e.target.value));
        }}
        onKeyDown={(e) => {
          const next = nudgePosition(e.key, position, last);
          if (next === null) return;
          e.preventDefault();
          lastWhole.current = next;
          onChange(next);
        }}
        onPointerCancel={() => onCommit(commitPosition(lastWhole.current, position, last))}
        aria-label="Decade"
        aria-valuetext={`${decadeLabel(current.decade)}, ${count} ${count === 1 ? "garment" : "garments"}`}
        className="w-full mt-2 accent-archive-fg"
      />
      <div className="relative h-5 mt-1 mx-2 text-[10px] uppercase tracking-[0.2em] text-archive-muted" aria-hidden>
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
