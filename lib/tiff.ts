import type { Draft } from "./weaveDraft";

// A baseline bilevel TIFF of a draft's lift plan, for digital Jacquard
// software (e.g. the TC2's): one pixel per warp end per pick, black where the
// end is lifted, uncompressed, one strip. Pick 1 is the bottom row, so the
// image reads like the finished cloth with its first-woven end at the bottom.

const SHORT = 3;
const LONG = 4;
const RATIONAL = 5;
const HEADER = 8;
const TAG_COUNT = 12;
const IFD_SIZE = 2 + TAG_COUNT * 12 + 4;
const X_RES_AT = HEADER + IFD_SIZE;
const Y_RES_AT = X_RES_AT + 8;
const STRIP_AT = Y_RES_AT + 8;

// Typed on ArrayBuffer (not ArrayBufferLike) so it can go straight into a Blob.
export function toBilevelTiff(draft: Pick<Draft, "ends" | "picks" | "lifted">): Uint8Array<ArrayBuffer> {
  const { ends: width, picks: height, lifted } = draft;
  const rowBytes = Math.ceil(width / 8);
  const stripBytes = rowBytes * height;
  const bytes = new Uint8Array(STRIP_AT + stripBytes);
  const dv = new DataView(bytes.buffer);

  // Header: "II", 42, offset of the first IFD.
  bytes.set([0x49, 0x49, 0x2a, 0x00]);
  dv.setUint32(4, HEADER, true);

  // IFD entries, in ascending tag order as TIFF requires.
  const entries: [tag: number, type: number, value: number][] = [
    [256, LONG, width], // ImageWidth
    [257, LONG, height], // ImageLength
    [258, SHORT, 1], // BitsPerSample
    [259, SHORT, 1], // Compression: none
    [262, SHORT, 0], // PhotometricInterpretation: WhiteIsZero (1 = black)
    [273, LONG, STRIP_AT], // StripOffsets
    [277, SHORT, 1], // SamplesPerPixel
    [278, LONG, height], // RowsPerStrip
    [279, LONG, stripBytes], // StripByteCounts
    [282, RATIONAL, X_RES_AT], // XResolution
    [283, RATIONAL, Y_RES_AT], // YResolution
    [296, SHORT, 2], // ResolutionUnit: inch
  ];
  dv.setUint16(HEADER, TAG_COUNT, true);
  entries.forEach(([tag, type, value], i) => {
    const at = HEADER + 2 + i * 12;
    dv.setUint16(at, tag, true);
    dv.setUint16(at + 2, type, true);
    dv.setUint32(at + 4, 1, true);
    if (type === SHORT) dv.setUint16(at + 8, value, true);
    else dv.setUint32(at + 8, value, true);
  });
  dv.setUint32(HEADER + 2 + TAG_COUNT * 12, 0, true); // no further IFDs

  for (const at of [X_RES_AT, Y_RES_AT]) {
    dv.setUint32(at, 72, true);
    dv.setUint32(at + 4, 1, true);
  }

  for (let row = 0; row < height; row++) {
    const pick = height - 1 - row;
    const base = STRIP_AT + row * rowBytes;
    for (let x = 0; x < width; x++) {
      if (lifted[pick * width + x]) bytes[base + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return bytes;
}
