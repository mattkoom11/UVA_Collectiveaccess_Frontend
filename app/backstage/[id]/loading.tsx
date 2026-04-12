export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-4 animate-pulse">
        <div className="w-16 h-16 bg-zinc-800 rounded-full mx-auto" />
        <div className="h-4 bg-zinc-800 rounded w-32 mx-auto" />
      </div>
    </div>
  );
}
