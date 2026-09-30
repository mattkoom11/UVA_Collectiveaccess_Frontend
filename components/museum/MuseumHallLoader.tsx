"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ErrorBoundary from "@/components/garments/ErrorBoundary";
import type { Garment } from "@/types/garment";

function HallMessage({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-[calc(100dvh-var(--header-h,7.6rem))] min-h-[480px] bg-archive-bg flex flex-col items-center justify-center gap-5 px-6 text-center">
      {children}
    </div>
  );
}

const Opening = () => (
  <HallMessage>
    <p className="eyebrow">Opening the galleries</p>
  </HallMessage>
);

// Three.js runs in the browser only.
const MuseumHall = dynamic(() => import("./MuseumHall"), { ssr: false, loading: Opening });

let canShowHallCache: boolean | undefined;

// Visitors whose device can't run WebGL, or who prefer reduced motion, get
// the Collection instead of a 3D walk.
function canShowHall(): boolean {
  if (canShowHallCache === undefined) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    canShowHallCache = !reducedMotion && gl !== null;
  }
  return canShowHallCache;
}

const noSubscription = () => () => {};

export default function MuseumHallLoader({ garments, intro = false }: { garments: Garment[]; intro?: boolean }) {
  const router = useRouter();
  // null on the server and during hydration; the real answer on the client.
  const supported = useSyncExternalStore(noSubscription, canShowHall, () => null);

  useEffect(() => {
    if (supported === false) router.replace("/collection");
  }, [supported, router]);

  if (supported !== true) return <Opening />;

  return (
    <ErrorBoundary
      fallback={
        <HallMessage>
          <p className="eyebrow">The galleries are unavailable right now</p>
          <Link href="/collection" className="text-xs uppercase tracking-[0.16em] text-archive-fg border-b border-archive-signal pb-1">
            Browse the collection →
          </Link>
        </HallMessage>
      }
    >
      <MuseumHall garments={garments} intro={intro} />
    </ErrorBoundary>
  );
}
