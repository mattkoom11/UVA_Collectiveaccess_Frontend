"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import { Box3, Group, Vector3 } from "three";
import DemoGarment from "./DemoGarment";
import { Garment } from "@/types/garment";
import { getPrimaryColor } from "@/lib/colorUtils";
import ModelAnnotations from "./ModelAnnotations";
import { generateGarmentAnnotations } from "@/lib/annotations";

interface Props {
  modelUrl?: string;
  garmentId?: string;
  garment?: Garment;
}

// Loading placeholder
function LoadingModel() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#2d3748" wireframe />
    </mesh>
  );
}

// Target height (world units) models are normalized to. The viewer's camera
// and OrbitControls distances are tuned for objects roughly this tall.
const TARGET_MODEL_HEIGHT = 2;
// World Y of the ground plane below — the model's base is placed here so it
// appears to stand on it rather than float or clip through.
const GROUND_Y = -1;
// Rather than starting dead-on to the camera, garments open on a 3/4 turn —
// facing 45° toward the camera's left — on top of each garment's own
// calibrated front-facing offset (model3d_rotationY).
const VIEWER_INITIAL_ANGLE_OFFSET_DEGREES = -45;

// 3D Model component - loads GLTF/GLB models
function GarmentModel({ modelUrl, rotationY = 0 }: { modelUrl: string; rotationY?: number }) {
  const groupRef = useRef<Group>(null);

  // Load the 3D model using useGLTF from drei
  // This supports GLTF/GLB formats commonly used for photogrammetry
  const { scene } = useGLTF(modelUrl);

  // Clone the scene to avoid mutating the original
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Photogrammetry exports vary wildly in export scale/origin (a raw scan
  // may be tens of units across with an arbitrary pivot). Auto-fit every
  // model to a consistent height and center it on the ground plane so the
  // fixed camera/orbit-control distances above always frame it, regardless
  // of the source software's units.
  const { scale, position } = useMemo(() => {
    const box = new Box3().setFromObject(clonedScene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const s = size.y > 0 ? TARGET_MODEL_HEIGHT / size.y : 1;

    return {
      scale: s,
      position: [
        -center.x * s,
        GROUND_Y - box.min.y * s,
        -center.z * s,
      ] as [number, number, number],
    };
  }, [clonedScene]);

  // Wrapping group: the rotation must apply to the already-centered mesh, not
  // compose with the recentering translation itself (see RunwayGarmentMesh in
  // Runway3D.tsx for the same pattern and why order matters here).
  return (
    <group rotation={[0, rotationY, 0]}>
      <primitive
        ref={groupRef}
        object={clonedScene}
        scale={scale}
        position={position}
      />
    </group>
  );
}

// Fallback placeholder when no model is available - uses enhanced demo garment
function PlaceholderModel({ garment }: { garment?: Garment }) {
  const garmentColor = getPrimaryColor(garment?.colors);
  return <DemoGarment position={[0, 0, 0]} rotation={false} color={garmentColor} scale={1.2} />;
}

export default function Garment3DViewer({ modelUrl, garmentId, garment }: Props) {
  return (
    <div className="w-full h-[600px] md:h-[800px] lg:h-[900px] bg-gradient-to-b from-stone-200 via-stone-100 to-stone-200 rounded-lg overflow-hidden border border-stone-300 shadow-2xl relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={50} />
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={1.5}
          maxDistance={12}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          enableDamping
          dampingFactor={0.05}
        />

        {/* Soft, even gallery-style lighting rather than moody spotlights */}
        <ambientLight intensity={0.9} />
        <spotLight
          position={[5, 5, 5]}
          angle={0.6}
          penumbra={0.8}
          intensity={0.7}
          color="#fff8ec"
          castShadow
        />
        <spotLight
          position={[-5, 5, -5]}
          angle={0.6}
          penumbra={0.8}
          intensity={0.5}
          color="#fff8ec"
          castShadow
        />
        <pointLight position={[-5, 3, -5]} intensity={0.3} color="#fffaf0" />
        <pointLight position={[5, 3, -5]} intensity={0.3} color="#fffaf0" />
        <pointLight position={[0, 8, 0]} intensity={0.25} color="#fffaf0" />

        {/* Ground plane — light gallery-floor tone instead of a dark stage */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#d8d2c4" roughness={0.9} />
        </mesh>
        
        {/* Model */}
        <Suspense fallback={<LoadingModel />}>
          {modelUrl ? (
            <GarmentModel
              modelUrl={modelUrl}
              rotationY={
                (((garment?.model3d_rotationY ?? 0) + VIEWER_INITIAL_ANGLE_OFFSET_DEGREES) * Math.PI) /
                180
              }
            />
          ) : (
            <PlaceholderModel garment={garment} />
          )}
        </Suspense>

        {/* Annotations */}
        {garment && (
          <ModelAnnotations
            annotations={generateGarmentAnnotations(garment)}
          />
        )}
      </Canvas>
      
      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm border border-zinc-800 rounded-lg px-4 py-3 text-xs text-zinc-300 space-y-1">
        <p className="font-medium text-zinc-200 mb-2">Controls</p>
        <p>🖱️ Rotate: Click & Drag</p>
        <p>🔍 Zoom: Scroll Wheel</p>
        <p>↔️ Pan: Right-click & Drag</p>
      </div>
      
      {!modelUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-zinc-500 text-sm bg-zinc-950/70 backdrop-blur-sm border border-zinc-800 px-6 py-4 rounded-lg">
            <p className="font-medium text-zinc-300 mb-1">3D Model Placeholder</p>
            <p className="text-xs mt-1 text-zinc-500">Add photogrammetry model URL to view the actual 3D scan</p>
          </div>
        </div>
      )}
    </div>
  );
}

