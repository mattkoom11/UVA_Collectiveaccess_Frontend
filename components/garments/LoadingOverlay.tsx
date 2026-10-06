"use client";

import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingOverlay({ message = "Loading...", fullScreen = false }: LoadingOverlayProps) {
  return (
    <div
      className={`${
        fullScreen ? "fixed inset-0" : "absolute inset-0"
      } bg-archive-bg/80 backdrop-blur-sm flex items-center justify-center z-50`}
    >
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-archive-muted mx-auto" />
        <p className="text-sm text-archive-muted font-light">{message}</p>
      </div>
    </div>
  );
}

