"use client";

import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHome?: boolean;
}

export default function ErrorState({
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again or return to the homepage.",
  onRetry,
  showHome = true,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex justify-center mb-6">
        <AlertCircle className="w-16 h-16 text-zinc-400" aria-hidden />
      </div>
      <h2 className="text-xl md:text-2xl font-light text-zinc-200 mb-2">{title}</h2>
      <p className="text-sm text-zinc-400 font-light max-w-md mb-8">{message}</p>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm uppercase tracking-[0.1em] text-zinc-200"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
        {showHome && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm uppercase tracking-[0.1em] text-zinc-200"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        )}
      </div>
    </div>
  );
}
