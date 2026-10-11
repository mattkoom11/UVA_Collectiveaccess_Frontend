import { NextRequest, NextResponse } from "next/server";
import { getAllGarments, searchGarments } from "@/lib/garments";
import { semanticSearch } from "@/lib/semanticSearch";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 0;

  const all = getAllGarments();
  // The hfa-ml search service when it's configured and answers in time; keyword search otherwise.
  const semantic = q.length > 0 ? await semanticSearch(q, all) : null;
  const results = semantic ?? (q.length > 0 ? searchGarments(all, q) : all);
  const data = limit > 0 ? results.slice(0, limit) : results;

  return NextResponse.json({ results: data, total: results.length, engine: semantic ? "semantic" : "keyword" });
}
