import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminPassword,
  verifyAdminSession,
  sessionCookieHeader,
  clearSessionCookieHeader,
  checkLoginRateLimit,
  resetLoginRateLimit,
} from "@/lib/adminAuth";

// GET — check whether the current session cookie is still valid
export async function GET(req: NextRequest) {
  if (verifyAdminSession(req)) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}

// POST — verify password and issue session cookie
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkLoginRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  try {
    const { password } = await req.json();
    if (verifyAdminPassword(password)) {
      resetLoginRateLimit(ip);
      return NextResponse.json(
        { ok: true },
        { headers: { "Set-Cookie": sessionCookieHeader() } }
      );
    }
    return NextResponse.json({ ok: false }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

// DELETE — sign out by clearing the session cookie
export async function DELETE() {
  return NextResponse.json(
    { ok: true },
    { headers: { "Set-Cookie": clearSessionCookieHeader() } }
  );
}
