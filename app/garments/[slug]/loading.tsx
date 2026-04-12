export default function Loading() {
  return (
    <div className="min-h-screen bg-archive-bg animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[40vh] bg-archive-surface" />
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image skeleton */}
        <div className="aspect-[3/4] bg-archive-surface rounded" />
        {/* Metadata skeleton */}
        <div className="space-y-4">
          <div className="h-8 bg-archive-surface rounded w-3/4" />
          <div className="h-4 bg-archive-surface rounded w-1/2" />
          <div className="h-4 bg-archive-surface rounded w-2/3" />
          <div className="mt-8 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-archive-surface rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
