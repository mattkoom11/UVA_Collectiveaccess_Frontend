import { Suspense } from "react";
import CollectionPage from "@/components/garments/CollectionPage";
import { getAllGarments } from "@/lib/garments";

export const dynamic = "force-dynamic";

export default function CollectionRoute() {
  const garments = getAllGarments();
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center"><p className="text-zinc-400">Loading...</p></div>}>
      <CollectionPage garments={garments} />
    </Suspense>
  );
}

