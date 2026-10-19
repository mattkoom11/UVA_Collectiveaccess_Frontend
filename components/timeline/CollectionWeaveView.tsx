"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { CollectionWeave } from "@/types/collectionWeave";
import type { Garment } from "@/types/garment";
import {
  colorHex,
  colorShares,
  decadeLabel,
  decadeSummary,
  defaultDecadeIndex,
  structureLabel,
  weaveStructure,
} from "@/lib/weave";
import { scannedInDecade } from "@/lib/collectionWeave";
import WovenCloth from "./WovenCloth";
import DecadeScrubber from "./DecadeScrubber";

const Garment3DViewer = dynamic(() => import("@/components/garments/Garment3DViewer"), { ssr: false });

interface Props {
  weave: CollectionWeave;
  garments: Garment[];
}

export default function CollectionWeaveView({ weave, garments }: Props) {
  // Fractional while dragging (blends neighbouring decades); settles on a
  // whole decade when the pointer is released or a key is used.
  const [position, setPosition] = useState(() => defaultDecadeIndex(weave.decades));
  const [open3d, setOpen3d] = useState<string | null>(null);

  const decade = weave.decades[Math.round(position)];
  const maxGarments = useMemo(() => Math.max(0, ...weave.decades.map((d) => d.garments)), [weave]);
  const byAccession = useMemo(
    () => new Map(garments.flatMap((g) => (g.accessionNumber ? [[g.accessionNumber, g] as const] : []))),
    [garments],
  );

  const scanned = scannedInDecade(weave.scanned, decade.decade).flatMap((accession) => {
    const garment = byAccession.get(accession);
    return garment?.model3d_url ? [{ accession, range: weave.scanned[accession], garment }] : [];
  });
  const opened = scanned.find((s) => s.accession === open3d)?.garment;
  const swatches = colorShares(decade).slice(0, 5);

  return (
    <section className="mb-16" aria-labelledby="woven-heading">
      <h1 id="woven-heading" className="text-3xl md:text-5xl font-light tracking-tight text-archive-fg mb-3">
        The collection, woven
      </h1>
      <p className="text-sm text-archive-muted max-w-2xl">
        Each decade&apos;s colours, fabrics and number of garments, woven into cloth.
      </p>
      {weave.source === "ci-fixture" && (
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-archive-muted-subtle">
          Preview data from a sample of the collection.
        </p>
      )}

      <div className="grid gap-8 mt-8 lg:grid-cols-[1fr_18rem]">
        <div>
          <WovenCloth
            decades={weave.decades}
            position={position}
            maxGarments={maxGarments}
            label={decadeSummary(decade)}
          />
          <div className="mt-4">
            <DecadeScrubber
              decades={weave.decades}
              position={position}
              onChange={setPosition}
              onRelease={() => setPosition((p) => Math.round(p))}
            />
          </div>
        </div>

        <aside className="border border-archive-border p-5 text-sm text-archive-muted space-y-4 self-start">
          <p className="text-2xl font-light text-archive-fg">{decadeLabel(decade.decade)}</p>
          <p>{decadeSummary(decade)}</p>
          {swatches.length > 0 && (
            <ul className="space-y-1.5">
              {swatches.map((s) => (
                <li key={s.code} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block w-3 h-3 border border-archive-border"
                    style={{
                      background:
                        s.code === "multi"
                          ? `linear-gradient(90deg, ${colorHex("multi", 0)} 50%, ${colorHex("multi", 1)} 50%)`
                          : colorHex(s.code),
                    }}
                  />
                  <span className="capitalize">{s.code}</span>
                  <span className="ml-auto tabular-nums">{Math.round(s.share * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
          {decade.garments > 0 && <p>{structureLabel(weaveStructure(decade.materials))}</p>}
        </aside>
      </div>

      {scanned.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs uppercase tracking-[0.2em] text-archive-muted mb-3">
            Scanned in 3D from the {decadeLabel(decade.decade)}
          </h2>
          <ul className="flex flex-wrap gap-3">
            {scanned.map(({ accession, range, garment }) => (
              <li key={accession} className="border border-archive-border p-4 min-w-[14rem]">
                <p className="text-archive-fg">{garment.label}</p>
                <p className="text-xs text-archive-muted mb-3">
                  {range.earliest}–{range.latest}
                </p>
                <button
                  type="button"
                  aria-expanded={open3d === accession}
                  onClick={() => setOpen3d(open3d === accession ? null : accession)}
                  className="px-3 py-2 border border-archive-border text-xs uppercase tracking-[0.2em] text-archive-fg hover:border-archive-border-hover transition-colors"
                >
                  {open3d === accession ? "Hide 3D" : "Turn it in 3D"}
                </button>
              </li>
            ))}
          </ul>
          {opened && (
            <div className="mt-6">
              <Garment3DViewer modelUrl={opened.model3d_url} garment={opened} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
