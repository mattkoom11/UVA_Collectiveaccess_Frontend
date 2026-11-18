"use client";

import { Suspense, useEffect, useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3 } from "three";
import ErrorBoundary from "@/components/garments/ErrorBoundary";
import { FLAGSHIP_HEIGHT, fitToHeight, type FlagshipSlot } from "@/lib/hallLayout";
import { getDetailModelUrl, getPreviewModelUrl } from "@/lib/museum";

// Clicks that moved more than this many pixels were drags (looking around).
const CLICK_TOLERANCE_PX = 6;

function FittedModel({ url, onSettled }: { url: string; onSettled?: () => void }) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => scene.clone(true), [scene]);
  const { scale, offset } = useMemo(() => fitToHeight(new Box3().setFromObject(model), FLAGSHIP_HEIGHT), [model]);
  // Mounting means Suspense let go: the file is downloaded and parsed.
  useEffect(() => onSettled?.(), [onSettled]);
  return <primitive object={model} scale={scale} position={offset} />;
}

// A scan that failed to load is settled too: the hall shouldn't wait on it forever.
function FailedModel({ onSettled }: { onSettled?: () => void }) {
  useEffect(() => onSettled?.(), [onSettled]);
  return <Placeholder />;
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

export default function FlagshipGarment({
  slot,
  inspecting,
  onSelect,
  onPreviewSettled,
}: {
  slot: FlagshipSlot;
  inspecting: boolean;
  onSelect: (slot: FlagshipSlot) => void;
  /** Called once the runway preview has loaded, or has failed to. */
  onPreviewSettled?: () => void;
}) {
  const previewUrl = getPreviewModelUrl(slot.garment);
  const detailUrl = getDetailModelUrl(slot.garment);
  const facing = ((slot.garment.model3d_rotationY ?? 0) * Math.PI) / 180;

  if (!previewUrl) return null;

  const preview = <FittedModel url={previewUrl} onSettled={onPreviewSettled} />;
  const detail = inspecting && detailUrl && detailUrl !== previewUrl ? detailUrl : undefined;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > CLICK_TOLERANCE_PX) return;
    e.stopPropagation();
    onSelect(slot);
  };

  return (
    <group position={slot.position} rotation={[0, slot.rotationY, 0]}>
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
        <ErrorBoundary fallback={<FailedModel onSettled={onPreviewSettled} />}>
          <Suspense fallback={<Placeholder />}>
            {/* The preview stays on screen until the detail file has loaded. */}
            {detail ? <Suspense fallback={preview}><FittedModel url={detail} /></Suspense> : preview}
          </Suspense>
        </ErrorBoundary>
      </group>
    </group>
  );
}
