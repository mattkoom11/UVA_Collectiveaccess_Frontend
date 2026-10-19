"use client";

import { useEffect, useRef } from "react";
import type { DecadeWeave } from "@/types/collectionWeave";
import { clothPlan, decadeSummary } from "@/lib/weave";
import { paintRows } from "./paintCloth";

const REWEAVE_MS = 600;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

interface Props {
  decade: DecadeWeave;
  maxGarments: number;
}

// The decade's cloth on a canvas. A new decade re-weaves top to bottom
// like a loom (instantly under reduced motion); a resize redraws at once.
export default function WovenCloth({ decade, maxGarments }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasDrawn = useRef(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    let raf = 0;

    // Resizing a canvas clears it, so only resize when the size changed:
    // that keeps the previous decade visible while the new one weaves over it.
    const layout = () => {
      const { width, height } = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(width * dpr));
      const h = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return clothPlan(decade, maxGarments, width, height);
    };

    let plan = layout();
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;

    if (reduced || !hasDrawn.current) {
      paintRows(ctx, plan, 0, plan.rows);
    } else {
      const start = performance.now();
      let drawn = 0;
      const step = (now: number) => {
        const target = Math.min(plan.rows, Math.ceil(((now - start) / REWEAVE_MS) * plan.rows));
        paintRows(ctx, plan, drawn, target);
        drawn = target;
        if (drawn < plan.rows) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    hasDrawn.current = plan.rows > 0;

    // ResizeObserver reports the current size once on observe; skip that
    // first call so it doesn't cut the re-weave short.
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      cancelAnimationFrame(raf);
      plan = layout();
      paintRows(ctx, plan, 0, plan.rows);
      hasDrawn.current = plan.rows > 0;
    });
    observer.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [decade, maxGarments]);

  return (
    <div ref={wrapRef} className="relative w-full aspect-[4/3] md:aspect-[3/1] bg-[#191715] border border-archive-border">
      <canvas ref={canvasRef} role="img" aria-label={decadeSummary(decade)} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
