"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, RefreshCw, ArrowRight, Loader2,
  AlertTriangle, CheckCircle2, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Globe, Mail, Server
} from "lucide-react";

type SeverityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type ResultStatus  = "PASS" | "WARNING" | "FAIL";
type Priority      = "LOW" | "MEDIUM" | "HIGH";
type ToolCategory  = "WEBSITE_SECURITY" | "EMAIL_SECURITY" | "DNS_DOMAIN_SECURITY";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: Priority;
}

interface ScanResult {
  id: string;
  status: ResultStatus;
  score: number;
  severity: SeverityLevel;
  executionTime: number;
  result: Record<string, unknown>;
  tool: {
    id: string;
    name: string;
    slug: string;
    category: ToolCategory;
  };
  recommendations: Recommendation[];
}

interface ScanReport {
  id: string;
  status: string;
  finishedAt: string;
  website: { domain: string; url: string };
  securityScore: {
    score: number;
    grade: string;
    riskLevel: SeverityLevel;
    passedChecks: number;
    warningChecks: number;
    failedChecks: number;
  } | null;
  results: ScanResult[];
}

interface ResultsCardProps {
  scanId: string;
  onReset: () => void;
}

const RESULT_STATUS: Record<ResultStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  PASS:    { label: "Réussi",    dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200" },
  WARNING: { label: "Attention", dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200"   },
  FAIL:    { label: "Échoué",    dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50",      border: "border-red-200"     },
};

const PRIORITY: Record<Priority, { label: string; text: string }> = {
  LOW:    { label: "Faible",  text: "text-slate-500" },
  MEDIUM: { label: "Moyen",   text: "text-amber-600" },
  HIGH:   { label: "Élevé",   text: "text-red-600"   },
};

const RISK_GRADE: Record<SeverityLevel, { label: string; text: string; bg: string; border: string }> = {
  LOW:      { label: "Faible",   text: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200" },
  MEDIUM:   { label: "Modéré",   text: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200"   },
  HIGH:     { label: "Élevé",    text: "text-orange-700",  bg: "bg-orange-50",   border: "border-orange-200"  },
  CRITICAL: { label: "Critique", text: "text-red-700",     bg: "bg-red-50",       border: "border-red-200"     },
};

const GRADE_COLOR: Record<string, string> = {
  A: "text-emerald-600 bg-emerald-50 border-emerald-200",
  B: "text-teal-600 bg-teal-50 border-teal-200",
  C: "text-amber-600 bg-amber-50 border-amber-200",
  D: "text-orange-600 bg-orange-50 border-orange-200",
  F: "text-red-600 bg-red-50 border-red-200",
};

const CATEGORY: Record<ToolCategory, { label: string; Icon: React.ElementType }> = {
  WEBSITE_SECURITY:    { label: "Sécurité Web", Icon: Globe  },
  EMAIL_SECURITY:      { label: "Email",        Icon: Mail   },
  DNS_DOMAIN_SECURITY: { label: "DNS & Domaine",Icon: Server },
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color =
    pct >= 80 ? "bg-emerald-500"
    : pct >= 60 ? "bg-amber-500"
    : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono font-semibold text-slate-600 w-7 text-right shrink-0">{pct}</span>
    </div>
  );
}

function ToolRow({ result }: { result: ScanResult }) {
  const [open, setOpen] = useState(false);
  const st   = RESULT_STATUS[result.status] ?? RESULT_STATUS.FAIL;
  const cat  = CATEGORY[result.tool.category] ?? CATEGORY.WEBSITE_SECURITY;
  const CatIcon = cat.Icon;
  const hasRecs = result.recommendations.length > 0;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        type="button"
        onClick={() => hasRecs && setOpen(v => !v)}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
          hasRecs ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"
        }`}
      >
        <div className={`shrink-0 w-2.5 h-2.5 rounded-full ${st.dot}`} />

        <div className="shrink-0 p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
          <CatIcon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">{result.tool.name}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{cat.label} · {result.recommendations.length} observation(s)</p>
        </div>

        <div className="w-28 shrink-0 hidden sm:block">
          <ScoreBar score={result.score} />
        </div>

        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${st.text} ${st.bg} ${st.border}`}>
          {st.label}
        </span>

        {hasRecs && (
          <div className="shrink-0 text-slate-400">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        )}
      </button>

      {open && hasRecs && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-3 bg-slate-50/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recommandations</p>
          {result.recommendations.map(rec => {
            const pri = PRIORITY[rec.priority] ?? PRIORITY.MEDIUM;
            return (
              <div key={rec.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold text-slate-900">{rec.title}</p>
                  <span className={`shrink-0 text-[10px] font-bold ${pri.text}`}>{pri.label}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{rec.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ResultsCard({ scanId, onReset }: ResultsCardProps) {
  const router = useRouter();
  const [data, setData] = useState<ScanReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<"ALL" | ToolCategory>("ALL");

  useEffect(() => {
    async function fetchReport() {
      try {
        const res  = await fetch(`/api/scans/${scanId}`);
        const json = await res.json();
        if (json.success && json.data) setData(json.data);
        else setError(json.error || "Impossible de charger le rapport.");
      } catch {
        setError("Erreur de communication avec l'API.");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [scanId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Chargement du rapport…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-10 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <div>
          <p className="text-sm font-bold text-slate-900">Erreur de chargement</p>
          <p className="text-xs text-slate-500 mt-1">{error || "Données indisponibles."}</p>
        </div>
        <button onClick={onReset} className="px-5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
          Retour
        </button>
      </div>
    );
  }

  const { securityScore, results, website } = data;
  const grade      = securityScore?.grade ?? "F";
  const gradeClass = GRADE_COLOR[grade] ?? GRADE_COLOR.F;
  const risk       = RISK_GRADE[securityScore?.riskLevel ?? "CRITICAL"];
  const score      = securityScore?.score ?? 0;
  const passed     = securityScore?.passedChecks ?? 0;
  const warned     = securityScore?.warningChecks ?? 0;
  const failed     = securityScore?.failedChecks ?? 0;
  const total      = passed + warned + failed;

  const categories = Array.from(new Set(results.map(r => r.tool.category))) as ToolCategory[];

  const filtered = (activeCategory === "ALL" ? results : results.filter(r => r.tool.category === activeCategory))
    .slice()
    .sort((a, b) => {
      const order: Record<ResultStatus, number> = { FAIL: 0, WARNING: 1, PASS: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });

  return (
    <div className="space-y-5">
      {/* ── Score Summary Card ─────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Grade */}
          <div className={`shrink-0 w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center ${gradeClass}`}>
            <span className="text-5xl font-mono font-black tracking-tight">{grade}</span>
            <span className="text-[9px] uppercase font-bold tracking-[0.15em] opacity-80 mt-0.5">Note globale</span>
          </div>

          <div className="hidden sm:block w-px h-20 bg-slate-200" />

          {/* Metrics */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Score de sécurité</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black font-mono text-slate-900">{score}</span>
                <span className="text-base text-slate-400 font-semibold mb-0.5">/ 100</span>
                <span className={`ml-2 text-xs font-bold px-2.5 py-1 rounded-lg border ${risk.text} ${risk.bg} ${risk.border}`}>
                  Risque {risk.label}
                </span>
              </div>
            </div>

            <div className="h-2.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${score}%` }}
              />
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> {passed} réussi(s)
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <AlertCircle className="w-3.5 h-3.5" /> {warned} avertissement(s)
              </span>
              <span className="flex items-center gap-1.5 text-red-600">
                <XCircle className="w-3.5 h-3.5" /> {failed} échoué(s)
              </span>
            </div>
          </div>

          <div className="shrink-0 text-right hidden sm:block">
            <p className="text-sm font-mono font-bold text-slate-900">{website.domain}</p>
            {data.finishedAt && (
              <p className="text-xs text-slate-400 mt-1">
                {new Date(data.finishedAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Results by Tool ────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900">Résultats par module</h3>
            <span className="text-xs text-slate-400">({total} analysés)</span>
          </div>
          {failed > 0 && (
            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
              {failed} vulnérabilité(s) détectée(s)
            </span>
          )}
        </div>

        {categories.length > 1 && (
          <div className="flex gap-1 px-4 py-3 border-b border-slate-100 overflow-x-auto">
            {(["ALL", ...categories] as Array<"ALL" | ToolCategory>).map(cat => {
              const label = cat === "ALL" ? "Tous" : CATEGORY[cat]?.label ?? cat;
              const count = cat === "ALL" ? results.length : results.filter(r => r.tool.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? "bg-blue-50 text-blue-600 border border-blue-200 font-bold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {label}
                  <span className={`px-1.5 py-px rounded text-[10px] font-bold ${
                    activeCategory === cat ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="p-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Aucun résultat dans cette catégorie.</p>
          ) : (
            filtered.map(result => <ToolRow key={result.id} result={result} />)
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Nouveau scan
        </button>
        <button
          onClick={() => router.push(`/dashboard/reports?scan=${scanId}`)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-xs font-semibold transition-opacity shadow-md shadow-blue-600/15"
        >
          Consulter le rapport complet
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
