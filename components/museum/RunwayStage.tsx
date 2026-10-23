"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { RUNWAY_WIDTH } from "@/lib/hallLayout";
import { SEGMENT_PALETTES, type SegmentKey } from "@/lib/hallLighting";
import { GLOSSY_FLOOR, GLOSSY_RUNWAY, MATTE } from "./HallArchitecture";
import LightPool from "./LightPool";
import { useHallQuality } from "./useHallQuality";

const BACKGROUND = "#0b0b0c";
const RUNWAY_LENGTH = 40;
const PLATFORM_HEIGHT = 0.3;
// The viewer normalizes garments to 2 units tall; hall flagships are 1.7 m.
const VIEWER_SCALE = 2 / 1.7;
const STAGE_WIDTH = RUNWAY_WIDTH * VIEWER_SCALE;

/**
 * A stretch of the runway for a single garment's viewer, so the record page
 * looks like the hall: dark room, polished runway with a lit edge, a pool of
 * light underfoot, and a spotlight and fill in the garment's segment colors.
 * `lit` is false while another lighting rig (conservator mode) is in charge:
 * the stage stays, its lights and reflections go.
 */
export default function RunwayStage({ segment, groundY, lit }: { segment: SegmentKey; groundY: number; lit: boolean }) {
  // Mounted inside the Canvas, so this only ever runs in the browser.
  const { glossyRunway } = useHallQuality();
  const glossy = lit && glossyRunway;
  const palette = SEGMENT_PALETTES[segment];

  return (
    <group>
      <fog attach="fog" args={[BACKGROUND, 12, 40]} />

      {lit && (
        <>
          <ambientLight intensity={0.08} />
          <hemisphereLight args={["#ffffff", "#1a1a1c", 0.15]} />
          <spotLight
            position={[0.5, groundY + 6, 1.2]}
            angle={0.42}
            penumbra={0.6}
            intensity={45}
            distance={14}
            decay={2}
            color={palette.spot}
          />
          <pointLight position={[1.8, groundY + 6, 0]} color={palette.fill} intensity={10} decay={2} />
          <LightPool position={[0, groundY, 0]} color={palette.wash} />
        </>
      )}

      {glossy && (
        <Environment resolution={128} environmentIntensity={0.7}>
          <color attach="background" args={[BACKGROUND]} />
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
      )}

      {/* The runway platform, its polished top just below the garment's base. */}
      <mesh position={[0, groundY - PLATFORM_HEIGHT / 2 - 0.005, 0]}>
        <boxGeometry args={[STAGE_WIDTH, PLATFORM_HEIGHT, RUNWAY_LENGTH]} />
        <meshStandardMaterial color="#232326" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[0, groundY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[STAGE_WIDTH, RUNWAY_LENGTH]} />
        <meshStandardMaterial color="#6e6e73" {...(glossy ? GLOSSY_RUNWAY : MATTE)} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (STAGE_WIDTH / 2 - 0.02), groundY + 0.005, 0]}>
          <boxGeometry args={[0.04, 0.02, RUNWAY_LENGTH]} />
          <meshBasicMaterial color="#c4c4c8" toneMapped={false} />
        </mesh>
      ))}

      {/* The hall's concrete floor either side of the runway. */}
      <mesh position={[0, groundY - PLATFORM_HEIGHT, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#3a3a3e" {...(glossy ? GLOSSY_FLOOR : MATTE)} />
      </mesh>
    </group>
  );
}
