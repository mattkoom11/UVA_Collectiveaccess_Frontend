import { NextResponse } from "next/server";
import { syncGarmentsFromCA } from "@/lib/collectiveAccess";
import { setCAGarmentsCache } from "@/lib/garments";
import { Garment } from "@/types/garment";

/**
 * Server-only sync from CollectiveAccess. Keeps CA credentials out of the client bundle.
 * Consider protecting this route (e.g. auth or IP allowlist) – see SECURITY.md.
 */
export async function POST() {
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
