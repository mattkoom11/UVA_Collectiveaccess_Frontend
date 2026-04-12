export default function Loading() {
  return (
    <div className="min-h-screen bg-archive-bg animate-pulse">
      <div className="max-w-5xl mx-auto px-4 py-20 space-y-8">
        <div className="h-10 bg-archive-surface rounded w-2/3 mx-auto" />
        <div className="h-4 bg-archive-surface rounded w-1/2 mx-auto" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-archive-surface rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
