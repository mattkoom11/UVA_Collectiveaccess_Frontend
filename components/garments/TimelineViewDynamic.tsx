"use client";

import dynamic from "next/dynamic";
import { Garment } from "@/types/garment";

const TimelineView = dynamic(
  () => import("@/components/garments/TimelineView"),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-archive-surface-muted" />
          <div className="h-4 w-full max-w-xl bg-archive-surface-muted/60" />
          <div className="h-64 bg-archive-surface-muted/40" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-archive-surface-muted/50" />
            ))}
          </div>
        </div>
      </div>
    ),
  }
);

interface TimelineViewDynamicProps {
  garments: Garment[];
}

export default function TimelineViewDynamic({ garments }: TimelineViewDynamicProps) {
  return <TimelineView garments={garments} />;
}
