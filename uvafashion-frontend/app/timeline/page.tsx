import { getAllGarments } from "@/lib/garments";
import PageLayout from "@/components/layout/PageLayout";
import TimelineView from "@/components/garments/TimelineView";

export default function TimelinePage() {
  const allGarments = getAllGarments();

  return (
    <PageLayout>
      <TimelineView garments={allGarments} />
    </PageLayout>
  );
}

