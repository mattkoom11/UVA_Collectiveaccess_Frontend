import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-4">
      <FileQuestion className="w-20 h-20 text-zinc-500 mb-6" aria-hidden />
      <h1 className="text-3xl md:text-4xl font-light tracking-tight text-zinc-200 mb-2">
        Page not found
      </h1>
      <p className="text-zinc-400 font-light max-w-md text-center mb-10">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/"
          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm uppercase tracking-[0.1em] text-zinc-200"
        >
          Home
        </Link>
        <Link
          href="/collection"
          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm uppercase tracking-[0.1em] text-zinc-200"
        >
          Browse collection
        </Link>
      </div>
    </div>
  );
}
