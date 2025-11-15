"use client";

import { Garment } from "@/types/garment";
import GarmentCard from "@/components/garments/GarmentCard";


interface Props {
  garments: Garment[];
}

export default function GarmentRunway({ garments }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 pb-4">
        {garments.map((g) => (
          <GarmentCard key={g.id} garment={g} variant="runway" />
        ))}
      </div>
    </div>
  );
}
