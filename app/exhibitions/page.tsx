import { getAllGarments } from "@/lib/garments";
import PageLayout from "@/components/layout/PageLayout";
import ExhibitionsPageClient from "@/components/garments/ExhibitionsPageClient";
import { sampleExhibitions } from "@/data/exhibitions";

export default function ExhibitionsPage() {
  const allGarments = getAllGarments();
  return (
    <PageLayout>
      <ExhibitionsPageClient allGarments={allGarments} exhibitions={sampleExhibitions} />
    </PageLayout>
  );
}

