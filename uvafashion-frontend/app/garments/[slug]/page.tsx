import { notFound } from "next/navigation";
import { getAllGarments, getGarmentBySlug, getGarmentById } from "@/lib/garments";
import { Garment, getEraFromDecade, getGarmentTypeFromWorkType } from "@/types/garment";
import Link from "next/link";
import Garment3DViewer from "@/components/garments/Garment3DViewer";
import GarmentDetailClient from "@/components/garments/GarmentDetailClient";
import GarmentDetailWithTabs from "@/components/garments/GarmentDetailWithTabs";

export async function generateStaticParams() {
  const garments = getAllGarments();
  return garments.map((g) => ({ slug: g.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function GarmentDetailPage({ params }: Props) {
  const { slug } = await params;
  const garment = getGarmentBySlug(slug);

  if (!garment) {
    notFound();
  }

  // Get related garments
  const relatedGarments: Garment[] = garment.relatedIds
    ? garment.relatedIds
        .map(id => getGarmentById(id))
        .filter((g): g is Garment => g !== undefined)
    : [];

  return (
    <GarmentDetailWithTabs garment={garment} relatedGarments={relatedGarments} />
  );
}
