"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAnalytics } from "@/lib/analytics";

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const analytics = getAnalytics();
    analytics.trackPageView(pathname || "/");
  }, [pathname]);

  return <>{children}</>;
}
