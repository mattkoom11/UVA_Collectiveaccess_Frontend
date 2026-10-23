"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Circle, RotateCcw } from "lucide-react";
import { getAllGarments } from "@/lib/garments";
import { getPreviewModelUrl } from "@/lib/museum";
import {
  ITEM_PAGE_OFFSET_DEGREES,
  RUNWAY_OFFSET_DEGREES,
  itemPageYawDeg,
  normalizeDegrees,
  runwayYawDeg,
} from "@/lib/orientation";
import { Garment } from "@/types/garment";
import PageLayout from "@/components/layout/PageLayout";
import AdminAuthGate from "@/components/admin/AdminAuthGate";

const OrientationPreview = dynamic(() => import("@/components/admin/OrientationPreview"), { ssr: false });

const STEPS = [-45, -5, 5, 45];
const WRITES_ENABLED = process.env.NODE_ENV !== "production";

const buttonBase = "flex items-center gap-2 px-4 py-2 border transition-colors text-sm disabled:opacity-50";
const buttonClass = `${buttonBase} bg-archive-surface-muted hover:bg-archive-border-hover border-archive-border`;
const approveClass = `${buttonBase} ml-auto bg-archive-fg text-archive-bg border-archive-fg hover:opacity-90`;

export default function AdminOrientationPage() {
  return (
    <AdminAuthGate>
      <PageLayout>
        <Suspense fallback={null}>
          <OrientationReview />
        </Suspense>
      </PageLayout>
    </AdminAuthGate>
  );
}

// The garments that would stand on the runway once reviewed.
function reviewableGarments(): Garment[] {
  return getAllGarments().filter((g) => g.featuredOnRunway === true && getPreviewModelUrl(g) !== undefined);
}

function OrientationReview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const garments = reviewableGarments();
  const selectedId = searchParams.get("id");
  const selected =
    garments.find((g) => g.id === selectedId) ?? garments.find((g) => !g.orientationReviewed) ?? garments[0];
  const reviewedCount = garments.filter((g) => g.orientationReviewed).length;

  return (
    <div className="min-h-screen bg-archive-bg text-archive-fg">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs text-archive-muted hover:text-archive-fg mb-6">
          <ArrowLeft className="w-4 h-4" /> Admin
        </Link>
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-3">Garment Orientation</h1>
          <p className="text-sm text-archive-muted font-light">
            {reviewedCount} of {garments.length} reviewed. Unreviewed garments stay off the runway.
          </p>
          {!WRITES_ENABLED && (
            <p className="text-sm text-red-400 mt-3">Orientation review runs on the dev server only.</p>
          )}
        </div>

        {selected ? (
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
            <ul className="border border-archive-border divide-y divide-archive-border self-start">
              {garments.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    aria-current={g.id === selected.id}
                    onClick={() => router.replace(`?id=${encodeURIComponent(g.id)}`, { scroll: false })}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                      g.id === selected.id ? "bg-archive-surface-muted" : "hover:bg-archive-surface/50"
                    }`}
                  >
                    {g.orientationReviewed ? (
                      <Check className="w-4 h-4 text-green-400 shrink-0" aria-label="Reviewed" />
                    ) : (
                      <Circle className="w-4 h-4 text-archive-muted shrink-0" aria-label="Not reviewed" />
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{g.label}</span>
                      <span className="block text-xs text-archive-muted">{g.id}</span>
                    </span>
                    <span className="text-xs text-archive-muted">{g.model3d_rotationY ?? 0}°</span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Keyed by the stored angle too, so the draft resets once a save reloads the data. */}
            <ReviewPanel key={`${selected.id}:${selected.model3d_rotationY ?? 0}`} garment={selected} />
          </div>
        ) : (
          <p className="text-sm text-archive-muted">No runway garments with a 3D file.</p>
        )}
      </div>
    </div>
  );
}

function ReviewPanel({ garment }: { garment: Garment }) {
  const router = useRouter();
  const stored = garment.model3d_rotationY ?? 0;
  const [draft, setDraft] = useState(stored);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const url = getPreviewModelUrl(garment)!;

  const approve = async () => {
    setSaving(true);
    setStatus("Saving…");
    try {
      const res = await fetch("/api/admin/orientation", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: garment.id, rotationY: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setStatus(`Approved at ${data.garment.model3d_rotationY}° — reloading data…`);
      // Hot reload normally re-renders with the new garments.json; this covers it if not.
      router.refresh();
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-light">{garment.label}</h2>
        <p className="text-xs text-archive-muted mt-1">
          {garment.orientationReviewed ? "Reviewed" : "Not reviewed"} · stored {stored}° → draft {normalizeDegrees(draft)}°
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* The calibrated angle alone: a correct one shows the front head-on. */}
        <OrientationPreview url={url} yawDeg={draft} targetDeg={0} label="Front (6:00)" />
        <OrientationPreview
          url={url}
          yawDeg={runwayYawDeg(draft)}
          targetDeg={RUNWAY_OFFSET_DEGREES}
          label="Runway (4:30)"
        />
        <OrientationPreview
          url={url}
          yawDeg={itemPageYawDeg(draft)}
          targetDeg={ITEM_PAGE_OFFSET_DEGREES}
          label="Item page (7:30)"
        />
      </div>
      <p className="text-xs text-archive-muted">
        The camera stands where the visitor does. The gold line marks where the front should face: straight at
        the camera in the front view, toward its right on the runway, its left on the item page.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((step) => (
          <button key={step} type="button" onClick={() => setDraft((d) => d + step)} className={buttonClass}>
            {step > 0 ? `+${step}` : `−${-step}`}°
          </button>
        ))}
        <button type="button" onClick={() => setDraft(stored)} disabled={draft === stored} className={buttonClass}>
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
        <button
          type="button"
          onClick={approve}
          disabled={saving || !WRITES_ENABLED}
          className={approveClass}
        >
          <Check className="w-4 h-4" /> {saving ? "Saving…" : "Approve"}
        </button>
      </div>
      {status && <p className="text-xs text-archive-muted">{status}</p>}
    </div>
  );
}
