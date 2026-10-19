import { cellJitter, warpOver } from "@/lib/weave";
import { cellStructure, clothRows, rgbCss, type WeaveState } from "@/lib/weaveBlend";

// Paints rows [fromRow, toRow) of the cloth's current display state on a
// fixed grid. Each cell is a short thread segment: vertical where the warp
// shows, horizontal where the weft does, with a thin highlight down its
// middle. Thread thickness carries the decade's density; the gap between
// threads shows the loom.
//
// This runs every frame while the cloth settles, so colour strings are built
// once per column per frame, not per cell: each thread is filled with its
// flat colour, then a translucent overlay from a few preset shade levels
// gives the per-cell texture, and the highlight is one fixed translucent white.

const LOOM = "#191715";
const HIGHLIGHT = "rgba(255,255,255,0.18)";
const GAUZE_GAP = 0.14; // extra open space per side in gauze cells
// Fixed jitter seed: the threads' texture stays put while colours change, so
// scrubbing never flickers.
const SEED = 1;

// cellJitter returns [-0.06, 0.06]; it maps onto 9 overlay levels, darker
// below the middle and lighter above it. The middle level draws nothing.
const MAX_JITTER = 0.06;
const SHADE_STEPS = 4;
const SHADES: (string | null)[] = Array.from({ length: SHADE_STEPS * 2 + 1 }, (_, i) => {
  const amount = ((i - SHADE_STEPS) / SHADE_STEPS) * MAX_JITTER;
  if (amount === 0) return null;
  return amount > 0 ? `rgba(255,255,255,${amount.toFixed(3)})` : `rgba(0,0,0,${(-amount).toFixed(3)})`;
});

function shadeFor(x: number, y: number): string | null {
  const level = Math.round((cellJitter(x, y, SEED) / MAX_JITTER) * SHADE_STEPS) + SHADE_STEPS;
  return SHADES[Math.min(SHADES.length - 1, Math.max(0, level))];
}

function paintStitch(
  ctx: CanvasRenderingContext2D,
  warp: string,
  weft: string,
  px: number,
  py: number,
  cell: number,
  thickness: number,
): void {
  ctx.fillStyle = weft;
  ctx.fillRect(px, py, cell, cell);
  ctx.strokeStyle = warp;
  ctx.lineWidth = cell * 0.36 * thickness;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px + cell * 0.2, py + cell * 0.15);
  ctx.lineTo(px + cell * 0.5, py + cell * 0.85);
  ctx.lineTo(px + cell * 0.8, py + cell * 0.15);
  ctx.stroke();
}

export function paintCloth(
  ctx: CanvasRenderingContext2D,
  state: WeaveState,
  width: number,
  height: number,
  fromRow = 0,
  toRow = Number.POSITIVE_INFINITY,
): void {
  const { cell, rows } = clothRows(width, height);
  const end = Math.min(rows, toRow);
  if (fromRow >= end) return;

  const cols = state.colors.length;
  const warpColors = state.colors.map(rgbCss);
  const weftColor = rgbCss(state.weft);
  const pad = (cell * (1 - state.thickness)) / 2;
  const line = Math.max(0.5, cell * 0.15 * state.thickness);

  for (let y = fromRow; y < end; y++) {
    const py = y * cell;
    ctx.fillStyle = LOOM;
    ctx.fillRect(0, py, cols * cell, cell);

    for (let x = 0; x < cols; x++) {
      const px = x * cell;
      const structure = cellStructure(state, x, y, SEED);
      const shade = shadeFor(x, y);

      if (structure === "knit") {
        paintStitch(ctx, warpColors[x], weftColor, px, py, cell, state.thickness);
        if (shade) {
          ctx.fillStyle = shade;
          ctx.fillRect(px, py, cell, cell);
        }
        continue;
      }

      const inset = pad + (structure === "gauze" ? cell * GAUZE_GAP : 0);
      if (warpOver(structure, x, y)) {
        const w = cell - 2 * inset;
        ctx.fillStyle = warpColors[x];
        ctx.fillRect(px + inset, py, w, cell);
        if (shade) {
          ctx.fillStyle = shade;
          ctx.fillRect(px + inset, py, w, cell);
        }
        ctx.fillStyle = HIGHLIGHT;
        ctx.fillRect(px + cell / 2 - line / 2, py, line, cell);
      } else {
        const h = cell - 2 * inset;
        ctx.fillStyle = weftColor;
        ctx.fillRect(px, py + inset, cell, h);
        if (shade) {
          ctx.fillStyle = shade;
          ctx.fillRect(px, py + inset, cell, h);
        }
        ctx.fillStyle = HIGHLIGHT;
        ctx.fillRect(px, py + cell / 2 - line / 2, cell, line);
      }
    }
  }
}
