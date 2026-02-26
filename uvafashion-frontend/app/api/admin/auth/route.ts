import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "uva-fashion-admin";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (typeof password === "string" && password === ADMIN_PASSWORD) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
