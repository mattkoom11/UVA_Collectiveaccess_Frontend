import { Suspense } from "react";
import RunwayPage from "@/components/runway/RunwayPage";

function RunwayPageFallback() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
      <p className="text-zinc-400">Loading runway...</p>
    </div>
  );
}

export default function RunwayRoute() {
  return (
    <Suspense fallback={<RunwayPageFallback />}>
      <RunwayPage />
    </Suspense>
  );
}

