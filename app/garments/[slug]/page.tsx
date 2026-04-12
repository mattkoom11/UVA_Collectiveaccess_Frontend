import { notFound } from "next/navigation";
import { hydrateGarmentsFromCA, getAllGarments, getGarmentBySlug } from "@/lib/garments";
import { Garment } from "@/types/garment";
import GarmentDetailWithTabs from "@/components/garments/GarmentDetailWithTabs";
import { getEnhancedRelatedGarments } from "@/lib/relatedGarments";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await hydrateGarmentsFromCA();
  const garment = getGarmentBySlug(slug);

  if (!garment) {
    return {
      title: "Garment Not Found",
    };
  }

  const title = garment.editorial_title || garment.name || garment.label || "Garment";
  const description = garment.tagline || garment.description || garment.aesthetic_description || `Historic garment from the UVA Fashion Archive${garment.decade ? ` (${garment.decade})` : ""}`;
  const image = garment.thumbnailUrl || garment.imageUrl || (garment.images && garment.images[0]) || "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://uvafashionarchive.com";
  const url = `${baseUrl}/garments/${slug}`;

  return {
    title: `${title} | UVA Fashion Archive`,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "UVA Fashion Archive",
      images: image ? [{ url: image }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function GarmentDetailPage({ params }: Props) {
  const { slug } = await params;
  await hydrateGarmentsFromCA();
  const garment = getGarmentBySlug(slug);

  if (!garment) {
    notFound();
  }

  // Compute related garments server-side so client components get stable data
  const allGarments = getAllGarments();
  const relatedGarments: Garment[] = getEnhancedRelatedGarments(garment, allGarments, 4);

  return (
    <>
      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: garment.editorial_title || garment.name || garment.label,
            description: garment.description || garment.tagline || garment.aesthetic_description,
            image: garment.thumbnailUrl || garment.imageUrl || (garment.images && garment.images[0]),
            brand: {
              "@type": "Organization",
              name: "UVA Fashion Archive",
            },
            material: Array.isArray(garment.materials) ? garment.materials.join(", ") : garment.materials,
            color: Array.isArray(garment.colors) ? garment.colors.join(", ") : garment.colors,
            dateCreated: garment.date || garment.decade,
            additionalProperty: [
              { "@type": "PropertyValue", name: "Era", value: garment.era },
              { "@type": "PropertyValue", name: "Type", value: garment.work_type || garment.type },
              { "@type": "PropertyValue", name: "Accession Number", value: garment.accessionNumber },
            ].filter(p => p.value),
          }).replace(/</g, "\\u003c").replace(/>/g, "\\u003e"),
        }}
      />
      <GarmentDetailWithTabs garment={garment} relatedGarments={relatedGarments} allGarments={allGarments} />
    </>
  );
}
