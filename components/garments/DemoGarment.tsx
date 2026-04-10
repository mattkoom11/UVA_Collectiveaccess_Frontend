"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import * as THREE from "three";

interface DemoGarmentProps {
  position?: [number, number, number];
  rotation?: boolean;
  color?: string;
  scale?: number;
}

/**
 * Demo garment model - a more sophisticated procedural dress/garment
 * This provides a better visual representation than simple boxes
 */
export default function DemoGarment({ 
  position = [0, 0, 0],
  rotation = false,
  color = "#6b7280",
  scale = 1
}: DemoGarmentProps) {
  const groupRef = useRef<Group>(null);
  const dressRef = useRef<Group>(null);

  // Optional slow rotation
  useFrame(() => {
    if (rotation && groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
    
    // Subtle fabric-like movement (groups can be rotated)
    if (dressRef.current) {
      const time = Date.now() * 0.001;
      dressRef.current.rotation.x = Math.sin(time * 0.5) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Main dress body - using a more garment-like shape */}
      <group ref={dressRef}>
        {/* Bodice - upper part */}
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.5, 0.4]} />
          <meshStandardMaterial 
            color={color}
            metalness={0.1}
            roughness={0.8}
          />
        </mesh>
        
        {/* Skirt - lower part, flared */}
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.6, 1.2, 8, 1, true]} />
          <meshStandardMaterial 
            color={color}
            metalness={0.1}
            roughness={0.8}
          />
        </mesh>
        
        {/* Sleeves */}
        <mesh position={[-0.5, 0.5, 0]} rotation={[0, 0, 0.3]} castShadow receiveShadow>
          <cylinderGeometry args={[0.15, 0.12, 0.4, 8]} />
          <meshStandardMaterial 
            color={color}
            metalness={0.1}
            roughness={0.8}
          />
        </mesh>
        <mesh position={[0.5, 0.5, 0]} rotation={[0, 0, -0.3]} castShadow receiveShadow>
          <cylinderGeometry args={[0.15, 0.12, 0.4, 8]} />
          <meshStandardMaterial 
            color={color}
            metalness={0.1}
            roughness={0.8}
          />
        </mesh>
        
        {/* Neckline detail */}
        <mesh position={[0, 0.75, 0.2]} castShadow receiveShadow>
          <torusGeometry args={[0.25, 0.02, 8, 16]} />
          <meshStandardMaterial 
            color={(() => {
              const baseColor = new THREE.Color(color);
              const white = new THREE.Color("#ffffff");
              return baseColor.lerp(white, 0.3);
            })()}
            metalness={0.2}
            roughness={0.7}
          />
        </mesh>
      </group>
      
      {/* Hanger/stand */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.3} />
      </mesh>
      
      {/* Base pedestal */}
      <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  );
}

