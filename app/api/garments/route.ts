import { NextResponse } from "next/server";
import { getAllGarments } from "@/lib/garments";

export async function GET() {
  const garments = getAllGarments();
  return NextResponse.json(garments);
}
