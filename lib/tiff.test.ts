import { describe, it, expect } from "vitest";
import { toBilevelTiff } from "./tiff";

// 10 ends × 3 picks. Pick 1: 1010101011, pick 2: blank, pick 3: only end 10.
const ends = 10;
const picks = 3;
const lifted = Uint8Array.from([
  1, 0, 1, 0, 1, 0, 1, 0, 1, 1,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
]);

function tags(bytes: Uint8Array) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ifd = dv.getUint32(4, true);
  const count = dv.getUint16(ifd, true);
  const out = new Map<number, { type: number; count: number; value: number }>();
  for (let i = 0; i < count; i++) {
    const at = ifd + 2 + i * 12;
    const type = dv.getUint16(at + 2, true);
    out.set(dv.getUint16(at, true), {
      type,
      count: dv.getUint32(at + 4, true),
      value: type === 3 ? dv.getUint16(at + 8, true) : dv.getUint32(at + 8, true),
    });
  }
  return { dv, ifd, count, out };
}

describe("toBilevelTiff", () => {
  const tiff = toBilevelTiff({ ends, picks, lifted });

  it("writes a little-endian TIFF header", () => {
    expect([...tiff.slice(0, 4)]).toEqual([0x49, 0x49, 0x2a, 0x00]);
  });

  it("describes a 1-bit, uncompressed, black-is-lifted image", () => {
    const { out, count } = tags(tiff);
    expect(count).toBe(12);
    const keys = [...out.keys()];
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
    expect(out.get(256)!.value).toBe(10); // ImageWidth
    expect(out.get(257)!.value).toBe(3); // ImageLength
    expect(out.get(258)!.value).toBe(1); // BitsPerSample
    expect(out.get(259)!.value).toBe(1); // Compression: none
    expect(out.get(262)!.value).toBe(0); // WhiteIsZero
    expect(out.get(277)!.value).toBe(1); // SamplesPerPixel
    expect(out.get(278)!.value).toBe(3); // RowsPerStrip
    expect(out.get(279)!.value).toBe(6); // StripByteCounts = ceil(10/8) * 3
    expect(out.get(296)!.value).toBe(2); // ResolutionUnit: inch
  });

  it("stores 72 dpi resolutions as rationals", () => {
    const { dv, out } = tags(tiff);
    for (const tag of [282, 283]) {
      const at = out.get(tag)!.value;
      expect(out.get(tag)!.type).toBe(5);
      expect([dv.getUint32(at, true), dv.getUint32(at + 4, true)]).toEqual([72, 1]);
    }
  });

  it("packs bits MSB-first with pick 1 on the bottom row", () => {
    const { out } = tags(tiff);
    const strip = tiff.slice(out.get(273)!.value, out.get(273)!.value + 6);
    expect([...strip]).toEqual([0x00, 0x40, 0x00, 0x00, 0xaa, 0xc0]);
    expect(tiff.length).toBe(out.get(273)!.value + 6);
  });
});
