"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-archive-bg flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-light tracking-tight text-archive-fg">
          Could not load exhibition
        </h1>
        <p className="text-sm text-archive-muted">
          This exhibition is temporarily unavailable. Please try again shortly.
        </p>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 text-sm border border-archive-border text-archive-fg hover:bg-archive-surface transition-colors rounded"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
