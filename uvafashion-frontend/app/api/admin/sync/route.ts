import { NextRequest, NextResponse } from "next/server";
import { syncGarmentsFromCA } from "@/lib/collectiveAccess";
import { setCAGarmentsCache } from "@/lib/garments";
import { Garment } from "@/types/garment";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "uva-fashion-admin";

export async function POST(req: NextRequest) {
  // Simple authorization check via header or body
  const authHeader = req.headers.get("x-admin-password");
  if (authHeader !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await syncGarmentsFromCA(500);
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
