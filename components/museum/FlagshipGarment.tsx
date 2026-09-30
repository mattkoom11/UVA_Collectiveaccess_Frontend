"use client";

import { Suspense, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Object3D, SpotLight } from "three";
import ErrorBoundary from "@/components/garments/ErrorBoundary";
import { FLAGSHIP_HEIGHT, HALL_HEIGHT, fitToHeight, type FlagshipSlot } from "@/lib/hallLayout";
import { getDetailModelUrl, getPreviewModelUrl } from "@/lib/museum";

// Clicks that moved more than this many pixels were drags (looking around).
const CLICK_TOLERANCE_PX = 6;

function FittedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => scene.clone(true), [scene]);
  const { scale, offset } = useMemo(() => fitToHeight(new Box3().setFromObject(model), FLAGSHIP_HEIGHT), [model]);
  return <primitive object={model} scale={scale} position={offset} />;
}

// Stands in while the scan loads, or if it fails to load.
function Placeholder() {
  return (
    <mesh position={[0, FLAGSHIP_HEIGHT / 2, 0]}>
      <cylinderGeometry args={[0.18, 0.32, FLAGSHIP_HEIGHT, 16]} />
      <meshStandardMaterial color="#1e1e21" roughness={0.8} />
    </mesh>
  );
}

// A spotlight from the ceiling grid, aimed at the garment.
function GarmentSpotlight() {
  const light = useRef<SpotLight>(null);
  const [target] = useState(() => new Object3D());
  useLayoutEffect(() => {
    if (light.current) light.current.target = target;
  }, [target]);
  return (
    <>
      <primitive object={target} position={[0, FLAGSHIP_HEIGHT * 0.55, 0]} />
      <spotLight
        ref={light}
        position={[0.9, HALL_HEIGHT - 0.3, 0.4]}
        angle={0.42}
        penumbra={0.6}
        intensity={45}
        distance={12}
        decay={2}
        color="#fff6ea"
      />
    </>
  );
}

export default function FlagshipGarment({
  slot,
  inspecting,
  onSelect,
}: {
  slot: FlagshipSlot;
  inspecting: boolean;
  onSelect: (slot: FlagshipSlot) => void;
}) {
  const previewUrl = getPreviewModelUrl(slot.garment);
  const detailUrl = getDetailModelUrl(slot.garment);
  const facing = ((slot.garment.model3d_rotationY ?? 0) * Math.PI) / 180;

  if (!previewUrl) return null;

  const preview = <FittedModel url={previewUrl} />;
  const detail = inspecting && detailUrl && detailUrl !== previewUrl ? detailUrl : undefined;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > CLICK_TOLERANCE_PX) return;
    e.stopPropagation();
    onSelect(slot);
  };

  return (
    <group position={slot.position} rotation={[0, slot.rotationY, 0]}>
      <GarmentSpotlight />
      <group
        rotation={[0, facing, 0]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <ErrorBoundary fallback={<Placeholder />}>
          <Suspense fallback={<Placeholder />}>
            {/* The preview stays on screen until the detail file has loaded. */}
            {detail ? <Suspense fallback={preview}><FittedModel url={detail} /></Suspense> : preview}
          </Suspense>
        </ErrorBoundary>
      </group>
    </group>
  );
}
