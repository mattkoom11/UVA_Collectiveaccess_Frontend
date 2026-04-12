"use client";

import { useMemo, useState } from "react";
import { getAllGarments, filterGarments } from "@/lib/garments";
import GarmentCard from "@/components/garments/GarmentCard";


const allGarments = getAllGarments();

export default function GarmentSearchClient() {
  const [decade, setDecade] = useState<string>("");
  const [workType, setWorkType] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [view, setView] = useState<"runway" | "grid">("runway");

  // derive options from data
  const decades = Array.from(
    new Set(allGarments.map((g) => g.decade).filter(Boolean))
  ) as string[];
  const workTypes = Array.from(
    new Set(allGarments.map((g) => g.work_type).filter(Boolean))
  ) as string[];
  const colors = Array.from(
    new Set(allGarments.flatMap((g) => g.colors || []))
  );

  const filtered = useMemo(
    () =>
      filterGarments(allGarments, {
        decade: decade || undefined,
        work_type: workType || undefined,
        color: color || undefined,
      }),
    [decade, workType, color]
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-end border-b border-zinc-800 pb-4">
        <div className="space-y-1">
          <label className="block text-[0.7rem] uppercase tracking-[0.2em] text-zinc-400">
            Decade
          </label>
          <select
            className="bg-zinc-900 border border-zinc-700 text-sm px-2 py-1"
            value={decade}
            onChange={(e) => setDecade(e.target.value)}
          >
            <option value="">Any</option>
            {decades.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[0.7rem] uppercase tracking-[0.2em] text-zinc-400">
            Work type
          </label>
          <select
            className="bg-zinc-900 border border-zinc-700 text-sm px-2 py-1"
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
          >
            <option value="">Any</option>
            {workTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[0.7rem] uppercase tracking-[0.2em] text-zinc-400">
            Color
          </label>
          <select
            className="bg-zinc-900 border border-zinc-700 text-sm px-2 py-1"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          >
            <option value="">Any</option>
            {colors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex gap-2 text-[0.7rem] uppercase tracking-[0.2em]">
          <button
            type="button"
            onClick={() => setView("runway")}
            className={`px-3 py-1 border ${
              view === "runway"
                ? "border-zinc-100 text-zinc-100"
                : "border-zinc-700 text-zinc-400"
            }`}
          >
            Runway
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`px-3 py-1 border ${
              view === "grid"
                ? "border-zinc-100 text-zinc-100"
                : "border-zinc-700 text-zinc-400"
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Results */}
      {view === "runway" ? (
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4">
            {filtered.map((g) => (
              <GarmentCard key={g.id} garment={g} variant="runway" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <GarmentCard key={g.id} garment={g} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
