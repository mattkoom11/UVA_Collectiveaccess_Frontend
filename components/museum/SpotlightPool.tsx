"use client";

import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, type SpotLight } from "three";
import { FLAGSHIP_HEIGHT, HALL_HEIGHT } from "@/lib/hallLayout";
import type { LitSlot } from "@/lib/hallLighting";
import { useLightBudget } from "./useLightBudget";

const SPOT_INTENSITY = 45;
// Up in the ceiling grid, slightly toward the aisle and ahead of the garment
// (the old per-garment spotlight's offset, in world terms).
const SPOT_OFFSET: [number, number, number] = [0.4, HALL_HEIGHT - 0.3, -0.9];

/**
 * A fixed number of real spotlights, always mounted so the shaders' light
 * count never changes, moved onto the garments nearest the visitor.
 */
export default function SpotlightPool({ slots, count }: { slots: LitSlot[]; count: number }) {
  const lights = useLightBudget(slots, count);
  const spots = useRef<(SpotLight | null)[]>([]);
  const lastSlot = useRef<(LitSlot | null)[]>([]);
  const [targets] = useState(() => Array.from({ length: count }, () => new Object3D()));

  useLayoutEffect(() => {
    spots.current.forEach((spot, i) => {
      if (spot) spot.target = targets[i];
    });
  }, [targets]);

  useFrame(() => {
    lights.current.forEach((light, i) => {
      const spot = spots.current[i];
      if (!spot) return;
      spot.intensity = SPOT_INTENSITY * light.fade;
      if (light.slot && light.slot !== lastSlot.current[i]) {
        const [x, y, z] = light.slot.position;
        spot.position.set(x + SPOT_OFFSET[0], SPOT_OFFSET[1], z + SPOT_OFFSET[2]);
        targets[i].position.set(x, y + FLAGSHIP_HEIGHT * 0.55, z);
        spot.color.set(light.slot.color);
      }
      lastSlot.current[i] = light.slot;
    });
  });

  return (
    <>
      {targets.map((target, i) => (
        <Fragment key={i}>
          <primitive object={target} />
          <spotLight
            ref={(el: SpotLight | null) => {
              spots.current[i] = el;
            }}
            angle={0.42}
            penumbra={0.6}
            intensity={0}
            distance={12}
            decay={2}
          />
        </Fragment>
      ))}
    </>
  );
}
