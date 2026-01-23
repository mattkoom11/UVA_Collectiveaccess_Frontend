"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, useGLTF } from "@react-three/drei";
import { Suspense, useRef } from "react";
import { Group } from "three";
import DemoGarment from "./DemoGarment";
import { Garment } from "@/types/garment";
import { getPrimaryColor } from "@/lib/colorUtils";

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

// 3D Model component - loads GLTF/GLB models
function GarmentModel({ modelUrl }: { modelUrl: string }) {
  const groupRef = useRef<Group>(null);
  
  // Load the 3D model using useGLTF from drei
  // This supports GLTF/GLB formats commonly used for photogrammetry
  const { scene } = useGLTF(modelUrl);
  
  // Clone the scene to avoid mutating the original
  const clonedScene = scene.clone();
  
  return (
    <primitive 
      ref={groupRef}
      object={clonedScene} 
      scale={1} 
      position={[0, 0, 0]}
    />
  );
}

// Fallback placeholder when no model is available - uses enhanced demo garment
function PlaceholderModel({ garment }: { garment?: Garment }) {
  const garmentColor = getPrimaryColor(garment?.colors);
  return <DemoGarment position={[0, 0, 0]} rotation={false} color={garmentColor} scale={1.2} />;
}

export default function Garment3DViewer({ modelUrl, garmentId, garment }: Props) {
  return (
    <div className="w-full h-[600px] md:h-[800px] lg:h-[900px] bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 rounded-lg overflow-hidden border border-zinc-800 shadow-2xl relative">
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
        
        {/* Enhanced Lighting for better visibility */}
        <ambientLight intensity={0.6} />
        <spotLight
          position={[5, 5, 5]}
          angle={0.5}
          penumbra={0.5}
          intensity={1.2}
          castShadow
        />
        <spotLight
          position={[-5, 5, -5]}
          angle={0.5}
          penumbra={0.5}
          intensity={0.8}
          castShadow
        />
        <pointLight position={[-5, 3, -5]} intensity={0.4} color="#ffffff" />
        <pointLight position={[5, 3, -5]} intensity={0.4} color="#ffffff" />
        <pointLight position={[0, 8, 0]} intensity={0.3} color="#ffffff" />
        
        <Environment preset="studio" />
        
        {/* Ground plane for shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
        </mesh>
        
        {/* Model */}
        <Suspense fallback={<LoadingModel />}>
          {modelUrl ? (
            <GarmentModel modelUrl={modelUrl} />
          ) : (
            <PlaceholderModel garment={garment} />
          )}
        </Suspense>
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

