import { BufferAttribute, type BufferGeometry, type Mesh, type MeshStandardMaterial, type Object3D } from "three";

// Smooth vertex normals that ignore UV seams. Photogrammetry exports split
// vertices wherever the texture atlas has a seam; three's computeVertexNormals
// treats those copies as unrelated and leaves a hard shading line along every
// seam. Here vertices are grouped by quantized position, area-weighted face
// normals are summed per group, and every copy gets the group's normal.
// UVs, indices and vertex order are untouched.
export function computeWeldedNormals(geometry: BufferGeometry, precision = 1e-5): void {
  const position = geometry.getAttribute("position");
  const count = position.count;
  const inv = 1 / precision;

  const groupOf = new Int32Array(count);
  const keyToGroup = new Map<string, number>();
  for (let i = 0; i < count; i++) {
    const key = `${Math.round(position.getX(i) * inv)},${Math.round(position.getY(i) * inv)},${Math.round(position.getZ(i) * inv)}`;
    let group = keyToGroup.get(key);
    if (group === undefined) {
      group = keyToGroup.size;
      keyToGroup.set(key, group);
    }
    groupOf[i] = group;
  }

  const sums = new Float32Array(keyToGroup.size * 3);
  const index = geometry.getIndex();
  const cornerCount = index ? index.count : count;
  for (let corner = 0; corner < cornerCount; corner += 3) {
    const a = index ? index.getX(corner) : corner;
    const b = index ? index.getX(corner + 1) : corner + 1;
    const c = index ? index.getX(corner + 2) : corner + 2;

    const ax = position.getX(a), ay = position.getY(a), az = position.getZ(a);
    const e1x = position.getX(b) - ax, e1y = position.getY(b) - ay, e1z = position.getZ(b) - az;
    const e2x = position.getX(c) - ax, e2y = position.getY(c) - ay, e2z = position.getZ(c) - az;

    // Unnormalized cross product: its length is twice the triangle's area,
    // so larger faces pull the average harder.
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;

    for (const v of [a, b, c]) {
      const g = groupOf[v] * 3;
      sums[g] += nx;
      sums[g + 1] += ny;
      sums[g + 2] += nz;
    }
  }

  const normals = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const g = groupOf[i] * 3;
    const x = sums[g], y = sums[g + 1], z = sums[g + 2];
    const length = Math.hypot(x, y, z) || 1;
    normals[i * 3] = x / length;
    normals[i * 3 + 1] = y / length;
    normals[i * 3 + 2] = z / length;
  }
  geometry.setAttribute("normal", new BufferAttribute(normals, 3));
}

// The GLB exports ship without normals, so GLTFLoader falls back to flat
// shading. Geometry and materials are shared with drei's useGLTF cache: the
// first mount computes normals and later mounts skip the work.
export function ensureSmoothNormals(root: Object3D): void {
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    if (mesh.geometry.getAttribute("normal")) return;

    computeWeldedNormals(mesh.geometry);
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if ("flatShading" in material) (material as MeshStandardMaterial).flatShading = false;
      material.needsUpdate = true;
    }
  });
}
