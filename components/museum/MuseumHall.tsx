"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Vector3 } from "three";
import { buildMuseumLayout, getPreviewModelUrl } from "@/lib/museum";
import {
  EYE_HEIGHT,
  LOBBY_INDEX,
  STAGE_INDEX,
  buildHallLayout,
  clampToBounds,
  hallSegments,
  wingIndexAt,
  type FlagshipSlot,
  type HallLayout,
} from "@/lib/hallLayout";
import { SEGMENT_PALETTES } from "@/lib/hallLighting";
import type { Garment } from "@/types/garment";
import HallArchitecture from "./HallArchitecture";
import LightPool from "./LightPool";
import SpotlightPool from "./SpotlightPool";
import { useHallQuality } from "./useHallQuality";
import HallControls from "./HallControls";
import InspectControls, { type CameraPose } from "./InspectControls";
import FlagshipGarment from "./FlagshipGarment";
import Lightbox from "./Lightbox";
import ArrivalShot from "./ArrivalShot";

const CLICK_TOLERANCE_PX = 6;
const ARRIVAL_SEEN_KEY = "hall-arrival-seen";

// Storage can throw (blocked site data); the shot then plays every visit.
function arrivalSeen(): boolean {
  try {
    return sessionStorage.getItem(ARRIVAL_SEEN_KEY) !== null;
  } catch {
    return false;
  }
}

function markArrivalSeen() {
  try {
    sessionStorage.setItem(ARRIVAL_SEEN_KEY, "1");
  } catch {
    // Nothing to remember it in.
  }
}

// After this long, the loading screen offers a way in without waiting for
// every scan (a slow connection, or a host that never answers).
const SLOW_LOAD_MS = 15_000;

/**
 * Covers the hall until every runway scan is in, so visitors never see
 * placeholders pop into garments. Fades out rather than vanishing.
 */
function LoadingScreen({
  done,
  loaded,
  total,
  onEnterNow,
}: {
  done: boolean;
  loaded: number;
  total: number;
  onEnterNow: () => void;
}) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_LOAD_MS);
    return () => window.clearTimeout(timer);
  }, []);
  const fraction = total === 0 ? 1 : loaded / total;

  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-archive-bg px-6 text-center transition-opacity duration-700 motion-reduce:transition-none ${done ? "opacity-0 pointer-events-none" : ""}`}
      aria-hidden={done}
    >
      <p className="eyebrow">Opening the galleries</p>
      <div
        role="progressbar"
        aria-label="Loading the garments"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={loaded}
        className="w-48 h-px bg-archive-border overflow-hidden"
      >
        <div
          className="h-full bg-archive-fg origin-left transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `scaleX(${fraction})` }}
        />
      </div>
      {total > 0 && (
        <p className="text-xs text-archive-muted tabular-nums">
          {loaded} of {total} garments
        </p>
      )}
      {slow && !done && (
        <button
          type="button"
          onClick={onEnterNow}
          className="text-xs uppercase tracking-[0.16em] text-archive-fg border-b border-archive-signal pb-1"
        >
          Enter now — the rest will follow
        </button>
      )}
    </div>
  );
}

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

// What the "you are here" label says for a wingIndexAt answer.
function locationLabel(layout: HallLayout, index: number): { title: string; detail?: string } {
  if (index === STAGE_INDEX) return { title: "New Acquisitions · Recently scanned, research in progress" };
  const wing = index >= 0 ? layout.wings[index] : null;
  if (!wing) return { title: "Entrance" };
  if (wing.comingSoon) return { title: `Wing ${wing.numeral} · ${wing.label} · Coming soon` };
  return {
    title: `Wing ${wing.numeral} · ${wing.label}`,
    detail: `${wing.flagshipSlots.length} on the runway · ${wing.lightboxSlots.length} on the walls`,
  };
}

export default function MuseumHall({ garments, intro = false }: { garments: Garment[]; intro?: boolean }) {
  const layout = useMemo(() => buildHallLayout(buildMuseumLayout(garments)), [garments]);
  const segments = useMemo(() => hallSegments(layout), [layout]);
  const quality = useHallQuality();
  const litSlots = useMemo(
    () =>
      segments.flatMap((s) =>
        s.flagshipSlots.map((slot) => ({
          id: slot.garment.id,
          position: slot.position,
          color: SEGMENT_PALETTES[s.key].spot,
        })),
      ),
    [segments],
  );
  const [wingIndex, setWingIndex] = useState(LOBBY_INDEX);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [photo, setPhoto] = useState<Garment | null>(null);
  const [ready, setReady] = useState(false);
  // Every runway preview that has loaded, or failed to.
  const [settled, setSettled] = useState<ReadonlySet<string>>(() => new Set());
  const [hallReady, setHallReady] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  // The first homepage visit of a session opens with a glide into the hall.
  const [arriving, setArriving] = useState(() => intro && !arrivalSeen());
  const walkTargetRef = useRef<Vector3 | null>(null);
  const returnPoseRef = useRef<CameraPose | null>(null);
  // The press that skips the arrival shot shouldn't also walk or open a garment.
  const pressBeganArriving = useRef(false);

  useEffect(() => {
    const onDown = () => {
      pressBeganArriving.current = arriving;
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [arriving]);

  const finishArrival = useCallback(() => {
    setArriving(false);
    markArrivalSeen();
  }, []);

  const expectedIds = useMemo(
    () =>
      segments.flatMap((s) =>
        s.flagshipSlots.filter((slot) => getPreviewModelUrl(slot.garment)).map((slot) => slot.garment.id),
      ),
    [segments],
  );
  // One stable callback per flagship, so FittedModel's effect fires once.
  const settleCallbacks = useMemo(
    () =>
      new Map(
        expectedIds.map((id) => [
          id,
          () => setSettled((prev) => (prev.has(id) ? prev : new Set(prev).add(id))),
        ]),
      ),
    [expectedIds],
  );
  const settledCount = expectedIds.filter((id) => settled.has(id)).length;
  const allSettled = ready && settledCount === expectedIds.length;

  // A loaded scan still has its texture uploaded on its first rendered frame;
  // wait two frames so that hitch happens behind the loading screen.
  useEffect(() => {
    if (!allSettled || hallReady) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setHallReady(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [allSettled, hallReady]);

  const enterNow = useCallback(() => setHallReady(true), []);

  const walking = inspection === null && photo === null;
  const inspecting = inspection?.phase === "enter" ? inspection.slot : null;
  // Walking controls pause during inspection, so follow the garment's wing.
  const shownWingIndex = inspecting ? wingIndexAt(layout, inspecting.position[2]) : wingIndex;
  const location = locationLabel(layout, shownWingIndex);

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

  // Clicks act only while walking, and never for the press that skipped the arrival shot.
  const canAct = () => walking && !arriving && !pressBeganArriving.current;

  const handleFloorClick = (e: ThreeEvent<MouseEvent>) => {
    if (!canAct() || e.delta > CLICK_TOLERANCE_PX) return;
    const [x, z] = clampToBounds(layout, e.point.x, e.point.z);
    walkTargetRef.current = new Vector3(x, EYE_HEIGHT, z);
  };

  const handleSelectFlagship = (slot: FlagshipSlot) => {
    if (canAct()) setInspection({ slot, phase: "enter" });
  };

  const handleSelectPhoto = (garment: Garment) => {
    if (canAct()) setPhoto(garment);
  };

  // The welcome panel closes once the visitor enters, or sets off walking.
  const showIntro = intro && hallReady && !introDismissed && wingIndex === LOBBY_INDEX && walking;

  const dismissIntro = useCallback(() => setIntroDismissed(true), []);

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
        dpr={quality.dpr}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        style={{ touchAction: "none" }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.05;
          setReady(true);
        }}
      >
        <color attach="background" args={["#0b0b0c"]} />
        <fog attach="fog" args={["#0b0b0c", 16, 75]} />

        <HallArchitecture
          layout={layout}
          segments={segments}
          glossy={quality.glossyRunway}
          onFloorClick={handleFloorClick}
        />
        <SpotlightPool slots={litSlots} count={quality.spotlights} />

        {/* Outside any Suspense: lit from the first frame, and still there if a scan fails. */}
        {segments.map((s) =>
          s.flagshipSlots.map((slot) => (
            <LightPool key={`pool-${slot.garment.id}`} position={slot.position} color={SEGMENT_PALETTES[s.key].wash} />
          )),
        )}

        {segments.map((s) =>
          s.flagshipSlots.map((slot) => (
            <FlagshipGarment
              key={slot.garment.id}
              slot={slot}
              inspecting={inspecting?.garment.id === slot.garment.id}
              onSelect={handleSelectFlagship}
              onPreviewSettled={settleCallbacks.get(slot.garment.id)}
            />
          )),
        )}
        {layout.wings.map((w) =>
          w.lightboxSlots.map((slot) => (
            <Lightbox key={slot.garment.id} slot={slot} onSelect={handleSelectPhoto} />
          )),
        )}

        <HallControls
          layout={layout}
          enabled={walking && !arriving && hallReady}
          walkTargetRef={walkTargetRef}
          onWingChange={setWingIndex}
          onStepIn={dismissIntro}
        />
        {inspection && (
          <InspectControls
            key={`${inspection.slot.garment.id}-${inspection.phase}`}
            slot={inspection.slot}
            phase={inspection.phase}
            returnPoseRef={returnPoseRef}
            onExited={() => setInspection(null)}
          />
        )}
        {arriving && hallReady && <ArrivalShot start={layout.start} onDone={finishArrival} />}
      </Canvas>

      {/* Where you are: the one place the accent color marks "you are here". */}
      <div
        className={`pointer-events-none absolute top-5 left-5 md:top-6 md:left-8 transition-opacity duration-500 motion-reduce:transition-none ${showIntro ? "opacity-0" : "delay-100"}`}
        aria-live="polite"
      >
        <p className="eyebrow flex items-center gap-2 text-archive-fg">
          <span className="w-2 h-2 rounded-full bg-archive-signal" aria-hidden="true" />
          {location.title}
        </p>
        {location.detail && <p className="text-xs text-archive-muted mt-1.5 pl-4">{location.detail}</p>}
      </div>

      {intro && (
        // Lifts away and fades as the visitor steps in, rather than vanishing.
        // Hidden, it stays in the DOM so the heading remains for screen
        // readers; the paragraph and buttons go inert.
        <div
          className={`absolute inset-x-0 bottom-0 md:inset-y-0 md:right-auto md:w-[min(34rem,50%)] flex flex-col justify-end md:justify-center gap-6 p-6 pb-10 md:p-16 bg-gradient-to-t md:bg-gradient-to-r from-archive-bg via-archive-bg/85 to-transparent transition-[opacity,translate] duration-700 ease-out motion-reduce:transition-none ${showIntro ? "" : "opacity-0 -translate-y-4 pointer-events-none"} ${showIntro && arriving ? "pointer-events-none animate-[fade-in_2s_ease-out_2s_both]" : ""}`}
        >
          <p className="eyebrow text-archive-signal">The Museum</p>
          <h1 className="font-serif italic text-5xl md:text-6xl leading-[1.02] text-archive-fg">
            Step into the archive.
          </h1>
          <div inert={!showIntro} className="contents">
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
          </div>
        </div>
      )}

      {walking && hallReady && (
        <p
          className={`pointer-events-none absolute bottom-5 inset-x-0 text-center eyebrow px-4 transition-opacity duration-500 motion-reduce:transition-none ${showIntro || arriving ? "opacity-0" : "delay-100"}`}
        >
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

      <LoadingScreen done={hallReady} loaded={settledCount} total={expectedIds.length} onEnterNow={enterNow} />

      {/* The hall as a plain list, for screen readers and keyboard users. */}
      <nav aria-label="Garments in the hall" className="sr-only">
        {layout.stage && (
          <div>
            <h2>New Acquisitions</h2>
            <ul>
              {layout.stage.flagshipSlots.map(({ garment }) => (
                <li key={garment.id}>
                  <Link href={`/garments/${garment.slug}`}>{garment.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
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
