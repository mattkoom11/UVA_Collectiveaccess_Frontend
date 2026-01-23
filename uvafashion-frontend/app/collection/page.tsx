import { Suspense } from "react";
import CollectionPage from "@/components/garments/CollectionPage";

export default function CollectionRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center"><p className="text-zinc-400">Loading...</p></div>}>
      <CollectionPage />
    </Suspense>
  );
}

