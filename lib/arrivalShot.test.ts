import { describe, it, expect } from "vitest";
import { arrivalPose } from "./arrivalShot";
import { ENTRANCE_DEPTH, buildHallLayout, type Vec3 } from "./hallLayout";
import { buildMuseumLayout } from "./museum";

const { start } = buildHallLayout(buildMuseumLayout([]));

const distance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe("arrivalPose", () => {
  it("starts high up in the lobby", () => {
    const { position } = arrivalPose(0, start);
    expect(position[1]).toBeCloseTo(4.5);
    expect(position[2]).toBeGreaterThan(0);
    expect(position[2]).toBeLessThanOrEqual(ENTRANCE_DEPTH);
  });

  it("ends exactly at the start pose, looking level and straight ahead", () => {
    for (const yaw of [0, 0.5]) {
      const pose = { position: start.position, yaw };
      const { position, lookAt } = arrivalPose(1, pose);
      expect(position).toEqual(start.position);
      expect(lookAt[1]).toBe(position[1]);
      const lookYaw = Math.atan2(-(lookAt[0] - position[0]), -(lookAt[2] - position[2]));
      expect(lookYaw).toBeCloseTo(yaw);
    }
  });

  it("clamps progress outside 0..1", () => {
    expect(arrivalPose(-1, start)).toEqual(arrivalPose(0, start));
    expect(arrivalPose(2, start)).toEqual(arrivalPose(1, start));
  });

  it("moves smoothly, without jumps", () => {
    let previous = arrivalPose(0, start);
    for (let i = 1; i <= 100; i++) {
      const next = arrivalPose(i / 100, start);
      expect(distance(previous.position, next.position)).toBeLessThan(0.15);
      expect(distance(previous.lookAt, next.lookAt)).toBeLessThan(0.6);
      previous = next;
    }
  });
});
