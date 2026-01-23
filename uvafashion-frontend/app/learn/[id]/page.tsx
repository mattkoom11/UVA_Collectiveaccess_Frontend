import { notFound } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import LearnDetailClient from "@/components/garments/LearnDetailClient";
import { getEducationalContentById } from "@/data/educationalContent";

interface Props {
  params: Promise<{ id: string }>;
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

