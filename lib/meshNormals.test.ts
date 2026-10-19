import { describe, it, expect } from "vitest";
import { BufferAttribute, BufferGeometry, Mesh, MeshStandardMaterial } from "three";
import { computeWeldedNormals, ensureSmoothNormals } from "./meshNormals";

// A "tent": two triangles meeting along the x axis at a 90° ridge. Each
// triangle has its OWN copies of the two ridge vertices, the way a UV seam
// splits vertices in the photogrammetry exports.
//   A: v0 (0,0,0)  v1 (1,0,0)  v2 (0, 1,1)  -> face normal (0,-1,1)/√2
//   B: v3 (0,0,0)  v4 (0,-1,1) v5 (1,0,0)   -> face normal (0, 1,1)/√2
const TENT = [0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, -1, 1, 1, 0, 0];
const S = Math.SQRT1_2;

function tent(indexed: boolean): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(TENT), 3));
  if (indexed) g.setIndex([0, 1, 2, 3, 4, 5]);
  return g;
}

function normalAt(g: BufferGeometry, i: number): [number, number, number] {
  const n = g.getAttribute("normal");
  return [n.getX(i), n.getY(i), n.getZ(i)];
}

function expectVec(actual: [number, number, number], expected: [number, number, number]) {
  actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 5));
}

describe.each([
  ["indexed", true],
  ["non-indexed", false],
])("computeWeldedNormals (%s)", (_label, indexed) => {
  it("gives split copies of a ridge vertex the same, averaged normal", () => {
    const g = tent(indexed);
    computeWeldedNormals(g);
    expectVec(normalAt(g, 0), [0, 0, 1]);
    expectVec(normalAt(g, 3), [0, 0, 1]);
    expectVec(normalAt(g, 1), [0, 0, 1]);
    expectVec(normalAt(g, 5), [0, 0, 1]);
  });

  it("keeps each unshared vertex on its own face normal", () => {
    const g = tent(indexed);
    computeWeldedNormals(g);
    expectVec(normalAt(g, 2), [0, -S, S]);
    expectVec(normalAt(g, 4), [0, S, S]);
  });

  it("writes unit-length normals", () => {
    const g = tent(indexed);
    computeWeldedNormals(g);
    for (let i = 0; i < 6; i++) {
      const [x, y, z] = normalAt(g, i);
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 5);
    }
  });
});

describe("ensureSmoothNormals", () => {
  it("adds normals, turns off flat shading and enables shadows on a mesh without normals", () => {
    const material = new MeshStandardMaterial({ flatShading: true });
    const mesh = new Mesh(tent(true), material);
    ensureSmoothNormals(mesh);
    expect(mesh.geometry.getAttribute("normal")).toBeDefined();
    expect(material.flatShading).toBe(false);
    expect(mesh.castShadow).toBe(true);
  });

  it("leaves a geometry that already has normals alone", () => {
    const g = tent(true);
    g.computeVertexNormals();
    const existing = g.getAttribute("normal");
    const material = new MeshStandardMaterial({ flatShading: true });
    const mesh = new Mesh(g, material);
    ensureSmoothNormals(mesh);
    expect(mesh.geometry.getAttribute("normal")).toBe(existing);
    expect(material.flatShading).toBe(true);
    expect(mesh.castShadow).toBe(true);
  });
});
