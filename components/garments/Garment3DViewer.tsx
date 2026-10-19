"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Box3, Group, MeshStandardMaterial, Vector3 } from "three";
import DemoGarment from "./DemoGarment";
import { Garment } from "@/types/garment";
import { getPrimaryColor } from "@/lib/colorUtils";
import ModelAnnotations from "./ModelAnnotations";
import { generateGarmentAnnotations } from "@/lib/annotations";
import ConservatorLighting from "./ConservatorLighting";
import LightDial from "./LightDial";
import { initialLightState, type ConservatorLightState } from "@/lib/conservatorLight";
import { ensureSmoothNormals } from "@/lib/meshNormals";
import { setSurfaceOnly, type MaterialStore } from "@/lib/surfaceMaterial";

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
function GarmentModel({
  modelUrl,
  rotationY = 0,
  surfaceOnly = false,
}: {
  modelUrl: string;
  rotationY?: number;
  surfaceOnly?: boolean;
}) {
  const groupRef = useRef<Group>(null);

  // Load the 3D model using useGLTF from drei
  // This supports GLTF/GLB formats commonly used for photogrammetry
  const { scene } = useGLTF(modelUrl);

  // Clone the scene to avoid mutating the original, and give the scan smooth
  // normals (the exports ship without any, which renders flat-shaded facets)
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    ensureSmoothNormals(clone);
    return clone;
  }, [scene]);

  // Conservator "Surface only": neutral clay in place of the photo texture,
  // whose baked-in capture lighting fights the raking light
  const clay = useMemo(() => new MeshStandardMaterial({ color: "#bdb5a6", roughness: 0.85 }), []);
  const originals = useRef<MaterialStore>(new Map());
  useEffect(() => {
    setSurfaceOnly(clonedScene, surfaceOnly, clay, originals.current);
  }, [clonedScene, surfaceOnly, clay]);
  useEffect(() => () => clay.dispose(), [clay]);

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

// Soft, even gallery-style lighting rather than moody spotlights
function GalleryLighting() {
  return (
    <>
      <ambientLight intensity={0.9} />
      <spotLight position={[5, 5, 5]} angle={0.6} penumbra={0.8} intensity={0.7} color="#fff8ec" castShadow />
      <spotLight position={[-5, 5, -5]} angle={0.6} penumbra={0.8} intensity={0.5} color="#fff8ec" castShadow />
      <pointLight position={[-5, 3, -5]} intensity={0.3} color="#fffaf0" />
      <pointLight position={[5, 3, -5]} intensity={0.3} color="#fffaf0" />
      <pointLight position={[0, 8, 0]} intensity={0.25} color="#fffaf0" />
    </>
  );
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

function toggleClass(on: boolean): string {
  return `px-3 py-2 text-xs uppercase tracking-[0.2em] border backdrop-blur-sm transition-colors ${
    on
      ? "bg-archive-fg text-archive-bg border-archive-fg"
      : "bg-black/60 text-archive-fg border-archive-border hover:border-archive-border-hover"
  }`;
}

export default function Garment3DViewer({ modelUrl, garmentId, garment }: Props) {
  const [conservator, setConservator] = useState(false);
  const [surfaceOnly, setSurfaceOnlyMode] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const lightState = useRef<ConservatorLightState>(initialLightState());

  const toggleConservator = () => {
    if (conservator) {
      // Leaving conservator mode always brings the photo texture back
      setSurfaceOnlyMode(false);
    } else {
      // Each visit starts from the default angle, matching LightDial's initial render
      lightState.current = initialLightState();
    }
    setConservator(!conservator);
  };

  return (
    <div
      className={`w-full h-[600px] md:h-[800px] lg:h-[900px] overflow-hidden border border-stone-300 shadow-2xl relative transition-colors duration-500 ${
        conservator ? "bg-neutral-950" : "bg-gradient-to-b from-stone-200 via-stone-100 to-stone-200"
      }`}
    >
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

        {conservator ? (
          <ConservatorLighting stateRef={lightState} reducedMotion={reducedMotion} />
        ) : (
          <GalleryLighting />
        )}

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
              surfaceOnly={conservator && surfaceOnly}
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

      {/* Conservator toggles — only for real scans */}
      {modelUrl && (
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
          <button type="button" aria-pressed={conservator} onClick={toggleConservator} className={toggleClass(conservator)}>
            Conservator
          </button>
          {conservator && (
            <button
              type="button"
              aria-pressed={surfaceOnly}
              onClick={() => setSurfaceOnlyMode(!surfaceOnly)}
              className={toggleClass(surfaceOnly)}
            >
              Surface only
            </button>
          )}
        </div>
      )}

      {modelUrl && conservator && <LightDial stateRef={lightState} />}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm border border-archive-border px-4 py-3 text-xs text-archive-muted-subtle space-y-1">
        <p className="font-medium text-archive-fg mb-2">Controls</p>
        <p>🖱️ Rotate: Click & Drag</p>
        <p>🔍 Zoom: Scroll Wheel</p>
        <p>↔️ Pan: Right-click & Drag</p>
      </div>

      {!modelUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-archive-muted text-sm bg-archive-bg/70 backdrop-blur-sm border border-archive-border px-6 py-4">
            <p className="font-medium text-archive-muted-subtle mb-1">3D Model Placeholder</p>
            <p className="text-xs mt-1 text-archive-muted">Add photogrammetry model URL to view the actual 3D scan</p>
          </div>
        </div>
      )}
    </div>
  );
}
