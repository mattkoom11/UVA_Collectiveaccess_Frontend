"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, X } from "lucide-react";
import { useMemo } from "react";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{ label: string; href: string }> = [];
    
    // Home
    if (pathname !== "/") {
      crumbs.push({ label: "Home", href: "/" });
    }

    // Parse pathname
    const segments = pathname.split("/").filter(Boolean);
    
    segments.forEach((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      
      // Special cases
      if (segment === "garments" && segments[index + 1]) {
        // Skip garments segment, show the slug
        return;
      }
      
      crumbs.push({ label, href });
    });

    // Add filter info from search params
    const activeFilters: string[] = [];
    if (searchParams.get("era") && searchParams.get("era") !== "all") {
      activeFilters.push(`Era: ${searchParams.get("era")}`);
    }
    if (searchParams.get("type") && searchParams.get("type") !== "all") {
      activeFilters.push(`Type: ${searchParams.get("type")}`);
    }
    if (searchParams.get("color") && searchParams.get("color") !== "all") {
      activeFilters.push(`Color: ${searchParams.get("color")}`);
    }
    if (searchParams.get("material") && searchParams.get("material") !== "all") {
      activeFilters.push(`Material: ${searchParams.get("material")}`);
    }

    return { crumbs, activeFilters };
  }, [pathname, searchParams]);

  if (breadcrumbs.crumbs.length <= 1 && breadcrumbs.activeFilters.length === 0) {
    return null;
  }

  const removeFilter = (filterType: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(filterType);
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    // Client-side navigation — a full document reload here would discard the
    // app's state and re-run the CSP nonce flow for no benefit.
    router.push(newUrl);
  };

  return (
    <nav className="border-b border-archive-border bg-archive-bg/50 py-3">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 flex-wrap">
          {breadcrumbs.crumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="w-4 h-4 text-archive-muted" />}
              <Link
                href={crumb.href}
                className={`text-xs uppercase tracking-[0.1em] transition-colors ${
 index === breadcrumbs.crumbs.length - 1
                    ? "text-archive-muted-subtle font-light"
                    : "text-archive-muted hover:text-archive-muted-subtle"
                }`}
              >
                {crumb.label}
              </Link>
            </div>
          ))}
          
          {breadcrumbs.activeFilters.length > 0 && (
            <>
              <ChevronRight className="w-4 h-4 text-archive-muted" />
              <span className="text-xs uppercase tracking-[0.1em] text-archive-muted">Filters:</span>
              {breadcrumbs.activeFilters.map((filter) => {
                const [type, value] = filter.split(": ");
                const filterType = type.toLowerCase();
                return (
                  <div
                    key={filter}
                    className="flex items-center gap-1 px-2 py-1 bg-archive-surface/50 border border-archive-border text-xs text-archive-muted"
                  >
                    <span>{filter}</span>
                    <button
                      onClick={() => removeFilter(filterType)}
                      className="hover:text-archive-fg transition-colors"
                      aria-label={`Remove ${filter} filter`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
