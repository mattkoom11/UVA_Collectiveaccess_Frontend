import { notFound } from "next/navigation";
import { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import LearnDetailClient from "@/components/garments/LearnDetailClient";
import { getEducationalContentById, educationalContent } from "@/data/educationalContent";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return educationalContent.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const content = getEducationalContentById(id);
  if (!content) return { title: "Not Found | UVA Fashion Archive" };
  const title = content.subtitle ? `${content.title}: ${content.subtitle}` : content.title;
  const description = content.content.split("\n\n")[0].replace(/\*\*/g, "").slice(0, 160) + (content.content.length > 160 ? "..." : "");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://uvafashionarchive.com";
  return {
    title: `${title} | UVA Fashion Archive`,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/learn/${content.id}`,
      siteName: "UVA Fashion Archive",
      type: "article",
      ...(content.imageUrl && { images: [{ url: content.imageUrl }] }),
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `${baseUrl}/learn/${content.id}` },
  };
}

export default async function LearnDetailPage({ params }: Props) {
  const { id } = await params;
  const content = getEducationalContentById(id);

  if (!content) {
    notFound();
  }

  return (
    <PageLayout>
      <LearnDetailClient content={content} />
    </PageLayout>
  );
}

