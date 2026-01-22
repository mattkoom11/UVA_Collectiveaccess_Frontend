"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBar from "./SearchBar";

export default function SiteHeader() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(path);
  };

  return (
    <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Top row: Logo and Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-sm md:text-base tracking-[0.25em] uppercase font-light text-zinc-100 hover:text-zinc-50 transition-colors">
            UVA Fashion Archive
          </Link>
          <nav className="flex gap-6 md:gap-8 text-xs md:text-sm uppercase tracking-[0.2em] font-light">
            <Link 
              href="/" 
              className={`transition-colors ${
                isActive("/")
                  ? "text-zinc-50 border-b border-zinc-50 pb-1"
                  : "text-zinc-200 hover:text-zinc-50"
              }`}
            >
              Runway
            </Link>
            <Link 
              href="/collection" 
              className={`transition-colors ${
                isActive("/collection")
                  ? "text-zinc-50 border-b border-zinc-50 pb-1"
                  : "text-zinc-200 hover:text-zinc-50"
              }`}
            >
              Collection
            </Link>
            <Link 
              href="/timeline" 
              className={`transition-colors ${
                isActive("/timeline")
                  ? "text-zinc-50 border-b border-zinc-50 pb-1"
                  : "text-zinc-200 hover:text-zinc-50"
              }`}
            >
              Timeline
            </Link>
            <Link 
              href="/about" 
              className={`transition-colors ${
                isActive("/about")
                  ? "text-zinc-50 border-b border-zinc-50 pb-1"
                  : "text-zinc-200 hover:text-zinc-50"
              }`}
            >
              About
            </Link>
          </nav>
        </div>
        
        {/* Search bar row */}
        <div className="max-w-2xl">
          <SearchBar variant="header" placeholder="Search by name, material, color, decade..." />
        </div>
      </div>
    </header>
  );
}
