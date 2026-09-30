"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Euler, type Vector3 } from "three";
import { EYE_HEIGHT, clampToBounds, wingIndexAt, type HallLayout } from "@/lib/hallLayout";

const LOOK_SPEED = 0.0032; // radians per dragged pixel
const MAX_PITCH = 1.1;
const WALK_SPEED = 3.2; // meters per second
const RUN_MULTIPLIER = 2;
const GLIDE_RATE = 3.5;
const MAX_GLIDE_SPEED = 9;

// code → [strafe, forward]
const KEY_DIRECTIONS: Record<string, [number, number]> = {
  KeyW: [0, 1], ArrowUp: [0, 1],
  KeyS: [0, -1], ArrowDown: [0, -1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
}

const clampPitch = (p: number) => Math.max(-MAX_PITCH, Math.min(MAX_PITCH, p));

/**
 * Walking the hall: drag to look (no pointer lock, so clicks stay free for
 * walking and selecting), click the floor to glide there, WASD or arrows to
 * move, Shift to walk faster. The visitor stays in the aisle at eye height.
 */
export default function HallControls({
  layout,
  enabled,
  walkTargetRef,
  onWingChange,
}: {
  layout: HallLayout;
  enabled: boolean;
  walkTargetRef: RefObject<Vector3 | null>;
  onWingChange: (index: number) => void;
}) {
  const { camera, gl } = useThree();
  const yaw = useRef(layout.start.yaw);
  const pitch = useRef(0);
  const keys = useRef(new Set<string>());
  const running = useRef(false);
  const currentWing = useRef<number | null>(null);

  // Take the look angles from wherever the camera is facing: the start pose
  // (set on the Canvas camera) at first, or the view left by an inspection.
  useEffect(() => {
    if (!enabled) return;
    const angles = new Euler().setFromQuaternion(camera.quaternion, "YXZ");
    yaw.current = angles.y;
    pitch.current = clampPitch(angles.x);
    walkTargetRef.current = null;
  }, [enabled, camera, walkTargetRef]);

  useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    // "Grab the world" convention, as in street-level map viewers.
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      yaw.current += (e.clientX - lastX) * LOOK_SPEED;
      pitch.current = clampPitch(pitch.current + (e.clientY - lastY) * LOOK_SPEED);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const up = () => {
      dragging = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [enabled, gl]);

  useEffect(() => {
    if (!enabled) return;
    const pressed = keys.current;
    const release = () => {
      pressed.clear();
      running.current = false;
    };
    const down = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Shift") running.current = true;
      if (KEY_DIRECTIONS[e.code]) {
        pressed.add(e.code);
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "Shift") running.current = false;
      pressed.delete(e.code);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", release);
      release();
    };
  }, [enabled]);

  // The frame state's camera is the same object as useThree's; mutating it
  // here is R3F's intended per-frame pattern.
  useFrame((state, delta) => {
    if (!enabled) return;
    const dt = Math.min(delta, 0.1);
    const pos = state.camera.position;

    let strafe = 0;
    let forward = 0;
    keys.current.forEach((code) => {
      strafe += KEY_DIRECTIONS[code][0];
      forward += KEY_DIRECTIONS[code][1];
    });

    if (strafe || forward) {
      walkTargetRef.current = null;
      const len = Math.hypot(strafe, forward);
      const speed = (WALK_SPEED * (running.current ? RUN_MULTIPLIER : 1) * dt) / len;
      const sin = Math.sin(yaw.current);
      const cos = Math.cos(yaw.current);
      // At yaw 0 the camera looks down -z and its right is +x.
      pos.x += (-sin * forward + cos * strafe) * speed;
      pos.z += (-cos * forward - sin * strafe) * speed;
    } else if (walkTargetRef.current) {
      const target = walkTargetRef.current;
      const dx = target.x - pos.x;
      const dz = target.z - pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.02) {
        walkTargetRef.current = null;
      } else {
        const step = Math.min(dist * (1 - Math.exp(-GLIDE_RATE * dt)), MAX_GLIDE_SPEED * dt);
        pos.x += (dx / dist) * step;
        pos.z += (dz / dist) * step;
      }
    }

    const [x, z] = clampToBounds(layout, pos.x, pos.z);
    pos.set(x, EYE_HEIGHT, z);
    state.camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");

    const wing = wingIndexAt(layout, z);
    if (wing !== currentWing.current) {
      currentWing.current = wing;
      onWingChange(wing);
    }
  });

  return null;
}
