"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex justify-center mb-6">
        <Icon className="w-16 h-16 text-zinc-500" aria-hidden />
      </div>
      <h2 className="text-xl md:text-2xl font-light text-zinc-200 mb-2">{title}</h2>
      {description && (
        <p className="text-sm md:text-base text-zinc-400 font-light max-w-md mb-8">{description}</p>
      )}
      {children}
      {actionLabel && (
        actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm uppercase tracking-[0.1em] text-zinc-200"
          >
            {actionLabel}
          </Link>
        ) : onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm uppercase tracking-[0.1em] text-zinc-200"
          >
            {actionLabel}
          </button>
        ) : null
      )}
    </div>
  );
}
