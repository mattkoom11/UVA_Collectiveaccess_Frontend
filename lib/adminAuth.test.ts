import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
  verifyAdminPassword,
} from "./adminAuth";

describe("session tokens", () => {
  it("accepts a freshly created token", () => {
    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);
  });

  it("rejects a token with a tampered signature", () => {
    const token = createSessionToken();
    const [ts] = token.split(".");
    expect(verifySessionToken(`${ts}.deadbeef`)).toBe(false);
  });

  it("rejects a token with a tampered timestamp", () => {
    const token = createSessionToken();
    const [, sig] = token.split(".");
    expect(verifySessionToken(`123.${sig}`)).toBe(false);
  });

  it("rejects malformed tokens", () => {
    expect(verifySessionToken("not-a-token")).toBe(false);
    expect(verifySessionToken("")).toBe(false);
    expect(verifySessionToken(".")).toBe(false);
  });

  it("rejects an expired token", () => {
    vi.useFakeTimers();
    const token = createSessionToken();
    // Session max age is 4 hours — advance past it.
    vi.advanceTimersByTime(4 * 60 * 60 * 1000 + 1000);
    expect(verifySessionToken(token)).toBe(false);
    vi.useRealTimers();
  });

  it("accepts a token just under the expiry window", () => {
    vi.useFakeTimers();
    const token = createSessionToken();
    vi.advanceTimersByTime(4 * 60 * 60 * 1000 - 1000);
    expect(verifySessionToken(token)).toBe(true);
    vi.useRealTimers();
  });
});

describe("verifyAdminPassword", () => {
  it("accepts the configured dev default password", () => {
    // No ADMIN_PASSWORD env var is set in the test environment, so the
    // module falls back to the documented dev default.
    expect(verifyAdminPassword("uva-fashion-admin")).toBe(true);
  });

  it("rejects an incorrect password", () => {
    expect(verifyAdminPassword("wrong-password")).toBe(false);
  });

  it("rejects non-string input without throwing", () => {
    expect(verifyAdminPassword(undefined)).toBe(false);
    expect(verifyAdminPassword(null)).toBe(false);
    expect(verifyAdminPassword(12345)).toBe(false);
    expect(verifyAdminPassword({})).toBe(false);
  });

  it("rejects empty string", () => {
    expect(verifyAdminPassword("")).toBe(false);
  });
});

describe("login rate limiter", () => {
  const ip = "203.0.113.1";
  // The module keeps rate-limit state (including the new global cap) in
  // module-level variables, so each test gets a fresh module instance
  // instead of sharing counters with its siblings.
  let mod: typeof import("./adminAuth");

  beforeEach(async () => {
    vi.resetModules();
    mod = await import("./adminAuth");
  });

  it("allows attempts under the limit", () => {
    for (let i = 0; i < 10; i++) {
      expect(mod.checkLoginRateLimit(ip)).toBe(true);
    }
  });

  it("blocks once the per-IP limit is exceeded", () => {
    for (let i = 0; i < 10; i++) mod.checkLoginRateLimit(ip);
    expect(mod.checkLoginRateLimit(ip)).toBe(false);
  });

  it("tracks separate IPs independently below the global cap", () => {
    const otherIp = "203.0.113.2";
    for (let i = 0; i < 10; i++) mod.checkLoginRateLimit(ip);
    expect(mod.checkLoginRateLimit(ip)).toBe(false);
    expect(mod.checkLoginRateLimit(otherIp)).toBe(true);
  });

  it("resets the count after a successful login", () => {
    for (let i = 0; i < 10; i++) mod.checkLoginRateLimit(ip);
    expect(mod.checkLoginRateLimit(ip)).toBe(false);
    mod.resetLoginRateLimit(ip);
    expect(mod.checkLoginRateLimit(ip)).toBe(true);
  });

  it("resets the window after it expires", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 10; i++) mod.checkLoginRateLimit(ip);
    expect(mod.checkLoginRateLimit(ip)).toBe(false);
    vi.advanceTimersByTime(15 * 60 * 1000 + 1000);
    expect(mod.checkLoginRateLimit(ip)).toBe(true);
    vi.useRealTimers();
  });

  it("blocks new attempts once the global cap is hit, even from a fresh IP", () => {
    // Spread 50 attempts across many distinct IPs to hit the global cap
    // without tripping any single IP's per-IP limit.
    for (let i = 0; i < 50; i++) {
      expect(mod.checkLoginRateLimit(`203.0.113.${100 + i}`)).toBe(true);
    }
    expect(mod.checkLoginRateLimit("203.0.113.250")).toBe(false);
  });
});
