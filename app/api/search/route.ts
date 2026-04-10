import { NextRequest, NextResponse } from "next/server";
import { getAllGarments, searchGarments } from "@/lib/garments";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 0;

  const all = getAllGarments();
  const results = q.length > 0 ? searchGarments(all, q) : all;
  const data = limit > 0 ? results.slice(0, limit) : results;

  return NextResponse.json({ results: data, total: results.length });
}
