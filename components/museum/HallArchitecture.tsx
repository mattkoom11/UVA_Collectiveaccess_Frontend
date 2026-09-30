"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { InstancedMesh, Object3D } from "three";
import {
  ENTRANCE_DEPTH,
  HALL_HEIGHT,
  LEFT_WALL_X,
  RIGHT_WALL_X,
  RUNWAY_WIDTH,
  type HallLayout,
} from "@/lib/hallLayout";

const HALL_WIDTH = RIGHT_WALL_X - LEFT_WALL_X;
const HALL_CENTER_X = (RIGHT_WALL_X + LEFT_WALL_X) / 2;
const SPOT_SPACING = 1.1;
const RUNWAY_START_Z = 0.5;

// The overhead grid of stage lights: small glowing discs on the ceiling,
// drawn as one instanced mesh so hundreds cost a single draw call.
function SpotGrid({ fromZ, toZ }: { fromZ: number; toZ: number }) {
  const ref = useRef<InstancedMesh>(null);
  const positions = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = LEFT_WALL_X + 0.6; x <= RIGHT_WALL_X - 0.6; x += SPOT_SPACING) {
      for (let z = fromZ - 0.5; z >= toZ + 0.5; z -= SPOT_SPACING) out.push([x, z]);
    }
    return out;
  }, [fromZ, toZ]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new Object3D();
    positions.forEach(([x, z], i) => {
      dummy.position.set(x, HALL_HEIGHT - 0.01, z);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]} frustumCulled={false}>
      <circleGeometry args={[0.055, 12]} />
      <meshBasicMaterial color="#fffaf0" toneMapped={false} />
    </instancedMesh>
  );
}

// One raised platform per era. Each starts where the previous wing ended,
// so the runway runs continuously and steps up at the start of every era.
function RunwaySteps({ layout }: { layout: HallLayout }) {
  return (
    <>
      {layout.wings.map((wing, i) => {
        const fromZ = i === 0 ? RUNWAY_START_Z : layout.wings[i - 1].zEnd;
        const toZ = i === layout.wings.length - 1 ? layout.hallEndZ + 1 : wing.zEnd;
        const length = fromZ - toZ;
        const centerZ = (fromZ + toZ) / 2;
        const h = wing.platformHeight;
        return (
          <group key={wing.era} position={[0, 0, centerZ]}>
            <mesh position={[0, h / 2, 0]}>
              <boxGeometry args={[RUNWAY_WIDTH, h, length]} />
              <meshStandardMaterial color="#232326" roughness={0.6} metalness={0.1} />
            </mesh>
            <mesh position={[0, h + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[RUNWAY_WIDTH, length]} />
              <meshStandardMaterial color="#6e6e73" roughness={0.22} metalness={0.25} />
            </mesh>
            {/* Lit edge along the aisle side, like the lip of a show runway. */}
            <mesh position={[RUNWAY_WIDTH / 2 - 0.02, h + 0.01, 0]}>
              <boxGeometry args={[0.04, 0.02, length]} />
              <meshBasicMaterial color="#c4c4c8" toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

export default function HallArchitecture({
  layout,
  onFloorClick,
}: {
  layout: HallLayout;
  onFloorClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const length = ENTRANCE_DEPTH - layout.hallEndZ;
  const centerZ = (ENTRANCE_DEPTH + layout.hallEndZ) / 2;

  return (
    <group>
      <ambientLight intensity={0.3} />
      <hemisphereLight args={["#ffffff", "#1a1a1c", 0.55]} />

      {/* What polished surfaces reflect: long light strips overhead, like the
          show-light grid. Built in the scene, so there's no image to fetch. */}
      <Environment resolution={128} environmentIntensity={0.7}>
        <color attach="background" args={["#0b0b0c"]} />
        {[-2.2, 0, 2.2, 4.4].map((x) => (
          <Lightformer
            key={x}
            form="rect"
            intensity={2}
            color="#fff6ea"
            position={[x, 5, 0]}
            rotation-x={Math.PI / 2}
            scale={[0.35, 80, 1]}
          />
        ))}
      </Environment>

      {/* Polished concrete floor; clicking it walks there. */}
      <mesh
        position={[HALL_CENTER_X, 0, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={onFloorClick}
      >
        <planeGeometry args={[HALL_WIDTH, length]} />
        <meshStandardMaterial color="#3a3a3e" roughness={0.32} metalness={0.2} />
      </mesh>

      <mesh position={[HALL_CENTER_X, HALL_HEIGHT, centerZ]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HALL_WIDTH, length]} />
        <meshStandardMaterial color="#0b0b0c" roughness={1} />
      </mesh>

      <mesh position={[LEFT_WALL_X, HALL_HEIGHT / 2, centerZ]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[length, HALL_HEIGHT]} />
        <meshStandardMaterial color="#1e1e21" roughness={0.9} />
      </mesh>
      <mesh position={[RIGHT_WALL_X, HALL_HEIGHT / 2, centerZ]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[length, HALL_HEIGHT]} />
        <meshStandardMaterial color="#1e1e21" roughness={0.9} />
      </mesh>
      <mesh position={[HALL_CENTER_X, HALL_HEIGHT / 2, ENTRANCE_DEPTH]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[HALL_WIDTH, HALL_HEIGHT]} />
        <meshStandardMaterial color="#1e1e21" roughness={0.9} />
      </mesh>
      <mesh position={[HALL_CENTER_X, HALL_HEIGHT / 2, layout.hallEndZ]}>
        <planeGeometry args={[HALL_WIDTH, HALL_HEIGHT]} />
        <meshStandardMaterial color="#1e1e21" roughness={0.9} />
      </mesh>

      <SpotGrid fromZ={ENTRANCE_DEPTH} toZ={layout.hallEndZ} />
      <RunwaySteps layout={layout} />
    </group>
  );
}
