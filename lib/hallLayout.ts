import type { Garment } from "@/types/garment";
import type { MuseumLayout, Wing } from "@/lib/museum";

// World units are meters. The visitor walks toward -z, down an aisle to the
// right (+x) of a raised runway at x = 0. Wing I starts at z = 0; the space
// between z = 0 and ENTRANCE_DEPTH is the entrance lobby.

export type Vec3 = [number, number, number];

export const EYE_HEIGHT = 1.6;
export const HALL_HEIGHT = 6;
export const ENTRANCE_DEPTH = 8;
export const RUNWAY_WIDTH = 2.4;
export const AISLE_MIN_X = 1.9;
export const AISLE_MAX_X = 6.1;
export const RIGHT_WALL_X = 7;
export const LEFT_WALL_X = -3.4;
// The runway steps up one level at the start of each era.
export const PLATFORM_BASE_HEIGHT = 0.35;
export const PLATFORM_STEP = 0.2;
export const FLAGSHIP_HEIGHT = 1.7;
export const LIGHTBOX_WIDTH = 1.1;
export const LIGHTBOX_HEIGHT = 1.4;

const WING_GAP = 3;
const BACK_WALL_MARGIN = 3;
const MIN_WING_LENGTH = 14;
// A wing with nothing to show yet stays in the sequence but short, so the
// visitor isn't walking a long empty stretch to reach the next era.
const EMPTY_WING_LENGTH = 6;
const FLAGSHIP_SPACING = 6;
const LIGHTBOX_SPACING = 1.6;
const LIGHTBOX_MARGIN = 1;
const LIGHTBOX_ROW_Y = [1.55, 3.15];
const WALL_INSET = 0.06;

export interface FlagshipSlot {
  garment: Garment;
  position: Vec3;
  rotationY: number;
  // Where the camera goes to inspect this piece, and what it orbits.
  inspect: { position: Vec3; target: Vec3 };
}

export interface LightboxSlot {
  garment: Garment;
  position: Vec3;
  rotationY: number;
  wall: "left" | "right";
}

export interface HallWing extends Wing {
  index: number;
  zStart: number;
  zEnd: number;
  platformHeight: number;
  flagshipSlots: FlagshipSlot[];
  lightboxSlots: LightboxSlot[];
}

export interface HallLayout {
  wings: HallWing[];
  hallEndZ: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  start: { position: Vec3; yaw: number };
}

// Four lightboxes per column: both rows on the near (right) wall, then both
// rows on the far (left) wall behind the runway. Columns advance along the
// wing, so the walls read chronologically as the visitor walks.
const COLUMN_SLOTS: { wall: "left" | "right"; row: number }[] = [
  { wall: "right", row: 0 },
  { wall: "right", row: 1 },
  { wall: "left", row: 0 },
  { wall: "left", row: 1 },
];

function wingLength(wing: Wing): number {
  if (wing.flagships.length === 0 && wing.lightboxes.length === 0) return EMPTY_WING_LENGTH;
  const forFlagships = wing.flagships.length * FLAGSHIP_SPACING;
  const columns = Math.ceil(wing.lightboxes.length / COLUMN_SLOTS.length);
  const forLightboxes = columns * LIGHTBOX_SPACING + LIGHTBOX_MARGIN * 2;
  return Math.max(MIN_WING_LENGTH, forFlagships, forLightboxes);
}

function placeFlagships(wing: Wing, zStart: number, length: number, platformHeight: number): FlagshipSlot[] {
  const count = wing.flagships.length;
  return wing.flagships.map((garment, i) => {
    const z = zStart - ((i + 0.5) * length) / count;
    return {
      garment,
      position: [0, platformHeight, z],
      // Model fronts face +z; turn them to face the aisle (+x).
      rotationY: Math.PI / 2,
      inspect: {
        position: [AISLE_MIN_X + 0.4, platformHeight + 1.25, z],
        target: [0, platformHeight + FLAGSHIP_HEIGHT / 2, z],
      },
    };
  });
}

function placeLightboxes(wing: Wing, zStart: number): LightboxSlot[] {
  return wing.lightboxes.map((garment, i) => {
    const column = Math.floor(i / COLUMN_SLOTS.length);
    const { wall, row } = COLUMN_SLOTS[i % COLUMN_SLOTS.length];
    const z = zStart - LIGHTBOX_MARGIN - (column + 0.5) * LIGHTBOX_SPACING;
    const x = wall === "right" ? RIGHT_WALL_X - WALL_INSET : LEFT_WALL_X + WALL_INSET;
    return {
      garment,
      position: [x, LIGHTBOX_ROW_Y[row], z],
      // Face into the hall: the right wall faces -x, the left wall +x.
      rotationY: wall === "right" ? -Math.PI / 2 : Math.PI / 2,
      wall,
    };
  });
}

/** Turns the wing assignment into positions in the 3D hall. */
export function buildHallLayout(museum: MuseumLayout): HallLayout {
  let zStart = 0;
  const wings: HallWing[] = museum.wings.map((wing, index) => {
    const length = wingLength(wing);
    const platformHeight = PLATFORM_BASE_HEIGHT + index * PLATFORM_STEP;
    const hallWing: HallWing = {
      ...wing,
      index,
      zStart,
      zEnd: zStart - length,
      platformHeight,
      flagshipSlots: placeFlagships(wing, zStart, length, platformHeight),
      lightboxSlots: placeLightboxes(wing, zStart),
    };
    zStart = hallWing.zEnd - WING_GAP;
    return hallWing;
  });

  const lastWing = wings[wings.length - 1];
  const hallEndZ = (lastWing ? lastWing.zEnd : 0) - BACK_WALL_MARGIN;

  return {
    wings,
    hallEndZ,
    bounds: { minX: AISLE_MIN_X, maxX: AISLE_MAX_X, minZ: hallEndZ + 1, maxZ: ENTRANCE_DEPTH - 1 },
    start: { position: [(AISLE_MIN_X + AISLE_MAX_X) / 2, EYE_HEIGHT, ENTRANCE_DEPTH - 1.5], yaw: 0 },
  };
}

/**
 * Which wing the visitor is in at depth z: -1 in the entrance lobby. In the
 * gap between two wings the visitor is still in the one they are leaving.
 */
export function wingIndexAt(layout: HallLayout, z: number): number {
  if (z > 0) return -1;
  for (let i = layout.wings.length - 1; i >= 0; i--) {
    if (z <= layout.wings[i].zStart) return i;
  }
  return -1;
}

export function clampToBounds(layout: HallLayout, x: number, z: number): [number, number] {
  const { minX, maxX, minZ, maxZ } = layout.bounds;
  return [Math.min(maxX, Math.max(minX, x)), Math.min(maxZ, Math.max(minZ, z))];
}

interface Box {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

/**
 * Scale and offset that make a model of any export size exactly
 * targetHeight tall, centered on its own vertical axis, and standing on y = 0.
 * Photogrammetry exports vary wildly in scale and pivot.
 */
export function fitToHeight(box: Box, targetHeight: number): { scale: number; offset: Vec3 } {
  const height = box.max.y - box.min.y;
  const scale = height > 0 ? targetHeight / height : 1;
  const centerX = (box.min.x + box.max.x) / 2;
  const centerZ = (box.min.z + box.max.z) / 2;
  return { scale, offset: [-centerX * scale, -box.min.y * scale, -centerZ * scale] };
}
