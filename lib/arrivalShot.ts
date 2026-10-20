import { ENTRANCE_DEPTH, type Vec3 } from "@/lib/hallLayout";

export const ARRIVAL_SECONDS = 4;

// High at the back of the lobby, just off the runway's edge, looking down at
// the first lit stage; the shot cranes down to the visitor's start pose.
const FROM_POSITION: Vec3 = [1.5, 4.5, ENTRANCE_DEPTH - 0.4];
const FROM_LOOK_AT: Vec3 = [0, 1, -12];
const LOOK_AHEAD = 10;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
// Written so t = 0 and t = 1 return a and b exactly.
const mix = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] * (1 - t) + b[0] * t,
  a[1] * (1 - t) + b[1] * t,
  a[2] * (1 - t) + b[2] * t,
];

/** Where the camera is, and what it looks at, at progress t (clamped to 0..1) of the arrival shot. */
export function arrivalPose(t: number, start: { position: Vec3; yaw: number }): { position: Vec3; lookAt: Vec3 } {
  const e = easeOutCubic(Math.min(1, Math.max(0, t)));
  const [x, y, z] = start.position;
  // At yaw 0 the camera looks down -z (see HallControls).
  const endLookAt: Vec3 = [x - Math.sin(start.yaw) * LOOK_AHEAD, y, z - Math.cos(start.yaw) * LOOK_AHEAD];
  return { position: mix(FROM_POSITION, start.position, e), lookAt: mix(FROM_LOOK_AT, endLookAt, e) };
}
