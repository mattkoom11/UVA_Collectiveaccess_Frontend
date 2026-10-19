"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import type { DirectionalLight } from "three";
import {
  LIGHT_RADIUS,
  SWEEP_PERIOD_SEC,
  advanceAzimuth,
  lightPosition,
  shouldSweep,
  type ConservatorLightState,
} from "@/lib/conservatorLight";

interface Props {
  stateRef: RefObject<ConservatorLightState>;
  reducedMotion: boolean;
}

// One low, hard light grazing across the garment, the way conservators
// inspect textiles: folds, seams, puckering and repairs throw shadows that
// even gallery lighting washes out. Angle state lives in a ref shared with
// LightDial so the sweep never re-renders React.
export default function ConservatorLighting({ stateRef, reducedMotion }: Props) {
  const lightRef = useRef<DirectionalLight>(null);

  useFrame((_, delta) => {
    const state = stateRef.current;
    if (shouldSweep(performance.now(), state.lastInteractAtMs, reducedMotion)) {
      state.azimuthDeg = advanceAzimuth(state.azimuthDeg, delta, SWEEP_PERIOD_SEC);
    }
    lightRef.current?.position.set(...lightPosition(state.azimuthDeg, state.elevationDeg, LIGHT_RADIUS));
  });

  return (
    <>
      <ambientLight intensity={0.05} />
      <directionalLight
        ref={lightRef}
        intensity={2.2}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
    </>
  );
}
