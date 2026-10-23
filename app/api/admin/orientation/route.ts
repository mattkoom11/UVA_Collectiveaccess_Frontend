import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import { applyOrientationReview } from "@/lib/orientation";
import { readGarmentsFile, writeGarmentsFile } from "@/lib/garmentsFile";

// Approves a garment's model3d_rotationY by rewriting data/garments.json.
// Dev server only: production serves a built bundle that never re-reads the
// file, and its filesystem may be read-only.
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Not available in production" }, { status: 404 });
  }
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { id?: unknown; rotationY?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const { id, rotationY } = body ?? {};
  if (typeof id !== "string" || typeof rotationY !== "number" || !Number.isFinite(rotationY)) {
    return NextResponse.json({ ok: false, error: "Expected { id: string, rotationY: number }" }, { status: 400 });
  }

  try {
    const updated = applyOrientationReview(readGarmentsFile(), id, rotationY);
    if (!updated) {
      return NextResponse.json({ ok: false, error: `No garment with id ${id}` }, { status: 400 });
    }
    writeGarmentsFile(updated);
    const garment = updated.find((g) => g.id === id)!;
    return NextResponse.json({
      ok: true,
      garment: { id, model3d_rotationY: garment.model3d_rotationY, orientationReviewed: garment.orientationReviewed },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Write failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
