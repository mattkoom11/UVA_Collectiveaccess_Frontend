import PageLayout from "@/components/layout/PageLayout";
import LearnPageClient from "@/components/garments/LearnPageClient";
import { educationalContent } from "@/data/educationalContent";

export default function LearnPage() {
  return (
    <PageLayout>
      <LearnPageClient content={educationalContent} />
    </PageLayout>
  );
}

