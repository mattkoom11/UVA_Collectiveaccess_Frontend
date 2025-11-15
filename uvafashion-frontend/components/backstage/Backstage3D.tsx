"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls, useGLTF, Environment } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect } from "react";
import { Group, Vector3, Raycaster, Mesh } from "three";
import * as THREE from "three";

interface Backstage3DProps {
  onGarmentSelected?: (garmentId: string) => void;
  modelUrl?: string;
  garmentId?: string;
  garmentPositions?: Array<[number, number, number]>;
}

// First-person camera controls with WASD movement and mouse look
function FirstPersonControls() {
  const { camera, gl } = useThree();
  const moveForward = useRef(false);
  const moveBackward = useRef(false);
  const moveLeft = useRef(false);
  const moveRight = useRef(false);
  const velocity = useRef(new Vector3());
  const direction = useRef(new Vector3());
  const euler = useRef(new THREE.Euler(0, Math.PI, 0, "YXZ"));
  const isLocked = useRef(false);

  // Initialize camera position (entrance of backstage)
  // Start at (0, 1.6, 2) looking toward (0, 1.6, -10)
  useEffect(() => {
    camera.position.set(0, 1.6, 2);
    // Look at point (0, 1.6, -10)
    const lookAt = new Vector3(0, 1.6, -10);
    camera.lookAt(lookAt);
    euler.current.setFromQuaternion(camera.quaternion);
  }, [camera]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          moveForward.current = true;
          break;
        case "KeyS":
          moveBackward.current = true;
          break;
        case "KeyA":
          moveLeft.current = true;
          break;
        case "KeyD":
          moveRight.current = true;
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          moveForward.current = false;
          break;
        case "KeyS":
          moveBackward.current = false;
          break;
        case "KeyA":
          moveLeft.current = false;
          break;
        case "KeyD":
          moveRight.current = false;
          break;
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isLocked.current) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y -= movementX * 0.002;
      euler.current.x -= movementY * 0.002;
      euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };

    const onPointerLockChange = () => {
      isLocked.current = document.pointerLockElement === gl.domElement;
    };

    const onClick = () => {
      if (!isLocked.current) {
        gl.domElement.requestPointerLock();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    gl.domElement.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      gl.domElement.removeEventListener("click", onClick);
      document.exitPointerLock();
    };
  }, [camera, gl]);

  useFrame((state, delta) => {
    const speed = 2.0; // Walking speed
    const moveSpeed = speed * delta;

    velocity.current.x -= velocity.current.x * 10.0 * delta;
    velocity.current.z -= velocity.current.z * 10.0 * delta;

    direction.current.z = Number(moveForward.current) - Number(moveBackward.current);
    direction.current.x = Number(moveRight.current) - Number(moveLeft.current);
    direction.current.normalize();

    if (moveForward.current || moveBackward.current) {
      velocity.current.z -= direction.current.z * moveSpeed;
    }
    if (moveLeft.current || moveRight.current) {
      velocity.current.x -= direction.current.x * moveSpeed;
    }

    // Apply movement
    const move = new Vector3();
    move.set(velocity.current.x, 0, velocity.current.z);
    move.applyQuaternion(camera.quaternion);
    camera.position.add(move);

    // Keep camera at eye level
    camera.position.y = 1.6;
  });

  return null;
}

// Pedestal component for garments
function Pedestal({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <cylinderGeometry args={[0.6, 0.6, 0.3, 32]} />
      <meshStandardMaterial color="#3a3a3a" roughness={0.7} metalness={0.3} />
    </mesh>
  );
}

// Backstage room structure - long shallow room
function BackstageRoom({ garmentPositions }: { garmentPositions: Array<[number, number, number]> }) {
  return (
    <group>
      {/* Floor - centered at (0, 0, -8), 12 units wide, 20 units deep */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, -8]} 
        receiveShadow
      >
        <planeGeometry args={[12, 20]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
      </mesh>

      {/* Left Wall - PlaneGeometry(20, 4) at x = -6, y = 2, z = -8, rotated +90° on Y */}
      <mesh 
        rotation={[0, Math.PI / 2, 0]} 
        position={[-6, 2, -8]} 
        receiveShadow
      >
        <planeGeometry args={[20, 4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      {/* Right Wall - same but x = +6, rotated -90° on Y */}
      <mesh 
        rotation={[0, -Math.PI / 2, 0]} 
        position={[6, 2, -8]} 
        receiveShadow
      >
        <planeGeometry args={[20, 4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      {/* Back Wall - PlaneGeometry(12, 4) at (0, 2, -18), facing the camera */}
      <mesh 
        rotation={[0, 0, 0]} 
        position={[0, 2, -18]} 
        receiveShadow
      >
        <planeGeometry args={[12, 4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      {/* Ceiling */}
      <mesh 
        rotation={[Math.PI / 2, 0, 0]} 
        position={[0, 4, -8]} 
        receiveShadow
      >
        <planeGeometry args={[12, 20]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>

      {/* Curtains/Partitions - narrow planes slightly offset from walls */}
      {/* Left curtain */}
      <mesh 
        rotation={[0, Math.PI / 2, 0]} 
        position={[-5.5, 2, -8]} 
        receiveShadow
      >
        <planeGeometry args={[20, 3.5]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.95} />
      </mesh>

      {/* Right curtain */}
      <mesh 
        rotation={[0, -Math.PI / 2, 0]} 
        position={[5.5, 2, -8]} 
        receiveShadow
      >
        <planeGeometry args={[20, 3.5]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.95} />
      </mesh>

      {/* Pedestals for each garment */}
      {garmentPositions.map((pos, index) => (
        <Pedestal 
          key={index} 
          position={[pos[0], 0.15, pos[2]]} 
        />
      ))}
    </group>
  );
}

// Loading placeholder for garment
function GarmentLoading({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4a5568" wireframe />
      </mesh>
    </group>
  );
}

// Garment model with rotation animation
function GarmentModel({
  modelUrl,
  onGarmentClick,
  position,
}: {
  modelUrl: string;
  onGarmentClick: () => void;
  position: [number, number, number];
}) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(modelUrl);
  const clonedScene = scene.clone();

  // Rotate the garment slowly
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef} position={position} onClick={onGarmentClick}>
      <primitive object={clonedScene} scale={1} />
    </group>
  );
}

// Placeholder garment when no model is available
function PlaceholderGarment({ 
  onGarmentClick, 
  position 
}: { 
  onGarmentClick: () => void;
  position: [number, number, number];
}) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef} position={position} onClick={onGarmentClick}>
      {/* Simple dress shape as placeholder */}
      <mesh castShadow>
        <coneGeometry args={[0.5, 1.5, 8]} />
        <meshStandardMaterial color="#4a5568" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#4a5568" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  );
}

// Spotlight with target for each garment
function GarmentSpotlight({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);
  
  useFrame(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  });
  
  return (
    <group>
      <object3D ref={targetRef} position={position} />
      <spotLight
        ref={lightRef}
        position={[position[0], 3, position[2] + 1]}
        angle={0.4}
        penumbra={0.5}
        intensity={1.5}
        castShadow
      />
    </group>
  );
}

// Lighting setup
function BackstageLighting({ garmentPositions }: { garmentPositions: Array<[number, number, number]> }) {
  return (
    <>
      {/* Ambient light - soft fill, low intensity */}
      <ambientLight intensity={0.2} />

      {/* One spotlight per garment, overhead */}
      {garmentPositions.map((pos, index) => (
        <GarmentSpotlight key={index} position={pos} />
      ))}

      {/* Overall "backstage wash" light near the entrance */}
      <spotLight
        position={[0, 3, 3]}
        angle={0.8}
        penumbra={0.6}
        intensity={0.6}
        castShadow
      />
    </>
  );
}

// Raycasting for clicking garments
function ClickHandler({
  onGarmentClick,
  garmentId,
}: {
  onGarmentClick?: (garmentId: string) => void;
  garmentId?: string;
}) {
  const { camera, scene, gl } = useThree();
  const raycaster = useRef(new Raycaster());
  const mouse = useRef(new Vector3());

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);

      const intersects = raycaster.current.intersectObjects(scene.children, true);

      // Check if we clicked on a garment (look for objects near the pedestal)
      for (const intersect of intersects) {
        const object = intersect.object;
        if (object.position.y > 1 && object.position.y < 2.5) {
          // Likely the garment
          if (onGarmentClick && garmentId) {
            onGarmentClick(garmentId);
          }
          break;
        }
      }
    };

    gl.domElement.addEventListener("click", handleClick);

    return () => {
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [camera, scene, gl, onGarmentClick, garmentId]);

  return null;
}

export default function Backstage3D({
  onGarmentSelected,
  modelUrl = "/models/dress.glb",
  garmentId = "uva-dress-001",
  garmentPositions = [[0, 0.45, -8]], // Default: one garment at center, on pedestal
}: Backstage3DProps) {
  const [showUI, setShowUI] = useState(true);
  const [useFirstPerson, setUseFirstPerson] = useState(true);

  useEffect(() => {
    // Fade out UI after 5 seconds
    const timer = setTimeout(() => {
      setShowUI(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleGarmentClick = () => {
    if (onGarmentSelected) {
      onGarmentSelected(garmentId);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black">
      <Canvas shadows camera={{ position: [0, 1.6, 2], fov: 75 }}>
        <PerspectiveCamera makeDefault position={[0, 1.6, 2]} fov={75} />
        
        {useFirstPerson ? (
          <FirstPersonControls />
        ) : (
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            minDistance={2}
            maxDistance={15}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
            target={[0, 1.6, -8]}
          />
        )}

        <BackstageLighting garmentPositions={garmentPositions} />
        <Environment preset="warehouse" />

        <BackstageRoom garmentPositions={garmentPositions} />

        {/* Render garments at specified positions */}
        {garmentPositions.map((position, index) => (
          <Suspense key={index} fallback={<GarmentLoading position={position} />}>
            {modelUrl ? (
              <GarmentModel 
                modelUrl={modelUrl} 
                onGarmentClick={handleGarmentClick} 
                position={position}
              />
            ) : (
              <PlaceholderGarment 
                onGarmentClick={handleGarmentClick} 
                position={position}
              />
            )}
          </Suspense>
        ))}

        <ClickHandler onGarmentClick={onGarmentSelected} garmentId={garmentId} />
      </Canvas>

      {/* UI Overlay */}
      {showUI && (
        <div
          className={`absolute top-8 left-1/2 -translate-x-1/2 bg-black/70 text-zinc-100 px-6 py-3 text-sm uppercase tracking-[0.2em] font-light transition-opacity duration-1000 ${
            showUI ? "opacity-100" : "opacity-0"
          }`}
        >
          Click garment to view details
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-xs text-zinc-500 space-y-1">
        {useFirstPerson ? (
          <>
            <p>Click to lock mouse</p>
            <p>WASD: Move</p>
            <p>Mouse: Look around</p>
            <p>ESC: Unlock mouse</p>
          </>
        ) : (
          <>
            <p>Click & Drag: Rotate</p>
            <p>Scroll: Zoom</p>
          </>
        )}
        <button
          onClick={() => {
            setUseFirstPerson(!useFirstPerson);
            document.exitPointerLock();
          }}
          className="block mt-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Switch to {useFirstPerson ? "Orbit" : "First-Person"} View
        </button>
      </div>
    </div>
  );
}

