import { describe, it, expect } from "vitest";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { setSurfaceOnly, type MaterialStore } from "./surfaceMaterial";

function scene() {
  const photoA = new MeshStandardMaterial({ color: "#ff0000" });
  const photoB = new MeshStandardMaterial({ color: "#00ff00" });
  const a = new Mesh(new BoxGeometry(), photoA);
  const b = new Mesh(new BoxGeometry(), [photoB, photoA]);
  const root = new Group();
  root.add(a, b);
  return { root, a, b, photoA, photoB };
}

describe("setSurfaceOnly", () => {
  it("swaps every mesh to the clay material and remembers the originals", () => {
    const { root, a, b, photoA, photoB } = scene();
    const clay = new MeshStandardMaterial();
    const store: MaterialStore = new Map();

    setSurfaceOnly(root, true, clay, store);

    expect(a.material).toBe(clay);
    expect(b.material).toBe(clay);
    expect(store.get(a)).toBe(photoA);
    expect(store.get(b)).toEqual([photoB, photoA]);
  });

  it("keeps the real originals when switched on twice", () => {
    const { root, a, photoA } = scene();
    const clay = new MeshStandardMaterial();
    const store: MaterialStore = new Map();

    setSurfaceOnly(root, true, clay, store);
    setSurfaceOnly(root, true, clay, store);
    setSurfaceOnly(root, false, clay, store);

    expect(a.material).toBe(photoA);
  });

  it("restores the originals and empties the store when switched off", () => {
    const { root, a, b, photoA, photoB } = scene();
    const clay = new MeshStandardMaterial();
    const store: MaterialStore = new Map();

    setSurfaceOnly(root, true, clay, store);
    setSurfaceOnly(root, false, clay, store);

    expect(a.material).toBe(photoA);
    expect(b.material).toEqual([photoB, photoA]);
    expect(store.size).toBe(0);
  });

  it("does nothing when switched off without ever being on", () => {
    const { root, a, photoA } = scene();
    setSurfaceOnly(root, false, new MeshStandardMaterial(), new Map());
    expect(a.material).toBe(photoA);
  });
});
