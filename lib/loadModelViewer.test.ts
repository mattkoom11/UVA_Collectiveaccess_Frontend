import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { withTimeout } from "./loadModelViewer";

describe("withTimeout", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("resolves with the promise's value when it settles in time", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 1000, "slow")).resolves.toBe("ok");
  });

  it("rejects with the given message when the promise never settles", async () => {
    const result = withTimeout(new Promise<never>(() => {}), 1000, "model-viewer never registered");
    const assertion = expect(result).rejects.toThrow("model-viewer never registered");
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it("passes through the promise's own rejection", async () => {
    await expect(withTimeout(Promise.reject(new Error("boom")), 1000, "slow")).rejects.toThrow("boom");
  });
});
