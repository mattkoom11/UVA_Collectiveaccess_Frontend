import { Suspense } from "react";
import { notFound } from "next/navigation";
import BackstagePage from "@/components/backstage/BackstagePage";
import { sampleGarments } from "@/data/sampleGarments";
import { getAllGarments } from "@/lib/garments";

export async function generateStaticParams() {
  const sampleIds = sampleGarments.map((g) => ({ id: g.id }));
  const allGarments = getAllGarments();
  const allIds = allGarments.map((g) => ({ id: g.id }));
  // Combine and deduplicate
  const allParams = [...sampleIds, ...allIds];
  const uniqueParams = Array.from(
    new Map(allParams.map((p) => [p.id, p])).values()
  );
  return uniqueParams;
}

interface Props {
  params: Promise<{ id: string }>;
}

function BackstagePageFallback() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex items-center justify-center">
      <p className="text-zinc-600">Loading backstage...</p>
    </div>
  );
}

export default async function BackstageRoute({ params }: Props) {
  const { id } = await params;
  // Check both sampleGarments and getAllGarments
  let garment = sampleGarments.find((g) => g.id === id);
  if (!garment) {
    const allGarments = getAllGarments();
    garment = allGarments.find((g) => g.id === id);
  }

  if (!garment) {
    notFound();
  }

  return (
    <Suspense fallback={<BackstagePageFallback />}>
      <BackstagePage garmentId={id} />
    </Suspense>
  );
}

