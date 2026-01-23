export default function SkeletonCard() {
  return (
    <div className="border border-zinc-800 bg-zinc-900/50 animate-pulse">
      {/* Image skeleton */}
      <div className="w-full aspect-[3/4] bg-zinc-800" />
      
      {/* Content skeleton */}
      <div className="p-6 space-y-3">
        <div className="h-6 bg-zinc-800 rounded w-3/4" />
        <div className="h-4 bg-zinc-800 rounded w-1/2" />
        <div className="space-y-2">
          <div className="h-3 bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-zinc-800 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}

