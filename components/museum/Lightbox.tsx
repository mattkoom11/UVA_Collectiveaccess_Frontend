"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Group, SRGBColorSpace, Texture, TextureLoader, Vector3 } from "three";
import { LIGHTBOX_HEIGHT, LIGHTBOX_WIDTH, type LightboxSlot } from "@/lib/hallLayout";
import type { Garment } from "@/types/garment";

// Photos start loading once the visitor is this close, so a long wall of
// lightboxes doesn't download every image at once.
const LOAD_DISTANCE = 22;
const CHECK_EVERY_FRAMES = 20;
const CLICK_TOLERANCE_PX = 6;

function photoUrl(garment: Garment): string | undefined {
  return garment.imageUrl || garment.images?.[0] || garment.thumbnailUrl;
}

// Scale that fits an image of the given aspect inside the panel.
function containScale(aspect: number): [number, number] {
  const panelAspect = LIGHTBOX_WIDTH / LIGHTBOX_HEIGHT;
  return aspect > panelAspect ? [1, panelAspect / aspect] : [aspect / panelAspect, 1];
}

export default function Lightbox({
  slot,
  onSelect,
}: {
  slot: LightboxSlot;
  onSelect: (garment: Garment) => void;
}) {
  const group = useRef<Group>(null);
  const [near, setNear] = useState(false);
  const [texture, setTexture] = useState<Texture | null>(null);
  const frame = useRef(0);
  const worldPos = useRef(new Vector3());
  const url = photoUrl(slot.garment);

  useFrame(({ camera }) => {
    if (near || !group.current || ++frame.current % CHECK_EVERY_FRAMES !== 0) return;
    group.current.getWorldPosition(worldPos.current);
    if (worldPos.current.distanceTo(camera.position) < LOAD_DISTANCE) setNear(true);
  });

  useEffect(() => {
    if (!near || !url) return;
    let cancelled = false;
    let loaded: Texture | null = null;
    // WebGL can only use a cross-origin photo if its host sends CORS headers.
    // Without them the load fails and the panel stays blank; the photo still
    // shows in the placard overlay, which uses a plain <img>.
    const loader = new TextureLoader().setCrossOrigin("anonymous");
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = SRGBColorSpace;
        loaded = tex;
        if (cancelled) tex.dispose();
        else setTexture(tex);
      },
      undefined,
      () => {},
    );
    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [near, url]);

  const image = texture?.image as { width?: number; height?: number } | undefined;
  const aspect = image?.width && image?.height ? image.width / image.height : LIGHTBOX_WIDTH / LIGHTBOX_HEIGHT;
  const [sx, sy] = containScale(aspect);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > CLICK_TOLERANCE_PX) return;
    e.stopPropagation();
    onSelect(slot.garment);
  };

  return (
    <group
      ref={group}
      position={slot.position}
      rotation={[0, slot.rotationY, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[LIGHTBOX_WIDTH + 0.1, LIGHTBOX_HEIGHT + 0.1, 0.06]} />
        <meshStandardMaterial color="#141416" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* The backlit panel: glows even before (or without) its photo. */}
      <mesh>
        <planeGeometry args={[LIGHTBOX_WIDTH, LIGHTBOX_HEIGHT]} />
        <meshBasicMaterial color={texture ? "#0b0b0c" : "#d9d4c8"} toneMapped={false} />
      </mesh>
      {texture && (
        <mesh position={[0, 0, 0.002]} scale={[sx, sy, 1]}>
          <planeGeometry args={[LIGHTBOX_WIDTH, LIGHTBOX_HEIGHT]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
