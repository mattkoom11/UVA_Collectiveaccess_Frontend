"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Matrix4, Quaternion, Vector3 } from "three";
import type { FlagshipSlot } from "@/lib/hallLayout";

const FLIGHT_SECONDS = 0.9;

export interface CameraPose {
  position: Vector3;
  quaternion: Quaternion;
}

interface Flight {
  from: CameraPose;
  to: CameraPose;
  t: number;
  duration: number;
  done: boolean;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Close inspection of a flagship, in place on the runway. On "enter" the
 * camera flies from the aisle to the garment, remembering where the visitor
 * stood, then hands over to free orbit and zoom. On "exit" it flies back and
 * reports when it's there. Remount (via key) for each phase.
 */
export default function InspectControls({
  slot,
  phase,
  returnPoseRef,
  onExited,
}: {
  slot: FlagshipSlot;
  phase: "enter" | "exit";
  returnPoseRef: RefObject<CameraPose | null>;
  onExited: () => void;
}) {
  const { camera } = useThree();
  const [arrived, setArrived] = useState(false);
  const flight = useRef<Flight | null>(null);

  useEffect(() => {
    const from: CameraPose = { position: camera.position.clone(), quaternion: camera.quaternion.clone() };
    let to: CameraPose;
    if (phase === "enter") {
      returnPoseRef.current = from;
      const position = new Vector3(...slot.inspect.position);
      const look = new Matrix4().lookAt(position, new Vector3(...slot.inspect.target), camera.up);
      to = { position, quaternion: new Quaternion().setFromRotationMatrix(look) };
    } else {
      to = returnPoseRef.current ?? from;
    }
    flight.current = { from, to, t: 0, duration: prefersReducedMotion() ? 0 : FLIGHT_SECONDS, done: false };
  }, [camera, phase, slot, returnPoseRef]);

  useFrame((state, delta) => {
    const f = flight.current;
    if (!f || f.done) return;
    f.t = f.duration === 0 ? 1 : Math.min(1, f.t + delta / f.duration);
    const e = easeInOut(f.t);
    state.camera.position.lerpVectors(f.from.position, f.to.position, e);
    state.camera.quaternion.slerpQuaternions(f.from.quaternion, f.to.quaternion, e);
    if (f.t >= 1) {
      f.done = true;
      if (phase === "enter") setArrived(true);
      else onExited();
    }
  });

  if (phase !== "enter" || !arrived) return null;

  return (
    <OrbitControls
      target={slot.inspect.target}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={0.25}
      maxDistance={3.5}
      minPolarAngle={0.2}
      maxPolarAngle={1.75}
    />
  );
}
