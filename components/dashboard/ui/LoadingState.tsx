"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  rows?: number;
}

/** Skeleton loader — used when async data is being fetched */
export function LoadingState({ message = "Chargement...", rows = 4 }: LoadingStateProps) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-3 pb-2">
        <Loader2 className="w-4 h-4 text-cyan-600 animate-spin" />
        <span className="text-xs text-slate-500 font-mono font-bold">{message}</span>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-9 rounded-lg bg-slate-100 flex-1" style={{ opacity: 1 - i * 0.15 }} />
            <div className="h-9 w-24 rounded-lg bg-slate-100" style={{ opacity: 0.8 - i * 0.15 }} />
            <div className="h-9 w-16 rounded-lg bg-slate-100" style={{ opacity: 0.6 - i * 0.1 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Card skeleton variant */
export function LoadingCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-xl bg-white border border-slate-200 space-y-4">
          <div className="flex justify-between">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-4 w-4 rounded bg-slate-100" />
          </div>
          <div className="h-8 w-20 rounded bg-slate-100" />
          <div className="h-3 w-32 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
