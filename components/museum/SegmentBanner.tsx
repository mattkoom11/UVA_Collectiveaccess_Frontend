"use client";

import { useEffect, useState } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { HALL_HEIGHT, type HallSegment } from "@/lib/hallLayout";
import { SEGMENT_PALETTES } from "@/lib/hallLighting";

const WIDTH = 2.6;
const HEIGHT = 1.3;
const HANG_Y = HALL_HEIGHT - 1.25;
const PX_PER_M = 400;

function bannerText(segment: HallSegment): { title: string; subtitle: string; note?: string } {
  if (!segment.wing) return { title: "New Acquisitions", subtitle: "Recently scanned" };
  const { numeral, label, comingSoon } = segment.wing;
  return { title: numeral, subtitle: label, note: comingSoon ? "Coming soon" : undefined };
}

// The site's fonts come from next/font, which only exposes their generated
// family names through CSS variables on <html>.
function fontFamily(variable: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || fallback;
}

async function drawBanner(segment: HallSegment): Promise<CanvasTexture> {
  const serif = fontFamily("--font-display", "Georgia, serif");
  const mono = fontFamily("--font-plex-mono", "monospace");
  const titleFont = `italic ${segment.wing ? 260 : 120}px ${serif}`;
  const smallFont = `500 44px ${mono}`;
  try {
    await Promise.all([document.fonts.load(titleFont), document.fonts.load(smallFont)]);
    await document.fonts.ready;
  } catch {
    // Draw with whatever font is available rather than not at all.
  }
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * PX_PER_M;
  canvas.height = HEIGHT * PX_PER_M;
  const ctx = canvas.getContext("2d")!;
  const { title, subtitle, note } = bannerText(segment);
  ctx.fillStyle = SEGMENT_PALETTES[segment.key].banner;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = titleFont;
  ctx.fillText(title, canvas.width / 2, canvas.height * 0.55);
  ctx.font = smallFont;
  ctx.letterSpacing = "8px";
  ctx.fillText(subtitle.toUpperCase(), canvas.width / 2, canvas.height * 0.75);
  if (note) {
    ctx.globalAlpha = 0.6;
    ctx.fillText(note.toUpperCase(), canvas.width / 2, canvas.height * 0.9);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** The numeral hung over the runway where a segment begins, facing the visitor walking in. */
export default function SegmentBanner({ segment }: { segment: HallSegment }) {
  const [texture, setTexture] = useState<CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let drawn: CanvasTexture | null = null;
    drawBanner(segment).then((tex) => {
      drawn = tex;
      if (cancelled) tex.dispose();
      else setTexture(tex);
    });
    return () => {
      cancelled = true;
      drawn?.dispose();
    };
  }, [segment]);

  return (
    <group position={[0, HANG_Y, segment.zStart - 0.4]}>
      {/* Two thin rods up to the ceiling, so it reads as hung. */}
      {[-WIDTH / 2 + 0.15, WIDTH / 2 - 0.15].map((x) => (
        <mesh key={x} position={[x, (HALL_HEIGHT - HANG_Y) / 2, 0]}>
          <cylinderGeometry args={[0.006, 0.006, HALL_HEIGHT - HANG_Y, 4]} />
          <meshBasicMaterial color="#2a2a2e" />
        </mesh>
      ))}
      {texture && (
        <mesh>
          <planeGeometry args={[WIDTH, HEIGHT]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
