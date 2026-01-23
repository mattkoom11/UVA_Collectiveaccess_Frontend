"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls, useGLTF, Environment, useTexture } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Group, Vector3, Raycaster, Mesh, RepeatWrapping } from "three";
import * as THREE from "three";
import DemoGarment from "@/components/garments/DemoGarment";
import { getGarmentById } from "@/lib/garments";

interface Backstage3DProps {
  onGarmentSelected?: (garmentId: string) => void;
  modelUrl?: string;
  garmentId?: string; // Single garment ID (legacy support)
  garmentIds?: string[]; // Array of garment IDs for multiple garments
  garmentPositions?: Array<[number, number, number]>;
  backgroundImageUrl?: string; // Optional custom background image
  backgroundModelUrl?: string; // Optional 3D photogrammetry room model (GLTF/GLB)
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

    const onClick = (event: MouseEvent) => {
      // Only request pointer lock if clicking in empty space
      // Don't interfere with garment clicks
      if (!isLocked.current) {
        // Small delay to let garment click handlers run first
        setTimeout(() => {
          if (!isLocked.current && document.pointerLockElement !== gl.domElement) {
            try {
              gl.domElement.requestPointerLock().catch(() => {
                // Silently fail if pointer lock is not available
              });
            } catch (error) {
              // Ignore errors
            }
          }
        }, 200);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    gl.domElement.addEventListener("click", onClick, { passive: true });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      gl.domElement.removeEventListener("click", onClick);
      try {
        if (document.pointerLockElement === gl.domElement) {
          document.exitPointerLock();
        }
      } catch (error) {
        // Ignore errors when exiting pointer lock
      }
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

// Decorative backdrop with image - must be in separate component for Suspense
function BackdropWithImage({ imageUrl }: { imageUrl: string }) {
  const texture = useTexture(imageUrl) as THREE.Texture;
  
  useEffect(() => {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1, 1);
  }, [texture]);

  return (
    <mesh 
      rotation={[0, 0, 0]} 
      position={[0, 2, -18.1]} 
      receiveShadow
    >
      <planeGeometry args={[12, 4]} />
      <meshStandardMaterial 
        map={texture}
        color="#ffffff"
        roughness={0.9}
      />
    </mesh>
  );
}

// Gradient backdrop (fallback when no image)
function GradientBackdrop() {
  const gradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create a dark gradient backdrop
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.5, '#1a1a1a');
    gradient.addColorStop(1, '#0f0f0f');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
    
    // Add subtle decorative elements - fashion-inspired patterns
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 2;
    // Horizontal lines for depth
    for (let i = 0; i < 5; i++) {
      const y = (i + 1) * 100;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }
    
    // Add subtle vertical elements
    ctx.strokeStyle = '#1f1f1f';
    for (let i = 0; i < 8; i++) {
      const x = (i + 1) * 128;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    return tex;
  }, []);

  return (
    <mesh 
      rotation={[0, 0, 0]} 
      position={[0, 2, -18.1]} 
      receiveShadow
    >
      <planeGeometry args={[12, 4]} />
      <meshStandardMaterial 
        map={gradientTexture}
        color="#1a1a1a"
        roughness={0.9}
        emissive="#0a0a0a"
        emissiveIntensity={0.05}
      />
    </mesh>
  );
}

// Decorative backdrop component with image support
function DecorativeBackdrop({ imageUrl }: { imageUrl?: string }) {
  if (imageUrl) {
    return (
      <Suspense fallback={<GradientBackdrop />}>
        <BackdropWithImage imageUrl={imageUrl} />
      </Suspense>
    );
  }
  
  return <GradientBackdrop />;
}

// Decorative pattern texture for walls
function WallPattern() {
  // Create a procedural pattern using canvas
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d')!;
    
    // Create a subtle fabric/textile pattern
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 512, 512);
    
    // Add subtle grid pattern
    ctx.strokeStyle = '#0f0f0f';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    
    // Add subtle texture dots
    ctx.fillStyle = '#151515';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return c;
  }, []);

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }, [canvas]);

  return texture;
}

// 3D Photogrammetry Room Model Component
function PhotogrammetryRoom({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  const clonedScene = scene.clone();
  
  // Scale and position the room model appropriately
  // Adjust these values based on your room model's scale
  const roomScale = 1;
  const roomPosition: [number, number, number] = [0, 0, -8];
  
  return (
    <primitive 
      object={clonedScene} 
      scale={roomScale}
      position={roomPosition}
      receiveShadow
      castShadow={false} // Room typically doesn't cast shadows on garments
    />
  );
}

// Backstage room structure - long shallow room
function BackstageRoom({ 
  garmentPositions,
  backgroundImageUrl,
  backgroundModelUrl
}: { 
  garmentPositions: Array<[number, number, number]>;
  backgroundImageUrl?: string;
  backgroundModelUrl?: string;
}) {
  const wallPattern = WallPattern();
  
  // If 3D model is provided, use it instead of procedural room
  if (backgroundModelUrl) {
    return (
      <group>
        {/* 3D Photogrammetry Room */}
        <Suspense fallback={null}>
          <PhotogrammetryRoom modelUrl={backgroundModelUrl} />
        </Suspense>
        
        {/* Still add pedestals for garments */}
        {garmentPositions.map((pos, index) => (
          <Pedestal 
            key={index} 
            position={[pos[0], 0.15, pos[2]]} 
          />
        ))}
      </group>
    );
  }

  return (
    <group>
      {/* Floor - centered at (0, 0, -8), 12 units wide, 20 units deep */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, -8]} 
        receiveShadow
      >
        <planeGeometry args={[12, 20]} />
        <meshStandardMaterial 
          color="#2a2a2a" 
          roughness={0.8}
          map={wallPattern}
        />
      </mesh>

      {/* Left Wall - PlaneGeometry(20, 4) at x = -6, y = 2, z = -8, rotated +90° on Y */}
      <mesh 
        rotation={[0, Math.PI / 2, 0]} 
        position={[-6, 2, -8]} 
        receiveShadow
      >
        <planeGeometry args={[20, 4]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.9}
          map={wallPattern}
        />
      </mesh>

      {/* Right Wall - same but x = +6, rotated -90° on Y */}
      <mesh 
        rotation={[0, -Math.PI / 2, 0]} 
        position={[6, 2, -8]} 
        receiveShadow
      >
        <planeGeometry args={[20, 4]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.9}
          map={wallPattern}
        />
      </mesh>

      {/* Back Wall - PlaneGeometry(12, 4) at (0, 2, -18), facing the camera */}
      <mesh 
        rotation={[0, 0, 0]} 
        position={[0, 2, -18]} 
        receiveShadow
      >
        <planeGeometry args={[12, 4]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.9}
          map={wallPattern}
        />
      </mesh>

      {/* Decorative Backdrop - behind the back wall */}
      <DecorativeBackdrop imageUrl={backgroundImageUrl} />

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
  garmentId,
}: {
  modelUrl: string;
  onGarmentClick: (garmentId?: string) => void;
  position: [number, number, number];
  garmentId?: string;
}) {
  const groupRef = useRef<Group>(null);
  
  // useGLTF must be called unconditionally - Suspense will handle loading
  const { scene: loadedScene } = useGLTF(modelUrl);
  const scene = loadedScene.clone();

  // Rotate the garment slowly
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  const handleClick = useCallback((e: any) => {
    // Three.js event - only has stopPropagation, not preventDefault
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    try {
      // Exit pointer lock if active
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      // Small delay to ensure pointer lock is released
      setTimeout(() => {
        onGarmentClick(garmentId);
      }, 100);
    } catch (error) {
      console.error("Error in garment model click:", error);
    }
  }, [onGarmentClick]);

  return (
    <group ref={groupRef} position={position} onClick={handleClick}>
      <primitive object={scene} scale={1} />
    </group>
  );
}

// Placeholder garment when no model is available - uses enhanced demo garment
function PlaceholderGarment({ 
  onGarmentClick, 
  position,
  garmentId
}: { 
  onGarmentClick: (garmentId?: string) => void;
  position: [number, number, number];
  garmentId?: string;
}) {
  const garment = garmentId ? getGarmentById(garmentId) : undefined;
  const garmentColor = garment?.colors?.[0] || "#6b7280";
  
  const handleClick = useCallback((e: any) => {
    // Three.js event - only has stopPropagation, not preventDefault
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    try {
      // Exit pointer lock if active
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      // Small delay to ensure pointer lock is released
      setTimeout(() => {
        onGarmentClick(garmentId);
      }, 100);
    } catch (error) {
      console.error("Error in placeholder garment click:", error);
    }
  }, [onGarmentClick, garmentId]);

  return (
    <group position={position} onClick={handleClick}>
      <DemoGarment position={[0, 0, 0]} rotation={true} color={garmentColor} scale={0.8} />
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

// Simplified - removed ClickHandler to avoid conflicts
// Garments handle their own clicks now

export default function Backstage3D({
  onGarmentSelected,
  modelUrl,
  garmentId,
  garmentIds,
  garmentPositions = [[0, 0.45, -8]], // Default: one garment at center, on pedestal
  backgroundImageUrl, // Optional: URL to background image
  backgroundModelUrl, // Optional: URL to 3D photogrammetry room model (GLTF/GLB)
}: Backstage3DProps) {
  const [showUI, setShowUI] = useState(true);
  const [useFirstPerson, setUseFirstPerson] = useState(false); // Default to orbit controls for stability
  const [isMounted, setIsMounted] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine which garment IDs to use
  const actualGarmentIds = useMemo(() => {
    if (garmentIds && garmentIds.length > 0) {
      return garmentIds;
    }
    if (garmentId) {
      return [garmentId];
    }
    return ["G-0001"]; // Default fallback
  }, [garmentIds, garmentId]);

  // Ensure positions match garment IDs
  const finalPositions = useMemo(() => {
    if (garmentPositions.length >= actualGarmentIds.length) {
      return garmentPositions.slice(0, actualGarmentIds.length);
    }
    // If not enough positions, generate them
    const positions: Array<[number, number, number]> = [];
    for (let i = 0; i < actualGarmentIds.length; i++) {
      if (i < garmentPositions.length) {
        positions.push(garmentPositions[i]);
      } else {
        // Generate positions in a grid
        const row = Math.floor(i / 3);
        const col = i % 3;
        positions.push([(col - 1) * 3, 0.45, -8 - row * 4]);
      }
    }
    return positions;
  }, [garmentPositions, actualGarmentIds]);

  // Get model URLs for each garment
  const garmentModelUrls = useMemo(() => {
    return actualGarmentIds.map(id => {
      const garment = getGarmentById(id);
      return garment?.model3d_url || garment?.modelUrl || undefined;
    });
  }, [actualGarmentIds]);

  useEffect(() => {
    setIsMounted(true);
    
    // Fade out UI after 5 seconds
    const timer = setTimeout(() => {
      setShowUI(false);
    }, 5000);

    return () => {
      clearTimeout(timer);
      // Cleanup pointer lock on unmount
      if (document.pointerLockElement) {
        try {
          document.exitPointerLock();
        } catch (e) {
          // Ignore errors
        }
      }
      // Cleanup context monitoring if it exists
      if (canvasRef.current && (canvasRef.current as any).__cleanup) {
        try {
          (canvasRef.current as any).__cleanup();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const handleGarmentClick = useCallback((garmentIdToSelect?: string) => {
    try {
      if (onGarmentSelected && garmentIdToSelect) {
        // Exit pointer lock if active
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
        // Use setTimeout to ensure state is stable
        setTimeout(() => {
          if (onGarmentSelected) {
            onGarmentSelected(garmentIdToSelect);
          }
        }, 50);
      }
    } catch (error) {
      console.error("Error handling garment click:", error);
    }
  }, [onGarmentSelected]);

  if (!isMounted || contextLost) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center" style={{ minHeight: '600px' }}>
        <div className="text-center text-zinc-400">
          {contextLost ? (
            <>
              <p className="text-lg mb-2">WebGL Context Lost</p>
              <p className="text-sm mb-4">Attempting to recover...</p>
              <button
                onClick={() => {
                  setContextLost(false);
                  setIsMounted(false);
                  setTimeout(() => setIsMounted(true), 100);
                }}
                className="px-4 py-2 bg-zinc-800 text-zinc-200 rounded hover:bg-zinc-700 transition-colors"
              >
                Retry
              </button>
            </>
          ) : (
            <div className="text-zinc-500 text-sm">Loading 3D scene...</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black" style={{ minHeight: '600px' }}>
      <Canvas 
        shadows 
        camera={{ position: [0, 1.6, 2], fov: 75 }}
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
          stencil: false,
          depth: true,
          // Prevent context loss
          failIfMajorPerformanceCaveat: false,
          premultipliedAlpha: false
        }}
        dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)}
        frameloop="always"
        performance={{ min: 0.5 }}
        onCreated={(state) => {
          try {
            state.gl.setClearColor("#000000", 1);
            state.gl.domElement.style.touchAction = "none";
            state.gl.domElement.style.outline = "none";
            
            // Store canvas reference for context loss handling
            canvasRef.current = state.gl.domElement;
            
            // Add context loss listeners
            const handleContextLost = (event: Event) => {
              event.preventDefault();
              console.warn("WebGL context lost - attempting recovery");
              setContextLost(true);
            };

            const handleContextRestored = () => {
              console.log("WebGL context restored");
              setContextLost(false);
              setIsMounted(false);
              setTimeout(() => setIsMounted(true), 100);
            };

            state.gl.domElement.addEventListener('webglcontextlost', handleContextLost);
            state.gl.domElement.addEventListener('webglcontextrestored', handleContextRestored);
            
            // Monitor for context loss periodically
            const checkContext = () => {
              try {
                const gl = state.gl.getContext();
                if (gl && gl.isContextLost && gl.isContextLost()) {
                  setContextLost(true);
                }
              } catch (error) {
                // Context might be lost, ignore errors
              }
            };
            
            const contextCheckInterval = setInterval(checkContext, 2000);
            
            // Store cleanup function on the renderer
            const cleanup = () => {
              clearInterval(contextCheckInterval);
              try {
                state.gl.domElement.removeEventListener('webglcontextlost', handleContextLost);
                state.gl.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
              } catch (error) {
                // Ignore cleanup errors
              }
            };
            
            // Store cleanup for later
            (state.gl as any).__cleanup = cleanup;
          } catch (error) {
            console.error("Error initializing Canvas:", error);
          }
        }}
          onError={(event: React.SyntheticEvent) => {
          console.error("Canvas error:", event);
          // Context loss is handled by event listeners
        }}
      >
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

        <BackstageLighting garmentPositions={finalPositions} />
        <Environment preset="warehouse" />

        <BackstageRoom 
          garmentPositions={finalPositions}
          backgroundImageUrl={backgroundImageUrl}
          backgroundModelUrl={backgroundModelUrl}
        />

        {/* Render garments at specified positions */}
        {isMounted && finalPositions.map((position, index) => {
          const garmentId = actualGarmentIds[index];
          const modelUrl = garmentModelUrls[index];
          return (
            <Suspense key={`garment-${garmentId}-${index}`} fallback={<GarmentLoading position={position} />}>
              {modelUrl ? (
                <GarmentModel 
                  modelUrl={modelUrl} 
                  onGarmentClick={handleGarmentClick} 
                  position={position}
                  garmentId={garmentId}
                />
              ) : (
                <PlaceholderGarment 
                  onGarmentClick={handleGarmentClick} 
                  position={position}
                  garmentId={garmentId}
                />
              )}
            </Suspense>
          );
        })}
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

