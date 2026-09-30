"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Vector3 } from "three";
import { buildMuseumLayout } from "@/lib/museum";
import { EYE_HEIGHT, buildHallLayout, clampToBounds, wingIndexAt, type FlagshipSlot } from "@/lib/hallLayout";
import type { Garment } from "@/types/garment";
import HallArchitecture from "./HallArchitecture";
import HallControls from "./HallControls";
import InspectControls, { type CameraPose } from "./InspectControls";
import FlagshipGarment from "./FlagshipGarment";
import Lightbox from "./Lightbox";

const CLICK_TOLERANCE_PX = 6;

interface Inspection {
  slot: FlagshipSlot;
  phase: "enter" | "exit";
}

function Placard({ garment }: { garment: Garment }) {
  const details = [garment.date, garment.materials?.join(", ")].filter(Boolean).join(" · ");
  return (
    <div>
      {garment.accessionNumber && <p className="eyebrow">No. {garment.accessionNumber}</p>}
      <h2 className="font-serif text-2xl leading-tight text-archive-fg mt-2">{garment.label}</h2>
      {details && <p className="text-sm text-archive-muted-subtle mt-2">{details}</p>}
      {garment.tagline && <p className="text-sm italic text-archive-muted mt-3">{garment.tagline}</p>}
      <Link
        href={`/garments/${garment.slug}`}
        className="inline-block mt-5 text-xs uppercase tracking-[0.16em] text-archive-signal border-b border-archive-signal pb-1"
      >
        View full record →
      </Link>
    </div>
  );
}

export default function MuseumHall({ garments, intro = false }: { garments: Garment[]; intro?: boolean }) {
  const layout = useMemo(() => buildHallLayout(buildMuseumLayout(garments)), [garments]);
  const [wingIndex, setWingIndex] = useState(-1);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [photo, setPhoto] = useState<Garment | null>(null);
  const [ready, setReady] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const walkTargetRef = useRef<Vector3 | null>(null);
  const returnPoseRef = useRef<CameraPose | null>(null);

  const walking = inspection === null && photo === null;
  const inspecting = inspection?.phase === "enter" ? inspection.slot : null;
  // Walking controls pause during inspection, so follow the garment's wing.
  const shownWingIndex = inspecting ? wingIndexAt(layout, inspecting.position[2]) : wingIndex;
  const wing = shownWingIndex >= 0 ? layout.wings[shownWingIndex] : null;

  const leaveInspection = useCallback(() => {
    setInspection((current) => (current ? { ...current, phase: "exit" } : null));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (photo) setPhoto(null);
      else leaveInspection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photo, leaveInspection]);

  const handleFloorClick = (e: ThreeEvent<MouseEvent>) => {
    if (!walking || e.delta > CLICK_TOLERANCE_PX) return;
    const [x, z] = clampToBounds(layout, e.point.x, e.point.z);
    walkTargetRef.current = new Vector3(x, EYE_HEIGHT, z);
  };

  const handleSelectFlagship = (slot: FlagshipSlot) => {
    if (walking) setInspection({ slot, phase: "enter" });
  };

  const handleSelectPhoto = (garment: Garment) => {
    if (walking) setPhoto(garment);
  };

  // The welcome panel closes once the visitor enters, or walks into Wing I.
  const showIntro = intro && ready && !introDismissed && wingIndex < 0 && walking;

  const enterGalleries = () => {
    setIntroDismissed(true);
    walkTargetRef.current = new Vector3(layout.start.position[0], EYE_HEIGHT, -2);
  };

  return (
    <section
      aria-label="The museum hall"
      className="relative w-full h-[calc(100dvh-var(--header-h,7.6rem))] min-h-[480px] bg-archive-bg overflow-hidden select-none"
    >
      <Canvas
        // Giving a rotation stops R3F aiming the camera at the origin.
        camera={{ fov: 62, near: 0.05, far: 140, position: layout.start.position, rotation: [0, layout.start.yaw, 0] }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        style={{ touchAction: "none" }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.05;
          setReady(true);
        }}
      >
        <color attach="background" args={["#0b0b0c"]} />
        <fog attach="fog" args={["#0b0b0c", 16, 75]} />

        <HallArchitecture layout={layout} onFloorClick={handleFloorClick} />

        {layout.wings.map((w) =>
          w.flagshipSlots.map((slot) => (
            <FlagshipGarment
              key={slot.garment.id}
              slot={slot}
              inspecting={inspecting?.garment.id === slot.garment.id}
              onSelect={handleSelectFlagship}
            />
          )),
        )}
        {layout.wings.map((w) =>
          w.lightboxSlots.map((slot) => (
            <Lightbox key={slot.garment.id} slot={slot} onSelect={handleSelectPhoto} />
          )),
        )}

        <HallControls layout={layout} enabled={walking} walkTargetRef={walkTargetRef} onWingChange={setWingIndex} />
        {inspection && (
          <InspectControls
            key={`${inspection.slot.garment.id}-${inspection.phase}`}
            slot={inspection.slot}
            phase={inspection.phase}
            returnPoseRef={returnPoseRef}
            onExited={() => setInspection(null)}
          />
        )}
      </Canvas>

      {/* Where you are: the one place the accent color marks "you are here". */}
      <div
        className={`pointer-events-none absolute top-5 left-5 md:top-6 md:left-8 ${showIntro ? "invisible" : ""}`}
        aria-live="polite"
      >
        <p className="eyebrow flex items-center gap-2 text-archive-fg">
          <span className="w-2 h-2 rounded-full bg-archive-signal" aria-hidden="true" />
          {wing ? `Wing ${wing.numeral} · ${wing.label}` : "Entrance"}
        </p>
        {wing && (
          <p className="text-xs text-archive-muted mt-1.5 pl-4">
            {wing.flagshipSlots.length} on the runway · {wing.lightboxSlots.length} on the walls
          </p>
        )}
      </div>

      {intro && (
        <div
          className={
            showIntro
              ? "absolute inset-x-0 bottom-0 md:inset-y-0 md:right-auto md:w-[min(34rem,50%)] flex flex-col justify-end md:justify-center gap-6 p-6 pb-10 md:p-16 bg-gradient-to-t md:bg-gradient-to-r from-archive-bg via-archive-bg/85 to-transparent"
              : "sr-only"
          }
        >
          <p className="eyebrow text-archive-signal">The Museum</p>
          <h1 className="font-serif italic text-5xl md:text-6xl leading-[1.02] text-archive-fg">
            Step into the archive.
          </h1>
          {showIntro && (
            <>
              <p className="text-base leading-relaxed text-archive-muted-subtle max-w-sm">
                Walk the galleries wing by wing, through a century of dress from hand-stitched silk to the present day.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <button
                  type="button"
                  onClick={enterGalleries}
                  className="text-xs uppercase tracking-[0.16em] text-archive-fg border-b border-archive-signal pb-1.5"
                >
                  Enter the galleries →
                </button>
                <Link
                  href="/collection"
                  className="text-xs uppercase tracking-[0.16em] text-archive-muted hover:text-archive-fg transition-colors"
                >
                  Browse the collection
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {walking && ready && !showIntro && (
        <p className="pointer-events-none absolute bottom-5 inset-x-0 text-center eyebrow px-4">
          <span className="pointer-coarse:hidden">
            Drag to look · Click the floor to walk · WASD to move · Click a garment to inspect
          </span>
          <span className="hidden pointer-coarse:inline">
            Drag to look · Tap the floor to walk · Tap a garment to inspect
          </span>
        </p>
      )}

      {inspecting && (
        <aside className="absolute right-4 top-4 md:right-8 md:top-6 w-[min(22rem,calc(100%-2rem))] bg-archive-surface/95 border border-archive-border p-6">
          <Placard garment={inspecting.garment} />
          <div className="mt-6 pt-4 border-t border-archive-border flex items-center justify-between gap-4">
            <p className="eyebrow">
              Drag to orbit · <span className="pointer-coarse:hidden">Scroll</span>
              <span className="hidden pointer-coarse:inline">Pinch</span> to zoom
            </p>
            <button
              type="button"
              autoFocus
              onClick={leaveInspection}
              className="text-xs uppercase tracking-[0.16em] text-archive-fg border border-archive-border-hover px-3 py-2 hover:bg-archive-surface-muted transition-colors"
            >
              Back to the hall
            </button>
          </div>
        </aside>
      )}

      {photo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={photo.label}
          className="absolute inset-0 z-10 flex items-center justify-center bg-archive-bg/85 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPhoto(null);
          }}
        >
          <div className="flex flex-col md:flex-row gap-6 bg-archive-surface border border-archive-border p-6 max-w-3xl w-full max-h-full overflow-y-auto">
            {(photo.imageUrl || photo.images[0]) && (
              // eslint-disable-next-line @next/next/no-img-element -- CA media host isn't configured for next/image
              <img
                src={photo.imageUrl || photo.images[0]}
                alt={photo.label}
                className="w-full md:w-1/2 max-h-[60dvh] object-contain bg-archive-bg"
              />
            )}
            <div className="flex-1 flex flex-col justify-between gap-6">
              <Placard garment={photo} />
              <button
                type="button"
                autoFocus
                onClick={() => setPhoto(null)}
                className="self-start text-xs uppercase tracking-[0.16em] text-archive-fg border border-archive-border-hover px-3 py-2 hover:bg-archive-surface-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-archive-bg">
          <div className="w-8 h-8 border border-archive-border border-t-archive-fg rounded-full animate-spin mb-4" />
          <p className="eyebrow">Opening the galleries</p>
        </div>
      )}

      {/* The hall as a plain list, for screen readers and keyboard users. */}
      <nav aria-label="Garments in the hall" className="sr-only">
        {layout.wings.map((w) => (
          <div key={w.era}>
            <h2>Wing {w.numeral}, {w.label}</h2>
            <ul>
              {[...w.flagshipSlots, ...w.lightboxSlots].map(({ garment }) => (
                <li key={garment.id}>
                  <Link href={`/garments/${garment.slug}`}>{garment.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </section>
  );
}
