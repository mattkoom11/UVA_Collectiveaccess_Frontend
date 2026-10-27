import { MeshBasicMaterial, type Material, type Mesh, type MeshStandardMaterial, type Object3D } from "three";

export type MaterialStore = Map<Mesh, Material | Material[]>;
export type PhotoCache = Map<Material, Material>;

// How a scan is shaded in the record-page viewer:
// - "photo": the photo texture unlit, as RealityScan shows it. The texture
//   already carries the capture's own light and shadow; lighting the mesh
//   again doubles every fold and turns reconstruction noise into visible lumps.
// - "lit": the scan's own material under the scene lights (conservator mode).
// - "clay": a neutral material in place of the texture ("Surface only"), whose
//   baked-in lighting fights the raking light.
export type GarmentLook = "photo" | "lit" | "clay";

// Unlit copy of a scan material: same texture and colour, no lighting, and no
// tone mapping, so the texture appears exactly as captured.
export function photoMaterial(material: Material): Material {
  const source = material as MeshStandardMaterial;
  return new MeshBasicMaterial({
    map: source.map ?? null,
    color: source.color ? source.color.clone() : undefined,
    side: source.side,
    transparent: source.transparent,
    opacity: source.opacity,
    toneMapped: false,
  });
}

// Originals are recorded once per mesh in `store` and never replaced, so any
// look can always go back to "lit". Photo copies are built once per original
// material and kept in `cache`.
export function applyLook(
  root: Object3D,
  look: GarmentLook,
  clay: Material,
  store: MaterialStore,
  cache: PhotoCache,
): void {
  const photoOf = (m: Material) => {
    let photo = cache.get(m);
    if (!photo) {
      photo = photoMaterial(m);
      cache.set(m, photo);
    }
    return photo;
  };

  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    if (!store.has(mesh)) store.set(mesh, mesh.material);
    const original = store.get(mesh)!;
    if (look === "clay") mesh.material = clay;
    else if (look === "lit") mesh.material = original;
    else mesh.material = Array.isArray(original) ? original.map(photoOf) : photoOf(original);
  });
}
