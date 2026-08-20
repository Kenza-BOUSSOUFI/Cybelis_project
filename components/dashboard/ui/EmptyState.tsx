"use client";

import React from "react";
import Link from "next/link";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

/** Generic empty state with optional CTA */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl bg-slate-50/50 border border-slate-200 border-dashed">
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-xs font-bold text-[#0b1329] mb-1">{title}</h3>
      <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed mb-5">{description}</p>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="px-4 py-2 rounded-lg bg-[#0b1329] text-cyan-400 border border-cyan-500/30 text-xs font-bold hover:bg-[#152245] transition-all shadow-sm"
        >
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-lg bg-[#0b1329] text-cyan-400 border border-cyan-500/30 text-xs font-bold hover:bg-[#152245] transition-all shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/** Inline error state with retry */
export function ErrorState({
  message = "Une erreur est survenue.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-xl bg-red-50/40 border border-red-100 border-dashed">
      <p className="text-xs font-bold text-red-700 mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-cyan-700 hover:underline font-bold"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
