"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import {
  DEFAULT_AZIMUTH_DEG,
  DEFAULT_ELEVATION_DEG,
  MAX_ELEVATION_DEG,
  MIN_ELEVATION_DEG,
  clampElevation,
  normalizeDeg,
  pointerToAzimuth,
  type ConservatorLightState,
} from "@/lib/conservatorLight";

const KEY_STEP_DEG = 5;

interface Props {
  stateRef: RefObject<ConservatorLightState>;
}

// Top-down map of the scene: the square in the middle is the garment, "you"
// marks the camera's starting side, and the glowing handle is the light.
// The viewer resets the light state each time conservator mode turns on, so
// the DEFAULT_* constants are the correct initial values here.
export default function LightDial({ stateRef }: Props) {
  const dialRef = useRef<HTMLDivElement>(null);
  const armRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // The sweep advances inside the R3F frame loop and writes straight to
  // stateRef, so the dial follows it with its own rAF instead of React
  // state, which avoids re-rendering the viewer every frame.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const azimuth = stateRef.current.azimuthDeg;
      if (armRef.current) armRef.current.style.transform = `rotate(${azimuth}deg)`;
      dialRef.current?.setAttribute("aria-valuenow", String(Math.round(azimuth)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stateRef]);

  const markInteraction = () => {
    stateRef.current.lastInteractAtMs = performance.now();
  };

  const steerTo = (e: PointerEvent<HTMLDivElement>) => {
    const dial = dialRef.current;
    if (!dial) return;
    const rect = dial.getBoundingClientRect();
    const azimuth = pointerToAzimuth(
      e.clientX - (rect.left + rect.width / 2),
      e.clientY - (rect.top + rect.height / 2),
    );
    if (azimuth !== null) stateRef.current.azimuthDeg = azimuth;
    markInteraction();
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    steerTo(e);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) steerTo(e);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    markInteraction();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? KEY_STEP_DEG
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -KEY_STEP_DEG
          : 0;
    if (step === 0) return;
    e.preventDefault();
    stateRef.current.azimuthDeg = normalizeDeg(stateRef.current.azimuthDeg + step);
    markInteraction();
  };

  return (
    <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2 bg-black/60 backdrop-blur-sm border border-archive-border px-4 py-3 text-xs text-archive-muted-subtle">
      <p className="font-medium text-archive-fg">Light</p>
      <div
        ref={dialRef}
        role="slider"
        tabIndex={0}
        aria-label="Light direction around the garment"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={DEFAULT_AZIMUTH_DEG}
        className="relative w-24 h-24 rounded-full border border-archive-border cursor-grab active:cursor-grabbing touch-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-archive-accent"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <div
          className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-archive-fg"
          aria-hidden
        />
        <div
          ref={armRef}
          className="absolute inset-0"
          style={{ transform: `rotate(${DEFAULT_AZIMUTH_DEG}deg)` }}
          aria-hidden
        >
          <div className="absolute left-1/2 top-0 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_10px_rgba(253,230,138,0.9)]" />
        </div>
        <span
          className="absolute left-1/2 -bottom-5 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em]"
          aria-hidden
        >
          you
        </span>
      </div>
      <label className="mt-4 flex flex-col items-center gap-1">
        <span>Height</span>
        <input
          type="range"
          min={MIN_ELEVATION_DEG}
          max={MAX_ELEVATION_DEG}
          step={1}
          defaultValue={DEFAULT_ELEVATION_DEG}
          onChange={(e) => {
            stateRef.current.elevationDeg = clampElevation(Number(e.target.value));
          }}
          className="w-24"
        />
      </label>
    </div>
  );
}
