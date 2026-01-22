"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Environment, OrbitControls } from "@react-three/drei";
import { useRef, useState, useMemo } from "react";
import { Group } from "three";
import { Garment, Era, GarmentType, getEraFromDecade, getGarmentTypeFromWorkType } from "@/types/garment";
import { useRouter } from "next/navigation";
import { filterGarments } from "@/lib/garments";
import DemoGarment from "./DemoGarment";

interface Props {
  garments: Garment[];
}

// Animated model component that walks along the catwalk
function WalkingModel({ 
  position, 
  garment, 
  index,
  onGarmentClick,
  onHover
}: { 
  position: [number, number, number]; 
  garment: Garment;
  index: number;
  onGarmentClick: (id: string) => void;
  onHover: (garment: Garment | null) => void;
}) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  
  const handlePointerOver = () => {
    setHovered(true);
    onHover(garment);
  };
  
  const handlePointerOut = () => {
    setHovered(false);
    onHover(null);
  };
  
  // Animation: walk in an oval path like a real fashion show
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    const walkSpeed = 0.08; // Speed of walking (lower = slower) - very slow, elegant fashion show pace
    const spacing = 10; // Time spacing between models (seconds) - increased to match slower speed
    const pathLength = 16; // Total time to complete one full oval loop - very slow, deliberate pace
    
    // Stagger each model so they follow one after another
    const offsetTime = time - (index * spacing);
    const normalizedTime = ((offsetTime % pathLength) + pathLength) % pathLength;
    
    // Oval path parameters
    const runwayLength = 20; // Length of runway (z: -10 to 10)
    const sideOffset = 4; // How far to the side they go (x: 0 to -4)
    const startZ = -10; // Back of runway
    const endZ = 10; // Front of runway
    
    let x = 0;
    let z = 0;
    let rotationY = 0;
    
    // Define the oval path in 4 segments (adjusted for very slow, elegant pace)
    if (normalizedTime < 4) {
      // Segment 1: Walk forward down center runway (z: -10 to 10)
      const t = normalizedTime / 4;
      z = startZ + (endZ - startZ) * t;
      x = 0;
      rotationY = 0; // Face forward (positive z)
    } else if (normalizedTime < 6) {
      // Segment 2: Turn and walk to the left side (x: 0 to -4)
      const t = (normalizedTime - 4) / 2;
      z = endZ;
      x = -sideOffset * t;
      rotationY = -Math.PI / 2; // Face left
    } else if (normalizedTime < 10) {
      // Segment 3: Walk back along the side (z: 10 to -10)
      const t = (normalizedTime - 6) / 4;
      z = endZ - (endZ - startZ) * t;
      x = -sideOffset;
      rotationY = Math.PI; // Face backward (negative z)
    } else {
      // Segment 4: Turn and walk back to center (x: -4 to 0)
      const t = (normalizedTime - 10) / 6;
      z = startZ;
      x = -sideOffset * (1 - t);
      rotationY = Math.PI / 2; // Face right
    }
    
    // Apply position
    groupRef.current.position.x = x;
    groupRef.current.position.z = z;
    
    // Slight bobbing motion for walking
    groupRef.current.position.y = position[1] + Math.sin(time * 4 + index) * 0.08;
    
    // Smooth rotation to face direction
    groupRef.current.rotation.y = rotationY;
  });
  
  const handleClick = () => {
    onGarmentClick(garment.id);
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Simple placeholder figure - replace with actual model */}
      <mesh scale={hovered ? [1.1, 1.1, 1.1] : [1, 1, 1]}>
        {/* Head */}
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#fdbcb4" />
      </mesh>
      
      {/* Body/Torso */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[0.3, 0.4, 0.15]} />
        <meshStandardMaterial 
          color={garment.colors?.[0] || "#4a5568"} 
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.08, -0.7, 0]}>
        <boxGeometry args={[0.08, 0.3, 0.08]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      <mesh position={[0.08, -0.7, 0]}>
        <boxGeometry args={[0.08, 0.3, 0.08]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      
      {/* Garment indicator - will be replaced with 3D model */}
      <mesh position={[0, -0.35, 0]} scale={hovered ? [1.2, 1.2, 1.2] : [1, 1, 1]}>
        <boxGeometry args={[0.35, 0.5, 0.2]} />
        <meshStandardMaterial 
          color={garment.colors?.[1] || garment.colors?.[0] || "#718096"}
          wireframe={!hovered}
          transparent
          opacity={hovered ? 0.8 : 0.3}
        />
      </mesh>
      
      {/* Clickable area */}
      <mesh 
        position={[0, 0, 0]} 
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[1.5, 2, 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Hover label - shown in HTML overlay instead */}
    </group>
  );
}

// Catwalk/platform
function Catwalk() {
  return (
    <group>
      {/* Main runway platform - extended to cover the oval path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <planeGeometry args={[12, 24]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Side path for the oval (left side) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, -0.9, 0]}>
        <planeGeometry args={[4, 24]} />
        <meshStandardMaterial 
          color="#0f0f0f" 
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      
      {/* Runway border/edge lighting */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6, -0.89, 0]}>
        <planeGeometry args={[0.2, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, -0.89, 0]}>
        <planeGeometry args={[0.2, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Background backdrop */}
      <mesh position={[0, 2, -10]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
    </group>
  );
}

// Lighting setup
function RunwayLighting() {
  return (
    <>
      {/* Main spotlight */}
      <spotLight
        position={[0, 10, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={2}
        castShadow
      />
      
      {/* Ambient fill */}
      <ambientLight intensity={0.3} />
      
      {/* Rim lights */}
      <pointLight position={[-10, 5, 0]} intensity={0.5} color="#ffffff" />
      <pointLight position={[10, 5, 0]} intensity={0.5} color="#ffffff" />
    </>
  );
}

export default function Runway3D({ garments }: Props) {
  const router = useRouter();
  const [hoveredGarment, setHoveredGarment] = useState<Garment | null>(null);
  const [selectedEra, setSelectedEra] = useState<Era | "all">("all");
  const [selectedType, setSelectedType] = useState<GarmentType | "all">("all");
  
  // Filter garments based on selected filters
  const filteredGarments = useMemo(() => {
    const filters: { era?: Era; type?: GarmentType } = {};
    if (selectedEra !== "all") filters.era = selectedEra;
    if (selectedType !== "all") filters.type = selectedType;
    
    return filters.era || filters.type ? filterGarments(garments, filters) : garments;
  }, [garments, selectedEra, selectedType]);
  
  // Select a handful of best garments for the runway (max 6)
  const featuredGarments = filteredGarments.slice(0, 6);
  
  // Initial positions - all start at the back of the runway
  // They'll follow the oval path from here
  const modelPositions: [number, number, number][] = featuredGarments.map((_, i) => {
    return [0, -0.5, -10]; // All start at the back center
  });

  const handleGarmentClick = (id: string) => {
    // Navigate to garment detail view
    const garment = garments.find(g => g.id === id);
    if (garment) {
      router.push(`/garments/${garment.slug}`);
    }
  };

  return (
    <div className="w-full h-[600px] md:h-[800px] bg-black relative">
      {/* Filter bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap gap-3">
        <div className="bg-black/80 backdrop-blur-sm border border-zinc-700 px-4 py-2 rounded">
          <select
            value={selectedEra}
            onChange={(e) => setSelectedEra(e.target.value as Era | "all")}
            className="bg-transparent text-xs text-zinc-200 uppercase tracking-[0.1em] font-light focus:outline-none cursor-pointer"
          >
            <option value="all">All Eras</option>
            <option value="pre-1920">Pre-1920</option>
            <option value="1920-1950">1920–1950</option>
            <option value="1950-1980">1950–1980</option>
            <option value="1980+">1980+</option>
          </select>
        </div>
        
        <div className="bg-black/80 backdrop-blur-sm border border-zinc-700 px-4 py-2 rounded">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as GarmentType | "all")}
            className="bg-transparent text-xs text-zinc-200 uppercase tracking-[0.1em] font-light focus:outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="dress">Dress</option>
            <option value="coat">Coat</option>
            <option value="jacket">Jacket</option>
            <option value="suit">Suit</option>
            <option value="accessory">Accessory</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        {filteredGarments.length !== garments.length && (
          <div className="bg-black/80 backdrop-blur-sm border border-zinc-600 px-4 py-2 rounded flex items-center">
            <span className="text-xs text-zinc-200 uppercase tracking-[0.1em] font-light">
              {filteredGarments.length} {filteredGarments.length === 1 ? 'garment' : 'garments'}
            </span>
          </div>
        )}
      </div>
      
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 3, 12]} fov={50} />
        <OrbitControls 
          enableZoom={true} 
          enablePan={false}
          minDistance={8}
          maxDistance={20}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
        <RunwayLighting />
        <Environment preset="night" />
        
        {/* Catwalk platform */}
        <Catwalk />
        
        {/* Models with garments */}
        {featuredGarments.map((garment, i) => (
          <WalkingModel
            key={garment.id}
            garment={garment}
            position={modelPositions[i]}
            index={i}
            onGarmentClick={handleGarmentClick}
            onHover={setHoveredGarment}
          />
        ))}
      </Canvas>
      
      {/* Hover label overlay */}
      {hoveredGarment && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 px-4 py-2 rounded border border-zinc-700 pointer-events-none">
          <p className="text-xs text-zinc-200 font-medium">{hoveredGarment.label}</p>
          <p className="text-[0.65rem] text-zinc-400 mt-1">
            Click to view details
          </p>
        </div>
      )}
      
      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 text-xs text-zinc-400 space-y-1">
        <p>Click and drag to rotate • Scroll to zoom</p>
        <p className="text-zinc-500">Hover over models • Click to explore</p>
      </div>
    </div>
  );
}

