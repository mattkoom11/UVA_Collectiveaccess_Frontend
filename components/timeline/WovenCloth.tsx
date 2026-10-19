"use client";

import { useEffect, useMemo, useRef } from "react";
import type { DecadeWeave } from "@/types/collectionWeave";
import {
  blendDecades,
  clothRows,
  initialState,
  stepToward,
  weaveTarget,
  type WeaveState,
  type WeaveTarget,
} from "@/lib/weaveBlend";
import { paintCloth } from "./paintCloth";

const FIRST_WEAVE_MS = 600;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

interface Props {
  decades: DecadeWeave[];
  position: number; // fractional decade index from the slider
  maxGarments: number;
  label: string; // text equivalent of the nearest decade
}

// The collection's cloth on a canvas. The first draw weaves top to bottom
// like a loom; after that the cloth eases toward whatever the slider points
// at, so scrubbing glides through the decades in between. Under reduced
// motion every change is drawn at once.
export default function WovenCloth({ decades, position, maxGarments, label }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<WeaveTarget | null>(null);
  const kickRef = useRef<(() => void) | null>(null);

  const target = useMemo(
    () => weaveTarget(blendDecades(decades, position), maxGarments),
    [decades, position, maxGarments],
  );

  // Declared before the setup effect so the target is in place on mount.
  useEffect(() => {
    targetRef.current = target;
    kickRef.current?.();
  }, [target]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const initialTarget = targetRef.current;
    if (!wrap || !canvas || !ctx || !initialTarget) return;

    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    let state: WeaveState = initialState(initialTarget);
    let size = { width: 0, height: 0 };
    let raf = 0;
    let settling = false;
    let weaving = false; // the first loom weave is running
    let visible = true; // on screen (the loop pauses while scrolled away)
    let pending = false; // a change arrived while off screen
    let lastFrame = 0;

    // Resizing a canvas clears it, so only resize when the size changed.
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
      size = { width, height };
    };

    const paintAll = () => paintCloth(ctx, state, size.width, size.height);

    const settle = (now: number) => {
      const goal = targetRef.current;
      if (!goal) return;
      if (!visible) {
        // Pause off screen; the IntersectionObserver resumes from here.
        settling = false;
        pending = true;
        return;
      }
      const result = stepToward(state, goal, (now - lastFrame) / 1000);
      lastFrame = now;
      state = result.state;
      paintAll();
      if (result.settled) {
        settling = false;
        return;
      }
      raf = requestAnimationFrame(settle);
    };

    kickRef.current = () => {
      const goal = targetRef.current;
      if (!goal) return;
      if (reduced) {
        state = initialState(goal);
        paintAll();
        return;
      }
      if (settling || weaving) return; // the running loop reads the new target itself
      if (!visible) {
        pending = true;
        return;
      }
      settling = true;
      lastFrame = performance.now();
      raf = requestAnimationFrame(settle);
    };

    layout();
    const { rows } = clothRows(size.width, size.height);
    if (reduced || rows === 0) {
      paintAll();
    } else {
      const start = performance.now();
      let drawn = 0;
      weaving = true;
      const weave = (now: number) => {
        const upTo = Math.min(rows, Math.ceil(((now - start) / FIRST_WEAVE_MS) * rows));
        paintCloth(ctx, state, size.width, size.height, drawn, upTo);
        drawn = upTo;
        if (drawn < rows) {
          raf = requestAnimationFrame(weave);
          return;
        }
        weaving = false;
        kickRef.current?.(); // catch up if the slider moved during the first weave
      };
      raf = requestAnimationFrame(weave);
    }

    // Repaint whenever the box really changes size (including from 0x0 to
    // its first real size), not on the observer's initial report.
    const observer = new ResizeObserver(() => {
      const { width, height } = wrap.getBoundingClientRect();
      if (width === size.width && height === size.height) return;
      layout();
      if (!settling && !weaving) {
        cancelAnimationFrame(raf);
        paintAll();
      }
    });
    observer.observe(wrap);

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && pending) {
        pending = false;
        kickRef.current?.();
      }
    });
    visibility.observe(wrap);

    // Moving the window to a screen with a different pixel density doesn't
    // resize the box, so watch the density itself and re-render sharply.
    let densityQuery: MediaQueryList | null = null;
    const onDensityChange = () => {
      layout();
      if (!settling && !weaving) paintAll();
      watchDensity();
    };
    const watchDensity = () => {
      densityQuery?.removeEventListener("change", onDensityChange);
      densityQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      densityQuery.addEventListener("change", onDensityChange);
    };
    watchDensity();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      visibility.disconnect();
      densityQuery?.removeEventListener("change", onDensityChange);
      kickRef.current = null;
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full aspect-[4/3] md:aspect-[3/1] bg-[#191715] border border-archive-border">
      <canvas ref={canvasRef} role="img" aria-label={label} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
