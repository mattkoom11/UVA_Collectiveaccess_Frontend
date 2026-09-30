import type { Metadata } from "next";
import MuseumHallLoader from "@/components/museum/MuseumHallLoader";
import { hydrateGarmentsFromCA, getAllGarments } from "@/lib/garments";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://uvafashionarchive.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "UVA Fashion Archive",
  description: "Explore the University of Virginia's historic clothing collection — garments spanning over a century of fashion history.",
  openGraph: {
    title: "UVA Fashion Archive",
    description: "Explore the University of Virginia's historic clothing collection — garments spanning over a century of fashion history.",
    siteName: "UVA Fashion Archive",
    type: "website",
    images: [{ url: "/og-default.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "UVA Fashion Archive",
    description: "Explore the University of Virginia's historic clothing collection — garments spanning over a century of fashion history.",
    images: ["/og-default.jpg"],
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default async function HomeRoute() {
  hydrateGarmentsFromCA().catch(() => {});
  // The homepage is the museum's entrance.
  return <MuseumHallLoader garments={getAllGarments()} intro />;
}
