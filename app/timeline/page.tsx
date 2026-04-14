import { hydrateGarmentsFromCA, getAllGarments } from "@/lib/garments";
import PageLayout from "@/components/layout/PageLayout";
import TimelineView from "@/components/garments/TimelineView";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  await hydrateGarmentsFromCA();
  const allGarments = getAllGarments();

  return (
    <PageLayout>
      <TimelineView garments={allGarments} />
    </PageLayout>
  );
}
