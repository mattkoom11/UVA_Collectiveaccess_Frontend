import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { readGarmentsFile } from "./garmentsFile";
import { getDetailModelUrl, getPreviewModelUrl } from "./museum";

const garments = readGarmentsFile();

// Local model paths are served from public/, so a typo shows up here
// instead of as a viewer stuck on its placeholder.
function localFile(url: string): string | undefined {
  return url.startsWith("/") ? path.join(process.cwd(), "public", url) : undefined;
}

describe("data/garments.json model files", () => {
  it("points every local model URL at a file in public/", () => {
    const missing = garments.flatMap((g) =>
      [g.model3d_url, ...(g.models ?? []).map((m) => m.url)]
        .filter((url): url is string => Boolean(url))
        .filter((url) => {
          const file = localFile(url);
          return file !== undefined && !existsSync(file);
        })
        .map((url) => `${g.id}: ${url}`),
    );
    expect(missing).toEqual([]);
  });

  it("keeps the hall on the light file when a garment has a full_detail one", () => {
    for (const g of garments.filter((g) => g.models?.some((m) => m.role === "full_detail"))) {
      expect(getPreviewModelUrl(g), g.id).toBe(g.model3d_url);
      expect(getDetailModelUrl(g), g.id).not.toBe(g.model3d_url);
    }
  });
});
