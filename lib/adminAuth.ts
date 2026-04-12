import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "uva-fashion-admin";

export const ADMIN_COOKIE = "uva_admin_session";

const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours
export const COOKIE_MAX_AGE = SESSION_MAX_AGE_MS / 1000; // seconds, for Max-Age

// ---------------------------------------------------------------------------
// HMAC-signed session tokens
// Format: "<timestamp>.<hmac-sha256-hex>"
// The password is the HMAC key, so the token neither contains nor reveals it.
// ---------------------------------------------------------------------------

function sign(ts: number): string {
  return createHmac("sha256", ADMIN_PASSWORD).update(String(ts)).digest("hex");
}

export function createSessionToken(): string {
  const ts = Date.now();
  return `${ts}.${sign(ts)}`;
}

export function verifySessionToken(token: string): boolean {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  const ts = Number(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!Number.isFinite(ts) || Date.now() - ts > SESSION_MAX_AGE_MS) return false;
  const expected = sign(ts);
  try {
    // timingSafeEqual requires equal-length buffers
    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

export function verifyAdminSession(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE);
  return typeof cookie?.value === "string" && verifySessionToken(cookie.value);
}

/** Timing-safe password check — prevents oracle attacks on the comparison. */
export function verifyAdminPassword(password: unknown): boolean {
  if (typeof password !== "string") return false;
  try {
    // timingSafeEqual requires equal-length buffers; pad to avoid length leak
    const a = Buffer.from(password.padEnd(128));
    const b = Buffer.from(ADMIN_PASSWORD.padEnd(128));
    return (
      password.length === ADMIN_PASSWORD.length &&
      timingSafeEqual(a, b)
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Cookie header builders
// ---------------------------------------------------------------------------

export function sessionCookieHeader(): string {
  const token = createSessionToken();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}

export function clearSessionCookieHeader(): string {
  return `${ADMIN_COOKIE}=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0`;
}

// ---------------------------------------------------------------------------
// In-memory rate limiter for login attempts
// Resets on server restart — acceptable for a single-admin internal tool.
// ---------------------------------------------------------------------------

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/** Returns true if the request is within limits, false if it should be blocked. */
export function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

/** Clear rate-limit state after a successful login. */
export function resetLoginRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}
