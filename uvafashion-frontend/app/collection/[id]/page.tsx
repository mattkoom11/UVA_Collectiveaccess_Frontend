import { notFound } from "next/navigation";
import GarmentDetailView from "@/components/garments/GarmentDetailView";
import { sampleGarments } from "@/data/sampleGarments";

export async function generateStaticParams() {
  return sampleGarments.map((g) => ({ id: g.id }));
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GarmentDetailRoute({ params }: Props) {
  const { id } = await params;
  const garment = sampleGarments.find((g) => g.id === id);

  if (!garment) {
    notFound();
  }

  return <GarmentDetailView garment={garment} />;
}

