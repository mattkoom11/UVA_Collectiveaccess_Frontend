import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-archive-bg text-archive-fg flex flex-col items-center justify-center px-4">
      <FileQuestion className="w-20 h-20 text-archive-muted mb-6" aria-hidden />
      <h1 className="text-3xl md:text-4xl font-light tracking-tight text-archive-fg mb-2">
        Page not found
      </h1>
      <p className="text-archive-muted font-light max-w-md text-center mb-10">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/"
          className="px-6 py-3 bg-archive-surface-muted hover:bg-archive-border-hover border border-archive-border transition-colors text-sm uppercase tracking-[0.1em] text-archive-fg"
        >
          Home
        </Link>
        <Link
          href="/collection"
          className="px-6 py-3 bg-archive-surface-muted hover:bg-archive-border-hover border border-archive-border transition-colors text-sm uppercase tracking-[0.1em] text-archive-fg"
        >
          Browse collection
        </Link>
      </div>
    </div>
  );
}
