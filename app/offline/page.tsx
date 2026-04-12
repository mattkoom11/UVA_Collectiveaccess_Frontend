"use client";

import PageLayout from "@/components/layout/PageLayout";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="flex justify-center">
            <WifiOff className="w-16 h-16 text-zinc-400" />
          </div>
          <h1 className="text-3xl font-light">You're Offline</h1>
          <p className="text-zinc-400 font-light">
            It looks like you've lost your internet connection. Some content may still be available offline.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm uppercase tracking-[0.1em]"
          >
            Try Again
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
