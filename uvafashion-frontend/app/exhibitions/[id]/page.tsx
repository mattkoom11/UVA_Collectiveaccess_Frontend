import { notFound } from "next/navigation";
import { getAllGarments } from "@/lib/garments";
import { getGarmentById } from "@/lib/garments";
import { sampleExhibitions } from "@/data/exhibitions";
import PageLayout from "@/components/layout/PageLayout";
import ExhibitionDetailClient from "@/components/garments/ExhibitionDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExhibitionDetailPage({ params }: Props) {
  const { id } = await params;
  const exhibition = sampleExhibitions.find((e) => e.id === id);

  if (!exhibition) {
    notFound();
  }

  const allGarments = getAllGarments();
  const garments = exhibition.garmentIds
    .map((id) => getGarmentById(id))
    .filter((g) => g !== undefined);

  return (
    <PageLayout>
      <ExhibitionDetailClient exhibition={exhibition} garments={garments} />
    </PageLayout>
  );
}

