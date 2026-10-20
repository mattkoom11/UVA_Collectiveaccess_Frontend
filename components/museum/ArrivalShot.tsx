"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { ARRIVAL_SECONDS, arrivalPose } from "@/lib/arrivalShot";
import type { HallLayout } from "@/lib/hallLayout";

const SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

/**
 * Glides the camera into the hall, then calls onDone. Any input jumps to the
 * last frame, so a skipped shot ends in exactly the same pose.
 */
export default function ArrivalShot({ start, onDone }: { start: HallLayout["start"]; onDone: () => void }) {
  const t = useRef(0);
  const done = useRef(false);
  const [look] = useState(() => new Vector3());

  useEffect(() => {
    const skip = () => {
      t.current = 1;
    };
    SKIP_EVENTS.forEach((type) => window.addEventListener(type, skip, { passive: true }));
    return () => SKIP_EVENTS.forEach((type) => window.removeEventListener(type, skip));
  }, []);

  useFrame((state, delta) => {
    if (done.current) return;
    // Capped so a long first frame (shader compiles) doesn't jump the shot ahead.
    t.current = Math.min(1, t.current + Math.min(delta, 0.1) / ARRIVAL_SECONDS);
    const { position, lookAt } = arrivalPose(t.current, start);
    state.camera.position.set(...position);
    state.camera.lookAt(look.set(...lookAt));
    if (t.current >= 1) {
      done.current = true;
      onDone();
    }
  });

  return null;
}
