export default function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-zinc-800 bg-zinc-900/50 animate-pulse flex gap-6">
          <div className="w-48 flex-shrink-0 aspect-[3/4] bg-zinc-800" />
          <div className="flex-1 p-6 space-y-3">
            <div className="h-6 bg-zinc-800 rounded w-3/4" />
            <div className="h-4 bg-zinc-800 rounded w-1/2" />
            <div className="space-y-2">
              <div className="h-3 bg-zinc-800 rounded w-full" />
              <div className="h-3 bg-zinc-800 rounded w-5/6" />
              <div className="h-3 bg-zinc-800 rounded w-4/6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

