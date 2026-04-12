import { Suspense } from "react";
import { getAllGarments } from "@/lib/garments";
import PageLayout from "@/components/layout/PageLayout";
import ComparePageClient from "@/components/garments/ComparePageClient";

export default function ComparePage() {
  const allGarments = getAllGarments();
  return (
    <PageLayout>
      <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center"><p className="text-zinc-400">Loading...</p></div>}>
        <ComparePageClient allGarments={allGarments} />
      </Suspense>
    </PageLayout>
  );
}

