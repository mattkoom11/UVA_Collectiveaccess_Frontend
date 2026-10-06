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
        <Icon className="w-16 h-16 text-archive-muted" aria-hidden />
      </div>
      <h2 className="text-xl md:text-2xl font-light text-archive-fg mb-2">{title}</h2>
      {description && (
        <p className="text-sm md:text-base text-archive-muted font-light max-w-md mb-8">{description}</p>
      )}
      {children}
      {actionLabel && (
        actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-6 py-3 bg-archive-surface-muted hover:bg-archive-border-hover border border-archive-border transition-colors text-sm uppercase tracking-[0.1em] text-archive-fg"
          >
            {actionLabel}
          </Link>
        ) : onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-6 py-3 bg-archive-surface-muted hover:bg-archive-border-hover border border-archive-border transition-colors text-sm uppercase tracking-[0.1em] text-archive-fg"
          >
            {actionLabel}
          </button>
        ) : null
      )}
    </div>
  );
}
