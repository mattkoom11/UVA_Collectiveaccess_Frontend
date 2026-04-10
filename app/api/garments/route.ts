import { NextResponse } from "next/server";
import { getAllGarments, hydrateGarmentsFromCA } from "@/lib/garments";

export async function GET() {
  await hydrateGarmentsFromCA();
  const garments = getAllGarments();
  return NextResponse.json(garments);
}
