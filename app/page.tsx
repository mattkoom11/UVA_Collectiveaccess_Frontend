import HomePage from "@/components/home/HomePage";
import { getAllGarments } from "@/lib/garments";

export const dynamic = "force-dynamic";

export default function HomeRoute() {
  const garments = getAllGarments();
  return <HomePage garments={garments} />;
}
