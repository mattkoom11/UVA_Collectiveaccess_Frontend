export default function Loading() {
  return (
    <div className="min-h-screen bg-archive-bg animate-pulse">
      <div className="max-w-3xl mx-auto px-4 py-20 space-y-6">
        <div className="h-8 bg-archive-surface rounded w-3/4" />
        <div className="h-4 bg-archive-surface rounded w-1/3" />
        <div className="space-y-3 mt-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 bg-archive-surface rounded w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
