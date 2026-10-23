"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3 } from "three";
import ErrorBoundary from "@/components/garments/ErrorBoundary";
import { FLAGSHIP_HEIGHT, fitToHeight } from "@/lib/hallLayout";

const DEG = Math.PI / 180;
// The camera stands where the visitor does: on +z, looking back at the model.
const CAMERA_POSITION: [number, number, number] = [0, 1.1, 3.6];
const LOOK_AT_Y = FLAGSHIP_HEIGHT / 2;
const GUIDE_LENGTH = 1.1;

// Fitted exactly as FlagshipGarment's FittedModel is, so the preview turns
// about the same axis the runway does.
function FittedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => scene.clone(true), [scene]);
  const { scale, offset } = useMemo(() => fitToHeight(new Box3().setFromObject(model), FLAGSHIP_HEIGHT), [model]);
  return <primitive object={model} scale={scale} position={offset} />;
}

function Placeholder() {
  return (
    <mesh position={[0, FLAGSHIP_HEIGHT / 2, 0]}>
      <cylinderGeometry args={[0.18, 0.32, FLAGSHIP_HEIGHT, 16]} />
      <meshStandardMaterial color="#3a3a3f" roughness={0.8} wireframe />
    </mesh>
  );
}

// A floor line from the model's foot toward where its front should face.
function FacingGuide({ targetDeg }: { targetDeg: number }) {
  return (
    <group rotation={[0, targetDeg * DEG, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, GUIDE_LENGTH / 2]}>
        <planeGeometry args={[0.03, GUIDE_LENGTH]} />
        <meshBasicMaterial color="#e0b860" />
      </mesh>
    </group>
  );
}

/**
 * One pose of a garment: the scan turned `yawDeg` about its vertical axis,
 * seen from a fixed camera on +z. `targetDeg` draws where the front should
 * end up (0 head-on / 6:00, +45 runway / 4:30, -45 item page / 7:30).
 */
export default function OrientationPreview({
  url,
  yawDeg,
  targetDeg,
  label,
}: {
  url: string;
  yawDeg: number;
  targetDeg: number;
  label: string;
}) {
  return (
    <figure className="border border-archive-border bg-archive-surface/50">
      <div className="h-[360px] md:h-[440px]">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: CAMERA_POSITION, fov: 40 }}
          onCreated={({ camera }) => camera.lookAt(0, LOOK_AT_Y, 0)}
        >
          <color attach="background" args={["#141416"]} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[2, 4, 3]} intensity={1.4} />
          <directionalLight position={[-3, 2, -2]} intensity={0.4} />
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.4, 48]} />
            <meshStandardMaterial color="#2a2a2e" roughness={0.95} />
          </mesh>
          <FacingGuide targetDeg={targetDeg} />
          <group rotation={[0, yawDeg * DEG, 0]}>
            <ErrorBoundary fallback={<Placeholder />}>
              <Suspense fallback={<Placeholder />}>
                <FittedModel url={url} />
              </Suspense>
            </ErrorBoundary>
          </group>
        </Canvas>
      </div>
      <figcaption className="flex items-center justify-between px-4 py-3 border-t border-archive-border text-xs">
        <span className="uppercase tracking-[0.2em] text-archive-fg">{label}</span>
        <span className="text-archive-muted">yaw {yawDeg}°</span>
      </figcaption>
    </figure>
  );
}
