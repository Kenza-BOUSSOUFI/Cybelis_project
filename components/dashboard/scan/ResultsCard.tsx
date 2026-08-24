"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, RefreshCw, ArrowRight, Loader2,
  AlertTriangle, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Globe, Mail, Server,
  ArrowUpRight
} from "lucide-react";

type SeverityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type ResultStatus = "PASS" | "WARNING" | "FAIL";
type Priority = "LOW" | "MEDIUM" | "HIGH";
type ToolCategory = "WEBSITE_SECURITY" | "EMAIL_SECURITY" | "DNS_DOMAIN_SECURITY";

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
  createdAt?: string;
  startedAt?: string;
  finishedAt: string;
  website: { domain: string; url: string; user?: { companyName?: string } };
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
  PASS: { label: "Réussi", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  WARNING: { label: "Attention", dot: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  FAIL: { label: "Échoué", dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};

const GRADE_BADGE: Record<string, { text: string; bg: string; border: string }> = {
  A: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  B: { text: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" },
  C: { text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  D: { text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  F: { text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};

const RISK_BADGE: Record<SeverityLevel, { label: string; text: string; bg: string; border: string }> = {
  LOW: { label: "Faible", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  MEDIUM: { label: "Modéré", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  HIGH: { label: "Élevé", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  CRITICAL: { label: "Critique", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};

const PRIORITY_BADGE: Record<Priority, { label: string; text: string; bg: string; border: string }> = {
  LOW: { label: "Faible", text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
  MEDIUM: { label: "Moyen", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  HIGH: { label: "Élevé", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};

const CATEGORY_MAP: Record<ToolCategory, { label: string; Icon: React.ElementType }> = {
  WEBSITE_SECURITY: { label: "Sécurité Web", Icon: Globe },
  EMAIL_SECURITY: { label: "Email", Icon: Mail },
  DNS_DOMAIN_SECURITY: { label: "DNS & Domaine", Icon: Server },
};

function ToolRow({ result, scanId }: { result: ScanResult; scanId: string }) {
  const [open, setOpen] = useState(false);
  const st = RESULT_STATUS[result.status] ?? RESULT_STATUS.FAIL;
  const cat = CATEGORY_MAP[result.tool.category] ?? CATEGORY_MAP.WEBSITE_SECURITY;
  const CatIcon = cat.Icon;
  const hasRecs = result.recommendations && result.recommendations.length > 0;

  const pct = Math.max(0, Math.min(100, result.score));
  const barColor =
    result.status === "PASS"
      ? "bg-emerald-500"
      : result.status === "WARNING"
        ? "bg-orange-500"
        : "bg-red-500";

  return (
    <div className="transition-colors">
      <div
        onClick={() => hasRecs && setOpen(v => !v)}
        className={`flex items-center gap-3.5 px-4 sm:px-5 py-3.5 text-left transition-colors ${
          hasRecs ? "hover:bg-slate-50/70 cursor-pointer" : "cursor-default"
        }`}
      >
        {/* Severity 8px dot */}
        <div className={`shrink-0 w-2 h-2 rounded-full ${st.dot}`} />

        {/* Category icon */}
        <div className="shrink-0 text-slate-400">
          <CatIcon className="w-4 h-4" />
        </div>

        {/* Module information */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-900 truncate">
            {result.tool.name}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {cat.label} · {result.recommendations.length} observation{result.recommendations.length > 1 ? "s" : ""}
          </div>
        </div>

        {/* Mini score bar */}
        <div className="w-24 sm:w-28 shrink-0 hidden sm:flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-slate-100 border border-slate-200/50 overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-mono font-semibold text-slate-700 w-7 text-right shrink-0">{pct}</span>
        </div>

        {/* Compact status badge */}
        <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded border ${st.text} ${st.bg} ${st.border}`}>
          {st.label}
        </span>

        {/* Chevron */}
        <div className="shrink-0 w-4 text-slate-400 flex items-center justify-center">
          {hasRecs ? (
            open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
          ) : (
            <span className="w-4" />
          )}
        </div>
      </div>

      {/* Expanded observations drawer */}
      {open && hasRecs && (
        <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Observations ({result.recommendations.length})
            </p>
            <Link
              href={`/dashboard/reports/${scanId}`}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <span>Voir dans le rapport détaillé</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {result.recommendations.map((rec) => {
              const pri = PRIORITY_BADGE[rec.priority] ?? PRIORITY_BADGE.MEDIUM;
              return (
                <div key={rec.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">{rec.title}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${pri.text} ${pri.bg} ${pri.border}`}>
                      {pri.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                </div>
              );
            })}
          </div>
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
        const res = await fetch(`/api/scans/${scanId}`);
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
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Chargement des résultats de scan…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col items-center gap-3 text-center max-w-md mx-auto">
        <AlertTriangle className="w-7 h-7 text-red-500" />
        <div>
          <p className="text-sm font-bold text-slate-900">Erreur de chargement</p>
          <p className="text-xs text-slate-500 mt-1">{error || "Données indisponibles."}</p>
        </div>
        <button
          onClick={onReset}
          className="mt-2 px-4 py-2 rounded-lg border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Retour au formulaire
        </button>
      </div>
    );
  }

  const { securityScore, results, website } = data;
  const grade = securityScore?.grade ?? "F";
  const gradeInfo = GRADE_BADGE[grade] ?? GRADE_BADGE.F;
  const risk = RISK_BADGE[securityScore?.riskLevel ?? "CRITICAL"];
  const score = securityScore?.score ?? 0;
  const passed = securityScore?.passedChecks ?? 0;
  const warned = securityScore?.warningChecks ?? 0;
  const failed = securityScore?.failedChecks ?? 0;
  const total = results.length;

  const categories = Array.from(new Set(results.map(r => r.tool.category))) as ToolCategory[];

  const filtered = (activeCategory === "ALL" ? results : results.filter(r => r.tool.category === activeCategory))
    .slice()
    .sort((a, b) => {
      const order: Record<ResultStatus, number> = { FAIL: 0, WARNING: 1, PASS: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });

  const priorityResults = results.filter(r => r.status === "FAIL" || r.status === "WARNING");

  const scoreColor =
    score >= 80 ? "bg-emerald-500"
      : score >= 60 ? "bg-orange-500"
        : "bg-red-500";

  const formatDate = (iso?: string | null) => {
    if (!iso) return "Date indisponible";
    return new Date(iso).toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">

      {/* ── 1. Page Header — Scan Identity ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Résultats du scan
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            {website.domain}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analyse de sécurité terminée · {formatDate(data.finishedAt || data.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onReset}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Nouveau scan</span>
          </button>

          <button
            onClick={() => router.push(`/dashboard/reports/${scanId}`)}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Voir le rapport détaillé</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── 2. Executive Security Summary & Status Summary ─────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Score de sécurité
          </span>
          <div className="flex flex-wrap items-baseline gap-3 mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-bold text-slate-900">{score}</span>
              <span className="text-sm font-mono text-slate-400">/ 100</span>
            </div>

            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${gradeInfo.text} ${gradeInfo.bg} ${gradeInfo.border}`}>
              Grade {grade}
            </span>

            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${risk.text} ${risk.bg} ${risk.border}`}>
              Risque {risk.label}
            </span>
          </div>
        </div>

        {/* Subtle Progress Bar */}
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-slate-100 border border-slate-200/60 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${scoreColor}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Horizontal Status Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-mono font-bold text-slate-900 text-sm">{passed}</span>
              <span className="text-xs text-slate-500 ml-1.5">Contrôle{passed > 1 ? "s" : ""} réussi{passed > 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
            <div>
              <span className="font-mono font-bold text-slate-900 text-sm">{warned}</span>
              <span className="text-xs text-slate-500 ml-1.5">Point{warned > 1 ? "s" : ""} d'attention</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <div>
              <span className="font-mono font-bold text-slate-900 text-sm">{failed}</span>
              <span className="text-xs text-slate-500 ml-1.5">Contrôle{failed > 1 ? "s" : ""} échoué{failed > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Results by Security Module ─────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Résultats des contrôles</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{total} modules analysés</p>
          </div>

          <div>
            {failed > 0 ? (
              <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                {failed} contrôle{failed > 1 ? "s" : ""} en échec
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tous les contrôles validés</span>
              </span>
            )}
          </div>
        </div>

        {/* Category filter tabs */}
        {categories.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(["ALL", ...categories] as Array<"ALL" | ToolCategory>).map((cat) => {
              const label = cat === "ALL" ? "Tous" : CATEGORY_MAP[cat]?.label ?? cat;
              const count = cat === "ALL" ? results.length : results.filter((r) => r.tool.category === cat).length;
              const isActive = activeCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isActive ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Unified Module Result List (NO individual floating cards) */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-8">
              Aucun résultat pour cette catégorie.
            </div>
          ) : (
            filtered.map((result) => (
              <ToolRow
                key={result.id}
                result={result}
                scanId={scanId}
              />
            ))
          )}
        </div>
      </div>

      {/* ── 4. Priority Findings Section ────────────────────────── */}
      {priorityResults.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Points nécessitant votre attention
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {priorityResults.length} contrôle{priorityResults.length > 1 ? "s" : ""} prioritaire{priorityResults.length > 1 ? "s" : ""} nécessite{priorityResults.length > 1 ? "nt" : ""} une action.
              </p>
            </div>
            <Link
              href={`/dashboard/reports/${scanId}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <span>Consulter le rapport détaillé</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {priorityResults.slice(0, 6).map((item) => {
              const st = RESULT_STATUS[item.status] ?? RESULT_STATUS.FAIL;
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-start gap-2.5"
                >
                  <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${st.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-slate-900 truncate">{item.tool.name}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${st.text} ${st.bg} ${st.border}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {item.recommendations[0]?.title || `${item.recommendations.length} observation(s) détectée(s)`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. Detailed Report CTA ──────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Besoin d'une analyse plus détaillée ?</h4>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Consultez le rapport complet pour examiner les vulnérabilités, les recommandations et les références de sécurité.
          </p>
        </div>

        <button
          onClick={() => router.push(`/dashboard/reports/${scanId}`)}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0"
        >
          <span>Voir le rapport détaillé</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
