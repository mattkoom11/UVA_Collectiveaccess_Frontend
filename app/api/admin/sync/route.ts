import { NextRequest, NextResponse } from "next/server";
import { syncGarmentsFromCA } from "@/lib/collectiveAccess";
import { setCAGarmentsCache } from "@/lib/garments";
import { Garment } from "@/types/garment";
import { verifyAdminSession } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await syncGarmentsFromCA(0);
    const garments = raw.map((g) => ({
      ...g,
      images: Array.isArray(g.images) ? g.images : g.images ? [g.images] : [],
    })) as Garment[];
    setCAGarmentsCache(garments);
    return NextResponse.json({ ok: true, count: garments.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
