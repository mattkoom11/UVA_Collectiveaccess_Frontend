"use client";

import { Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CompareButtonProps {
  garmentId: string;
  variant?: "icon" | "button";
  className?: string;
}

export default function CompareButton({ 
  garmentId, 
  variant = "icon",
  className = "" 
}: CompareButtonProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get current compare IDs from localStorage or URL
    const currentIds = typeof window !== "undefined" 
      ? JSON.parse(localStorage.getItem("compare-ids") || "[]")
      : [];
    
    if (!currentIds.includes(garmentId) && currentIds.length < 4) {
      const newIds = [...currentIds, garmentId];
      localStorage.setItem("compare-ids", JSON.stringify(newIds));
      setIsAdding(true);
      setTimeout(() => {
        router.push(`/compare?ids=${newIds.join(",")}`);
        setIsAdding(false);
      }, 300);
    } else if (currentIds.includes(garmentId)) {
      router.push(`/compare?ids=${currentIds.join(",")}`);
    }
  };

  if (variant === "button") {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-light transition-colors border border-archive-border px-4 py-2 hover:border-archive-border-hover ${
          isAdding
            ? "text-archive-fg border-archive-border-hover"
            : "text-archive-muted hover:text-archive-fg"
        } ${className}`}
        aria-label="Add to comparison"
      >
        <Scale className="w-4 h-4" />
        <span>{isAdding ? "Adding..." : "Compare"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full transition-all text-archive-muted hover:text-archive-muted-subtle hover:bg-archive-surface/50 ${className}`}
      aria-label="Add to comparison"
    >
      <Scale className="w-5 h-5" />
    </button>
  );
}

