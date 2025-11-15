"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, useGLTF } from "@react-three/drei";
import { Suspense, useRef } from "react";
import { Group } from "three";

interface Props {
  modelUrl?: string;
  garmentId?: string;
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

// Fallback placeholder when no model is available
function PlaceholderModel() {
  return (
    <group>
      {/* Simple garment representation */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1, 1.5, 0.5]} />
        <meshStandardMaterial 
          color="#4a5568" 
          metalness={0.3}
          roughness={0.7}
          wireframe
        />
      </mesh>
      
      {/* Stand/hanger */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

export default function Garment3DViewer({ modelUrl, garmentId }: Props) {
  return (
    <div className="w-full h-[600px] md:h-[800px] bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={50} />
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={2}
          maxDistance={10}
          enableDamping
          dampingFactor={0.05}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <spotLight
          position={[5, 5, 5]}
          angle={0.5}
          penumbra={0.5}
          intensity={1}
          castShadow
        />
        <pointLight position={[-5, 3, -5]} intensity={0.3} color="#ffffff" />
        <pointLight position={[5, 3, -5]} intensity={0.3} color="#ffffff" />
        
        <Environment preset="studio" />
        
        {/* Model */}
        <Suspense fallback={<LoadingModel />}>
          {modelUrl ? (
            <GarmentModel modelUrl={modelUrl} />
          ) : (
            <PlaceholderModel />
          )}
        </Suspense>
      </Canvas>
      
      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-xs text-zinc-500 space-y-1">
        <p>Rotate: Click & Drag</p>
        <p>Zoom: Scroll</p>
      </div>
      
      {!modelUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-zinc-600 text-sm bg-zinc-950/50 px-4 py-2 rounded">
            <p>3D Model Placeholder</p>
            <p className="text-xs mt-1">Add photogrammetry model URL</p>
          </div>
        </div>
      )}
    </div>
  );
}

