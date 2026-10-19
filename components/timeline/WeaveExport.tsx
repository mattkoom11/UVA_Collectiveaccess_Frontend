"use client";

import { useState } from "react";
import type { CollectionWeave, DecadeWeave } from "@/types/collectionWeave";
import { decadeLabel } from "@/lib/weave";
import {
  DEFAULT_MODULES,
  TC2_ENDS_PER_MODULE,
  collectionTapestry,
  decadeSwatch,
  type Draft,
  type LoomProfile,
} from "@/lib/weaveDraft";
import { toWif, type DraftMeta } from "@/lib/wif";
import { toBilevelTiff } from "@/lib/tiff";
import { weavingNotes } from "@/lib/weavingNotes";

type Props = ({ mode: "decade"; decade: DecadeWeave } | { mode: "collection"; decades: DecadeWeave[] }) & {
  source: CollectionWeave["source"];
  dataDate: string;
};

type Kind = "wif" | "tif" | "png" | "txt";

const MODULE_CHOICES = Array.from({ length: 12 }, (_, i) => i + 1);

function save(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function pngOf(draft: Draft): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = draft.ends;
  canvas.height = draft.picks;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("no canvas"));
  const image = ctx.createImageData(draft.ends, draft.picks);
  for (let row = 0; row < draft.picks; row++) {
    const pick = draft.picks - 1 - row; // pick 1 on the bottom row, as in the TIFF
    for (let x = 0; x < draft.ends; x++) {
      const v = draft.lifted[pick * draft.ends + x] ? 0 : 255;
      const at = (row * draft.ends + x) * 4;
      image.data[at] = v;
      image.data[at + 1] = v;
      image.data[at + 2] = v;
      image.data[at + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png"),
  );
}

// "Weave this decade" / "Weave the whole collection": loom-ready downloads,
// built only when a button is pressed.
export default function WeaveExport(props: Props) {
  const [open, setOpen] = useState(false);
  const [modules, setModules] = useState(DEFAULT_MODULES);
  const [error, setError] = useState<string | null>(null);

  const slug = props.mode === "decade" ? decadeLabel(props.decade.decade) : "collection";
  const title =
    props.mode === "decade" ? `UVA Historic Clothing Collection, ${slug}` : "UVA Historic Clothing Collection, woven by decade";

  const build = (profile: LoomProfile): Draft => {
    const ends = profile === "jacquard" ? TC2_ENDS_PER_MODULE * modules : undefined;
    return props.mode === "decade"
      ? decadeSwatch(props.decade, profile, { ends })
      : collectionTapestry(props.decades, profile, { ends });
  };

  const meta = (): DraftMeta => ({
    title,
    source: props.source,
    dataDate: props.dataDate,
    generated: new Date().toISOString().slice(0, 10),
  });

  const download = async (kind: Kind) => {
    setError(null);
    try {
      const jacquardTag = `jacquard-${modules}mod`;
      if (kind === "wif") {
        save(new Blob([toWif(build("shaft"), meta())], { type: "text/plain" }), `uvahcc-weave-${slug}-shaft.wif`);
      } else if (kind === "tif") {
        save(new Blob([toBilevelTiff(build("jacquard"))], { type: "image/tiff" }), `uvahcc-weave-${slug}-${jacquardTag}.tif`);
      } else if (kind === "png") {
        save(await pngOf(build("jacquard")), `uvahcc-weave-${slug}-${jacquardTag}.png`);
      } else {
        const m = meta();
        const text = [
          "=== Shaft loom (.wif) ===",
          weavingNotes(build("shaft"), m, "shaft"),
          `=== Digital Jacquard (.tif, ${modules} modules) ===`,
          weavingNotes(build("jacquard"), m, "jacquard"),
        ].join("\n");
        save(new Blob([text], { type: "text/plain" }), `uvahcc-weave-${slug}-notes.txt`);
      }
    } catch (e) {
      setError(e instanceof RangeError ? e.message : "Couldn't create the file. Try again.");
    }
  };

  const button =
    "px-3 py-2 border border-archive-border text-xs uppercase tracking-[0.2em] text-archive-fg hover:border-archive-border-hover transition-colors";

  return (
    <div className="text-sm text-archive-muted">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={button}>
        {props.mode === "decade" ? "Weave this decade" : "Weave the whole collection"}
      </button>
      {open && (
        <div className="mt-3 space-y-3 border border-archive-border p-4">
          <p>
            {props.mode === "decade"
              ? "A swatch of this decade's cloth as a loom draft."
              : "The whole collection as one tapestry: an undyed warp, each decade a band of weft stripes, oldest first."}
          </p>
          {props.source === "ci-fixture" && (
            <p className="text-xs uppercase tracking-[0.2em] text-archive-muted-subtle">Preview data from a sample of the collection.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={button} onClick={() => download("wif")}>
              WIF (shaft loom)
            </button>
            <button type="button" className={button} onClick={() => download("tif")}>
              TIFF (Jacquard)
            </button>
            <button type="button" className={button} onClick={() => download("png")}>
              PNG preview
            </button>
            <button type="button" className={button} onClick={() => download("txt")}>
              Weaving notes
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <span>Jacquard width</span>
            <select
              value={modules}
              onChange={(e) => setModules(Number(e.target.value))}
              className="bg-archive-bg border border-archive-border px-2 py-1 text-archive-fg"
            >
              {MODULE_CHOICES.map((m) => (
                <option key={m} value={m}>
                  {m} TC2 {m === 1 ? "module" : "modules"} ({m * TC2_ENDS_PER_MODULE} ends)
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs">
            WIF opens in weaving software and fits an 8-shaft loom. TIFF is the lift plan for a digital Jacquard
            (black = lifted, first pick at the bottom). The notes list each weft colour change.
          </p>
          {error && (
            <p role="alert" className="text-xs text-archive-signal">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
