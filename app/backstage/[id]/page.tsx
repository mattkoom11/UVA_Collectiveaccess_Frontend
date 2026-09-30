import { redirect } from "next/navigation";
import { getGarmentById, hydrateGarmentsFromCA } from "@/lib/garments";

export const dynamic = "force-dynamic";

// Backstage was folded into the museum hall. Old links go to the garment's
// own record instead.
export default async function BackstageRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  hydrateGarmentsFromCA().catch(() => {});
  const garment = getGarmentById(id);
  redirect(garment ? `/garments/${garment.slug}` : "/collection");
}
