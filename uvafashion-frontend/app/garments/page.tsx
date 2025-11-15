import PageShell from "@/components/layout/PageShell";
import GarmentSearchClient from "@/components/garments/GarmentSearchClient";



export default function GarmentsPage() {
  return (
    <PageShell
      title="The Closet"
      subtitle="Search and filter through garments as if you were walking past hangers in a closet or watching looks cross a runway."
    >
      <GarmentSearchClient />
    </PageShell>
  );
}
