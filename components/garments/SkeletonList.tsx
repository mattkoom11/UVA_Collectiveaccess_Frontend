export default function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-archive-border bg-archive-surface/50 animate-pulse flex gap-6">
          <div className="w-48 flex-shrink-0 aspect-[3/4] bg-archive-surface-muted" />
          <div className="flex-1 p-6 space-y-3">
            <div className="h-6 bg-archive-surface-muted w-3/4" />
            <div className="h-4 bg-archive-surface-muted w-1/2" />
            <div className="space-y-2">
              <div className="h-3 bg-archive-surface-muted w-full" />
              <div className="h-3 bg-archive-surface-muted w-5/6" />
              <div className="h-3 bg-archive-surface-muted w-4/6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

