import { cellJitter, warpOver } from "@/lib/weave";
import { cellStructure, clothRows, rgbCss, shadeRgb, type RGB, type WeaveState } from "@/lib/weaveBlend";

// Paints rows [fromRow, toRow) of the cloth's current display state on a
// fixed grid. Each cell is a short thread segment: vertical where the warp
// shows, horizontal where the weft does, with a thin highlight down its
// middle. Thread thickness carries the decade's density; the gap between
// threads shows the loom.

const LOOM = "#191715";
const HIGHLIGHT = 0.18;
const GAUZE_GAP = 0.14; // extra open space per side in gauze cells
// Fixed jitter seed: the threads' texture stays put while colours change, so
// scrubbing never flickers.
const SEED = 1;

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
  const cols = state.colors.length;
  const pad = (cell * (1 - state.thickness)) / 2;
  const line = Math.max(0.5, cell * 0.15 * state.thickness);

  for (let y = fromRow; y < end; y++) {
    const py = y * cell;
    ctx.fillStyle = LOOM;
    ctx.fillRect(0, py, cols * cell, cell);

    for (let x = 0; x < cols; x++) {
      const px = x * cell;
      const shade = cellJitter(x, y, SEED);
      const structure = cellStructure(state, x, y, SEED);
      const warp: RGB = shadeRgb(state.colors[x], shade);
      const weft: RGB = shadeRgb(state.weft, shade);

      if (structure === "knit") {
        paintStitch(ctx, rgbCss(warp), rgbCss(weft), px, py, cell, state.thickness);
        continue;
      }

      const inset = pad + (structure === "gauze" ? cell * GAUZE_GAP : 0);
      if (warpOver(structure, x, y)) {
        ctx.fillStyle = rgbCss(warp);
        ctx.fillRect(px + inset, py, cell - 2 * inset, cell);
        ctx.fillStyle = rgbCss(shadeRgb(warp, HIGHLIGHT));
        ctx.fillRect(px + cell / 2 - line / 2, py, line, cell);
      } else {
        ctx.fillStyle = rgbCss(weft);
        ctx.fillRect(px, py + inset, cell, cell - 2 * inset);
        ctx.fillStyle = rgbCss(shadeRgb(weft, HIGHLIGHT));
        ctx.fillRect(px, py + cell / 2 - line / 2, cell, line);
      }
    }
  }
}
