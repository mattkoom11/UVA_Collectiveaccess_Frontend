import HomePage from "@/components/home/HomePage";
import { hydrateGarmentsFromCA, getAllGarments } from "@/lib/garments";

export const dynamic = "force-dynamic";

export default async function HomeRoute() {
  await hydrateGarmentsFromCA();
  const garments = getAllGarments();
  return <HomePage garments={garments} />;
}
