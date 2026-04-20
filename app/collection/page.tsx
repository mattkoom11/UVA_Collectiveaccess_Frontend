import type { Metadata } from "next";
import CollectionPage from "@/components/garments/CollectionPage";
import { hydrateGarmentsFromCA, getAllGarments } from "@/lib/garments";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collection | UVA Fashion Archive",
  description: "Browse the full UVA Historic Clothing Collection — filter by era, type, color, and material.",
  openGraph: {
    title: "Collection | UVA Fashion Archive",
    description: "Browse the full UVA Historic Clothing Collection — filter by era, type, color, and material.",
    siteName: "UVA Fashion Archive",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Collection | UVA Fashion Archive",
    description: "Browse the full UVA Historic Clothing Collection.",
  },
};

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CollectionRoute({ searchParams }: Props) {
  await hydrateGarmentsFromCA();
  const garments = getAllGarments();
  const params = await searchParams;
  // Normalise: Next.js can return string | string[] — take first value if array
  const sp: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(params)) {
    sp[k] = Array.isArray(v) ? v[0] : v;
  }
  return <CollectionPage garments={garments} initialSearchParams={sp} />;
}
