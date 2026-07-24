"use client";

import React, { useState } from "react";
import { TrendingUp, Globe, ChevronDown, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { MOCK_SCANS } from "@/lib/mock-data";
import type { ScanRecord } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";

const scoreBadge = (score: number) => {
  if (score >= 90) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-red-600";
};

const scoreBg = (score: number) => {
  if (score >= 90) return "bg-emerald-50 border-emerald-200";
  if (score >= 70) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
};

interface ScanSelectorProps {
  label: string;
  selected: ScanRecord | null;
  onSelect: (s: ScanRecord | null) => void;
  exclude?: string;
}

function ScanSelector({ label, selected, onSelect, exclude }: ScanSelectorProps) {
  const [open, setOpen] = useState(false);
  const options = MOCK_SCANS.filter((s) => s.id !== exclude);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-blue-200 transition-colors text-left"
      >
        <div>
          <div className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">{label}</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {selected ? selected.domain : <span className="text-slate-400 font-normal text-xs">Choisir un site…</span>}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {options.map((s) => (
            <button
              key={s.id}
              onClick={() => { onSelect(s); setOpen(false); }}
              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-900">{s.domain}</span>
              </div>
              <span className={`text-xs font-mono font-bold ${scoreBadge(s.score)}`}>{s.score}%</span>
            </button>
          ))}
          {selected && (
            <button
              onClick={() => { onSelect(null); setOpen(false); }}
              className="w-full px-4 py-2 text-[11px] text-red-500 hover:bg-red-50 transition-colors text-center font-medium"
            >
              Désélectionner
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const COMPARE_METRICS = [
  { key: "score", label: "Score global", format: (v: number) => `${v}/100` },
  { key: "critical", label: "Failles critiques", format: (v: number) => `${v}`, lower: true },
  { key: "high", label: "Failles élevées", format: (v: number) => `${v}`, lower: true },
  { key: "medium", label: "Failles moyennes", format: (v: number) => `${v}`, lower: true },
  { key: "duration", label: "Durée du scan", format: (v: number) => `${v}s` },
] as const;

export default function ComparePage() {
  const [scanA, setScanA] = useState<ScanRecord | null>(null);
  const [scanB, setScanB] = useState<ScanRecord | null>(null);

  const canCompare = scanA && scanB;

  const getWinner = (key: string, a: ScanRecord, b: ScanRecord) => {
    const va = (a as Record<string, number>)[key];
    const vb = (b as Record<string, number>)[key];
    const lowerIsBetter = ["critical", "high", "medium", "duration"].includes(key);
    if (va === vb) return "tie";
    if (lowerIsBetter) return va < vb ? "a" : "b";
    return va > vb ? "a" : "b";
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Comparaison de Scans</h1>
          <p className="text-xs text-slate-500 mt-0.5">Comparez deux analyses côte-à-côte.</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScanSelector label="Site A" selected={scanA} onSelect={setScanA} exclude={scanB?.id} />
        <ScanSelector label="Site B" selected={scanB} onSelect={setScanB} exclude={scanA?.id} />
      </div>

      {/* Comparison table */}
      {!canCompare && (
        <EmptyState
          icon={TrendingUp}
          title="Sélectionnez deux sites"
          description="Choisissez deux analyses dans les menus ci-dessus pour comparer leurs résultats."
        />
      )}

      {canCompare && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">

          {/* Domain header row */}
          <div className="grid grid-cols-3 gap-4 text-center border-b border-slate-100 pb-4">
            <div className={`p-3 rounded-xl border ${scoreBg(scanA.score)}`}>
              <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[10px] font-mono mb-1"><Globe className="w-3.5 h-3.5" />Site A</div>
              <div className="text-sm font-bold text-slate-900">{scanA.domain}</div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${scoreBg(scanB.score)}`}>
              <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[10px] font-mono mb-1"><Globe className="w-3.5 h-3.5" />Site B</div>
              <div className="text-sm font-bold text-slate-900">{scanB.domain}</div>
            </div>
          </div>

          {/* Metrics rows */}
          <div className="space-y-3">
            {COMPARE_METRICS.map(({ key, label, format }) => {
              const va = (scanA as Record<string, number>)[key];
              const vb = (scanB as Record<string, number>)[key];
              const winner = getWinner(key, scanA, scanB);
              return (
                <div key={key} className="grid grid-cols-3 gap-4 items-center py-2.5 border-b border-slate-50 last:border-0">
                  <div className={`text-center font-mono font-bold text-sm ${winner === "a" ? "text-emerald-600" : winner === "tie" ? "text-slate-600" : "text-slate-400"}`}>
                    <span className={`px-3 py-1 rounded-lg ${winner === "a" ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50 border border-slate-200"}`}>
                      {format(va)}
                    </span>
                  </div>
                  <div className="text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
                  <div className={`text-center font-mono font-bold text-sm ${winner === "b" ? "text-emerald-600" : winner === "tie" ? "text-slate-600" : "text-slate-400"}`}>
                    <span className={`px-3 py-1 rounded-lg ${winner === "b" ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50 border border-slate-200"}`}>
                      {format(vb)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Verdict */}
          <div className="mt-2 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            {scanA.score === scanB.score ? (
              <p className="text-xs font-semibold text-slate-600 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Les deux sites ont un score identique.
              </p>
            ) : scanA.score > scanB.score ? (
              <p className="text-xs font-semibold text-slate-700 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-700">{scanA.domain}</span> est mieux sécurisé.
              </p>
            ) : (
              <p className="text-xs font-semibold text-slate-700 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-700">{scanB.domain}</span> est mieux sécurisé.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
