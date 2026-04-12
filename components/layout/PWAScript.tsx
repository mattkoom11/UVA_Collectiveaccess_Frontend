"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa";

export default function PWAScript() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
