import { describe, it, expect, vi } from "vitest";
import { semanticSearch } from "./semanticSearch";
import type { Garment } from "@/types/garment";

const g = (id: string, accessionNumber?: string): Garment => ({ id, slug: id, label: id, images: [], accessionNumber });
const all = [g("suit", "ST.2021.1"), g("fan", "ACS.2024.1"), g("dress", "DR.2023.1"), g("demo")];
const cfg = { url: "https://search.example/", token: "t" };

function fakeFetch(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
}

describe("semanticSearch", () => {
  it("returns loaded garments in the service's order", async () => {
    const f = fakeFetch({ results: ["DR.2023.1", "NOT.LOADED.1", "ST.2021.1"] });
    expect((await semanticSearch("silk", all, { ...cfg, fetchImpl: f }))?.map((x) => x.id)).toEqual(["dress", "suit"]);
  });

  it("sends the token, trims the query, and calls /search once", async () => {
    const f = fakeFetch({ results: ["ST.2021.1"] });
    await semanticSearch("  " + "x".repeat(300), all, { ...cfg, fetchImpl: f });
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://search.example/search");
    expect(init.headers.Authorization).toBe("Bearer t");
    expect(JSON.parse(init.body).q).toHaveLength(200);
  });

  it("returns null when not configured, so the route uses keyword search", async () => {
    const f = fakeFetch({ results: ["ST.2021.1"] });
    expect(await semanticSearch("suit", all, { url: "", token: "", fetchImpl: f })).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("returns null on errors, bad responses, or no loaded matches", async () => {
    expect(await semanticSearch("suit", all, { ...cfg, fetchImpl: fakeFetch({ detail: "x" }, 500) })).toBeNull();
    expect(await semanticSearch("suit", all, { ...cfg, fetchImpl: fakeFetch({ nope: 1 }) })).toBeNull();
    expect(await semanticSearch("suit", all, { ...cfg, fetchImpl: fakeFetch({ results: ["NOT.LOADED.1"] }) })).toBeNull();
    const boom = vi.fn(async () => { throw new Error("network down"); }) as unknown as typeof fetch;
    expect(await semanticSearch("suit", all, { ...cfg, fetchImpl: boom })).toBeNull();
  });

  it("gives up after the timeout instead of hanging the page", async () => {
    const slow = vi.fn((_: string, init: RequestInit) => new Promise<Response>((_, reject) => {
      init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    })) as unknown as typeof fetch;
    const t = Date.now();
    expect(await semanticSearch("suit", all, { ...cfg, fetchImpl: slow, timeoutMs: 50 })).toBeNull();
    expect(Date.now() - t).toBeLessThan(1000);
  });
});
