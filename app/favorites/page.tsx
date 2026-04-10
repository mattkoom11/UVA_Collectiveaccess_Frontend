import { getAllGarments } from "@/lib/garments";
import PageLayout from "@/components/layout/PageLayout";
import FavoritesPageClient from "@/components/garments/FavoritesPageClient";

export default function FavoritesPage() {
  const allGarments = getAllGarments();
  return (
    <PageLayout>
      <FavoritesPageClient allGarments={allGarments} />
    </PageLayout>
  );
}

