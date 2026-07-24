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
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl bg-slate-50/50 border border-slate-200 border-dashed">
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-300" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-5">{description}</p>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-blue-600/15"
        >
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-blue-600/15"
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
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl bg-red-50/40 border border-red-100 border-dashed">
      <p className="text-xs font-semibold text-red-600 mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
