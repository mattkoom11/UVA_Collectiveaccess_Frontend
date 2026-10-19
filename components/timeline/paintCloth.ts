import { cellJitter, colorHex, shadeHex, warpOver, type ClothPlan } from "@/lib/weave";

// Paints rows [fromRow, toRow) of a cloth plan. Each cell is a short thread
// segment: vertical where the warp shows, horizontal where the weft does,
// with a thin highlight down its middle so the cloth reads as thread.

const LOOM = "#191715";
const HIGHLIGHT = 0.18;

function paintStitch(
  ctx: CanvasRenderingContext2D,
  warpHex: string,
  weftHex: string,
  px: number,
  py: number,
  cell: number,
): void {
  ctx.fillStyle = weftHex;
  ctx.fillRect(px, py, cell, cell);
  ctx.strokeStyle = warpHex;
  ctx.lineWidth = cell * 0.32;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px + cell * 0.2, py + cell * 0.15);
  ctx.lineTo(px + cell * 0.5, py + cell * 0.85);
  ctx.lineTo(px + cell * 0.8, py + cell * 0.15);
  ctx.stroke();
}

export function paintRows(ctx: CanvasRenderingContext2D, plan: ClothPlan, fromRow: number, toRow: number): void {
  const { cell, cols, structure, warp, weftHex, seed } = plan;
  const inset = structure === "gauze" ? cell * 0.22 : cell * 0.08;
  const line = Math.max(0.5, cell * 0.15);

  for (let y = fromRow; y < toRow; y++) {
    const py = y * cell;
    ctx.fillStyle = LOOM;
    ctx.fillRect(0, py, cols * cell, cell);

    for (let x = 0; x < cols; x++) {
      const px = x * cell;
      const shade = cellJitter(x, y, seed);
      const warpHex = shadeHex(colorHex(warp[x], y), shade);
      const weft = shadeHex(weftHex, shade);

      if (structure === "knit") {
        paintStitch(ctx, warpHex, weft, px, py, cell);
        continue;
      }

      if (warpOver(structure, x, y)) {
        ctx.fillStyle = warpHex;
        ctx.fillRect(px + inset, py, cell - 2 * inset, cell);
        ctx.fillStyle = shadeHex(warpHex, HIGHLIGHT);
        ctx.fillRect(px + cell / 2 - line / 2, py, line, cell);
      } else {
        ctx.fillStyle = weft;
        ctx.fillRect(px, py + inset, cell, cell - 2 * inset);
        ctx.fillStyle = shadeHex(weft, HIGHLIGHT);
        ctx.fillRect(px, py + cell / 2 - line / 2, cell, line);
      }
    }
  }
}
