import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getGarmentById } from "@/lib/garments";
import { sampleExhibitions } from "@/data/exhibitions";
import PageLayout from "@/components/layout/PageLayout";
import ExhibitionDetailClient from "@/components/garments/ExhibitionDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const exhibition = sampleExhibitions.find((e) => e.id === id);
  if (!exhibition) return { title: "Not Found | UVA Fashion Archive" };
  const title = exhibition.subtitle ? `${exhibition.title}: ${exhibition.subtitle}` : exhibition.title;
  const description = (exhibition.description || "").slice(0, 160) + (exhibition.description && exhibition.description.length > 160 ? "..." : "");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://uvafashionarchive.com";
  return {
    title: `${title} | UVA Fashion Archive`,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/exhibitions/${exhibition.id}`,
      siteName: "UVA Fashion Archive",
      type: "website",
      ...(exhibition.imageUrl && { images: [{ url: exhibition.imageUrl }] }),
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `${baseUrl}/exhibitions/${exhibition.id}` },
  };
}

export default async function ExhibitionDetailPage({ params }: Props) {
  const { id } = await params;
  const exhibition = sampleExhibitions.find((e) => e.id === id);

  if (!exhibition) {
    notFound();
  }

  const garments = exhibition.garmentIds
    .map((gid) => getGarmentById(gid))
    .filter((g) => g !== undefined);

  return (
    <PageLayout>
      <ExhibitionDetailClient exhibition={exhibition} garments={garments} />
    </PageLayout>
  );
}

