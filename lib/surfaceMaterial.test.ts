import { describe, it, expect } from "vitest";
import { BoxGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Texture, type Material } from "three";
import { applyLook, photoMaterial, type MaterialStore, type PhotoCache } from "./surfaceMaterial";

function scene() {
  const photoA = new MeshStandardMaterial({ color: "#ff0000" });
  const photoB = new MeshStandardMaterial({ color: "#00ff00" });
  const a = new Mesh(new BoxGeometry(), photoA);
  const b = new Mesh(new BoxGeometry(), [photoB, photoA]);
  const root = new Group();
  root.add(a, b);
  return { root, a, b, photoA, photoB };
}

function stores(): [MaterialStore, PhotoCache] {
  return [new Map(), new Map()];
}

describe("photoMaterial", () => {
  it("keeps the texture, colour and side, unlit and not tone mapped", () => {
    const map = new Texture();
    const original = new MeshStandardMaterial({ map, color: "#336699", side: DoubleSide });
    const photo = photoMaterial(original) as MeshBasicMaterial;

    expect(photo).toBeInstanceOf(MeshBasicMaterial);
    expect(photo.map).toBe(map);
    expect(photo.color.getHexString()).toBe("336699");
    expect(photo.side).toBe(DoubleSide);
    expect(photo.toneMapped).toBe(false);
  });
});

describe("applyLook", () => {
  it("photo: swaps every mesh to an unlit copy of its own material", () => {
    const { root, a, b, photoA } = scene();
    const [store, cache] = stores();

    applyLook(root, "photo", new MeshStandardMaterial(), store, cache);

    expect(a.material).toBeInstanceOf(MeshBasicMaterial);
    expect(Array.isArray(b.material) && b.material.every((m) => m instanceof MeshBasicMaterial)).toBe(true);
    expect(store.get(a)).toBe(photoA);
  });

  it("photo: builds one copy per original material, shared and reused", () => {
    const { root, a, b } = scene();
    const [store, cache] = stores();
    const clay = new MeshStandardMaterial();

    applyLook(root, "photo", clay, store, cache);
    const first = a.material;
    applyLook(root, "lit", clay, store, cache);
    applyLook(root, "photo", clay, store, cache);

    expect(a.material).toBe(first);
    expect((b.material as Material[])[1]).toBe(first);
    expect(cache.size).toBe(2);
  });

  it("clay: swaps every mesh to the clay material and remembers the originals", () => {
    const { root, a, b, photoA, photoB } = scene();
    const clay = new MeshStandardMaterial();
    const [store, cache] = stores();

    applyLook(root, "clay", clay, store, cache);

    expect(a.material).toBe(clay);
    expect(b.material).toBe(clay);
    expect(store.get(a)).toBe(photoA);
    expect(store.get(b)).toEqual([photoB, photoA]);
  });

  it("keeps the real originals however looks are switched", () => {
    const { root, a, b, photoA, photoB } = scene();
    const clay = new MeshStandardMaterial();
    const [store, cache] = stores();

    applyLook(root, "photo", clay, store, cache);
    applyLook(root, "clay", clay, store, cache);
    applyLook(root, "clay", clay, store, cache);
    applyLook(root, "lit", clay, store, cache);

    expect(a.material).toBe(photoA);
    expect(b.material).toEqual([photoB, photoA]);
  });

  it("lit: leaves untouched meshes on their own materials", () => {
    const { root, a, photoA } = scene();
    applyLook(root, "lit", new MeshStandardMaterial(), ...stores());
    expect(a.material).toBe(photoA);
  });
});
