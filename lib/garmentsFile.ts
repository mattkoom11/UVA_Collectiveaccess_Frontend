import fs from "fs";
import path from "path";
import type { Garment } from "@/types/garment";

// The checked-in static garment data. Written only by the dev-only
// /api/admin/orientation route; production never writes it.
const GARMENTS_FILE = path.join(process.cwd(), "data", "garments.json");

/** Reads the file fresh from disk: the imported module may lag behind it until hot reload. */
export function readGarmentsFile(): Garment[] {
  return JSON.parse(fs.readFileSync(GARMENTS_FILE, "utf-8"));
}

// Same tmp-and-rename as saveDiskCache, so a crash mid-write never leaves a
// half-written file. 2-space indent + trailing newline match the checked-in format.
export function writeGarmentsFile(records: unknown[]): void {
  const tmp = `${GARMENTS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(records, null, 2) + "\n", "utf-8");
  fs.renameSync(tmp, GARMENTS_FILE);
}
