import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";
import { hydrateGarmentsFromCA, getAllGarments } from "@/lib/garments";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "UVA Fashion Archive",
  description: "Explore the University of Virginia's historic clothing collection — garments spanning over a century of fashion history.",
  openGraph: {
    title: "UVA Fashion Archive",
    description: "Explore the University of Virginia's historic clothing collection — garments spanning over a century of fashion history.",
    siteName: "UVA Fashion Archive",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UVA Fashion Archive",
    description: "Explore the University of Virginia's historic clothing collection — garments spanning over a century of fashion history.",
  },
};

export default async function HomeRoute() {
  await hydrateGarmentsFromCA();
  const garments = getAllGarments();
  return <HomePage garments={garments} />;
}
