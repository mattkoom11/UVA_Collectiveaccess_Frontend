"use client";

import { AdditiveBlending, CanvasTexture } from "three";
import type { Vec3 } from "@/lib/hallLayout";

const RADIUS = 1.1;
let poolTexture: CanvasTexture | null = null;

// One soft white disc, drawn in code so nothing is downloaded; each pool tints it.
function getPoolTexture(): CanvasTexture {
  if (!poolTexture) {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    poolTexture = new CanvasTexture(canvas);
  }
  return poolTexture;
}

/** The pool of light on the runway under a garment: its only per-garment lighting cost. */
export default function LightPool({ position, color }: { position: Vec3; color: string }) {
  const [x, y, z] = position;
  return (
    // Just above the runway top (which sits 5 mm above the platform) to avoid z-fighting.
    <mesh position={[x, y + 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[RADIUS * 2, RADIUS * 2]} />
      <meshBasicMaterial
        map={getPoolTexture()}
        color={color}
        transparent
        opacity={0.55}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
