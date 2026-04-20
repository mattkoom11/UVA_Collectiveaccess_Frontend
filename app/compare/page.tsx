import { Suspense } from "react";
import { getAllGarments } from "@/lib/garments";
import PageLayout from "@/components/layout/PageLayout";
import ComparePageClient from "@/components/garments/ComparePageClient";
import SkeletonCard from "@/components/garments/SkeletonCard";

function CompareSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const allGarments = getAllGarments();
  return (
    <PageLayout>
      <Suspense fallback={<CompareSkeleton />}>
        <ComparePageClient allGarments={allGarments} />
      </Suspense>
    </PageLayout>
  );
}

