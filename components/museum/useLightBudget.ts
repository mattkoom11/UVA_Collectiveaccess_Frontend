"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { assignLights, pickLitSlots, type LitSlot } from "@/lib/hallLighting";

const REPICK_SECONDS = 0.2;
// Each way: a light moving to another garment takes ~0.4 s in all.
const FADE_SECONDS = 0.2;

export interface PooledLight {
  slot: LitSlot | null;
  fade: number; // 0..1, multiplies the light's intensity
}

/**
 * Keeps `count` pooled lights on the garments nearest the camera. Returns a
 * ref, updated every frame, for the caller to read in its own useFrame.
 */
export function useLightBudget(slots: LitSlot[], count: number): RefObject<PooledLight[]> {
  const lights = useRef<PooledLight[]>(Array.from({ length: count }, () => ({ slot: null, fade: 0 })));
  const wanted = useRef<(string | null)[]>(Array.from({ length: count }, () => null));
  const sinceRepick = useRef(Number.POSITIVE_INFINITY);
  const byId = useMemo(() => new Map(slots.map((s) => [s.id, s])), [slots]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    sinceRepick.current += dt;
    if (sinceRepick.current >= REPICK_SECONDS) {
      sinceRepick.current = 0;
      const { x, y, z } = state.camera.position;
      wanted.current = assignLights(wanted.current, pickLitSlots([x, y, z], slots, count));
    }
    const step = dt / FADE_SECONDS;
    lights.current.forEach((light, i) => {
      const id = wanted.current[i];
      if ((light.slot?.id ?? null) === id) {
        light.fade = id === null ? 0 : Math.min(1, light.fade + step);
      } else if (light.fade > 0) {
        light.fade = Math.max(0, light.fade - step);
      } else {
        light.slot = id === null ? null : (byId.get(id) ?? null);
      }
    });
  });

  return lights;
}
