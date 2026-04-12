"use client";

import { ReactNode } from "react";

export default function FadeIn({ children }: { children: ReactNode }) {
  return (
    <div className="animate-[fadein_120ms_ease-out]">
      {children}
    </div>
  );
}
