import type { Material, Mesh, Object3D } from "three";

export type MaterialStore = Map<Mesh, Material | Material[]>;

// "Surface only" in conservator mode: the photo textures carry the capture
// lighting baked in, which fights the raking light, so every mesh swaps to a
// neutral clay material. Originals are kept in `store` (first one wins, so
// switching on twice never records clay as an "original") and put back when
// switched off.
export function setSurfaceOnly(root: Object3D, on: boolean, clay: Material, store: MaterialStore): void {
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    if (on) {
      if (!store.has(mesh)) store.set(mesh, mesh.material);
      mesh.material = clay;
    } else {
      const original = store.get(mesh);
      if (original) mesh.material = original;
    }
  });
  if (!on) store.clear();
}
