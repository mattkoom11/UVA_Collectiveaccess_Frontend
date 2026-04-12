"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-light tracking-tight text-zinc-100">
          Could not load 3D viewer
        </h1>
        <p className="text-sm text-zinc-400">
          The backstage view for this item is temporarily unavailable.
        </p>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 text-sm border border-zinc-700 text-zinc-200 hover:bg-zinc-800 transition-colors rounded"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
