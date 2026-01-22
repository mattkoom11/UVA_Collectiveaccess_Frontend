import { Suspense } from "react";
import { notFound } from "next/navigation";
import BackstagePage from "@/components/backstage/BackstagePage";
import { getAllGarments, getGarmentById } from "@/lib/garments";

export async function generateStaticParams() {
  const allGarments = getAllGarments();
  return allGarments.map((g) => ({ id: g.id }));
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
  const garment = getGarmentById(id);

  if (!garment) {
    notFound();
  }

  return (
    <Suspense fallback={<BackstagePageFallback />}>
      <BackstagePage garmentId={id} />
    </Suspense>
  );
}

