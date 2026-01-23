import { getAllGarments } from "@/lib/garments";
import PageLayout from "@/components/layout/PageLayout";
import StatisticsPageClient from "@/components/garments/StatisticsPageClient";
import { calculateStatistics } from "@/lib/statistics";

export default function StatisticsPage() {
  const allGarments = getAllGarments();
  const statistics = calculateStatistics(allGarments);
  
  return (
    <PageLayout>
      <StatisticsPageClient statistics={statistics} />
    </PageLayout>
  );
}

