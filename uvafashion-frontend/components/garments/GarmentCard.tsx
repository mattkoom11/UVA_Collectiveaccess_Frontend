import Link from "next/link";
import { Garment } from "@/types/garment";

interface Props {
  garment: Garment;
  variant?: "runway" | "grid";
}

export default function GarmentCard({ garment, variant = "grid" }: Props) {
  const base = variant === "runway" ? "w-52" : "w-full";

  return (
    <Link
      href={`/garments/${garment.slug}`}
      className={`${base} flex flex-col border border-zinc-700 bg-zinc-900 hover:border-zinc-100 transition`}
    >
      <div className="aspect-[3/4] bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
        {/* Later: replace with <Image src={...} /> */}
        Image
      </div>
      <div className="p-3 space-y-1">
        <div className="text-[0.7rem] uppercase tracking-[0.2em] text-zinc-400">
          {garment.work_type || "Garment"}
        </div>
        <div className="text-sm font-medium leading-snug">
          {garment.label}
        </div>
        <div className="text-[0.7rem] text-zinc-400">
          {garment.decade || garment.date}
        </div>
      </div>
    </Link>
  );
}
