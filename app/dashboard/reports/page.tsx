"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileText, Download, Eye, Globe, ChevronRight, X, AlertTriangle } from "lucide-react";
import { MOCK_REPORTS, MOCK_SCANS } from "@/lib/mock-data";
import type { Report, Vulnerability } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";

const scoreBadge = (score: number) => {
  if (score >= 90) return "bg-emerald-50 text-emerald-600 border border-emerald-200";
  if (score >= 70) return "bg-amber-50 text-amber-600 border border-amber-200";
  return "bg-red-50 text-red-600 border border-red-200";
};

const severityColor = {
  critical: "bg-red-50 text-red-600 border border-red-200",
  high: "bg-orange-50 text-orange-600 border border-orange-200",
  medium: "bg-amber-50 text-amber-600 border border-amber-200",
  low: "bg-sky-50 text-sky-600 border border-sky-200",
  info: "bg-slate-50 text-slate-600 border border-slate-200",
};

const severityLabel = {
  critical: "Critique",
  high: "Élevé",
  medium: "Moyen",
  low: "Faible",
  info: "Info",
};

export default function ReportsPage() {
  const [reports] = useState<Report[]>(MOCK_REPORTS);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Get full scan details for the selected report
  const scanDetails = selectedReport
    ? MOCK_SCANS.find((s) => s.id === selectedReport.scanId)
    : null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Rapports</h1>
          <p className="text-xs text-slate-500 mt-0.5">Consultez et téléchargez vos rapports d'audit.</p>
        </div>
        <Link
          href="/dashboard/scan"
          className="ml-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-blue-600/15"
        >
          + Nouveau scan
        </Link>
      </div>

      <div className={`grid gap-6 ${selectedReport ? "lg:grid-cols-[1fr_420px]" : "grid-cols-1"}`}>

        {/* Reports list */}
        <div className="space-y-3">
          {reports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucun rapport disponible"
              description="Lancez votre premier scan pour générer un rapport de sécurité."
              actionLabel="Nouveau scan"
              actionHref="/dashboard/scan"
            />
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                className={`p-5 rounded-2xl bg-white border shadow-sm cursor-pointer transition-all hover:shadow-md ${
                  selectedReport?.id === report.id
                    ? "border-blue-200 ring-1 ring-blue-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{report.domain}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDate(report.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${scoreBadge(report.score)}`}>
                      {report.score}%
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${selectedReport?.id === report.id ? "rotate-90" : ""}`} />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">{report.summary}</p>

                <div className="flex items-center gap-2 mt-3">
                  {report.critical > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 font-mono font-bold">{report.critical} Critique{report.critical > 1 ? "s" : ""}</span>}
                  {report.high > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-100 font-mono font-bold">{report.high} Élevé{report.high > 1 ? "s" : ""}</span>}
                  {report.medium > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 font-mono font-bold">{report.medium} Moyen{report.medium > 1 ? "s" : ""}</span>}
                  {report.critical === 0 && report.high === 0 && (
                    <span className="text-[10px] text-emerald-500 font-semibold font-mono">✓ Aucune faille critique</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); /* TODO: export PDF */ }}
                    className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 hover:text-blue-600 transition-colors font-medium"
                    title="Télécharger (bientôt)"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail panel */}
        {selectedReport && scanDetails && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm h-fit space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{selectedReport.domain}</h2>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDate(selectedReport.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score gauge mini */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className={`text-2xl font-extrabold font-mono ${selectedReport.score >= 80 ? "text-emerald-600" : selectedReport.score >= 60 ? "text-amber-600" : "text-red-600"}`}>
                {selectedReport.score}<span className="text-sm font-bold">/100</span>
              </span>
              <div className="flex-1">
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedReport.score >= 80 ? "bg-emerald-500" : selectedReport.score >= 60 ? "bg-amber-400" : "bg-red-500"}`}
                    style={{ width: `${selectedReport.score}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">Score de sécurité global</p>
              </div>
            </div>

            {/* Vulnerabilities */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Vulnérabilités détectées ({scanDetails.vulnerabilities.length})
              </h3>
              {scanDetails.vulnerabilities.length === 0 ? (
                <p className="text-[11px] text-emerald-600 font-medium">✓ Aucune vulnérabilité détectée.</p>
              ) : (
                <div className="space-y-2.5">
                  {scanDetails.vulnerabilities.map((v: Vulnerability) => (
                    <div key={v.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className={`shrink-0 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${severityColor[v.severity]}`}>
                          {severityLabel[v.severity].toUpperCase()}
                        </span>
                        <div className="text-xs font-semibold text-slate-900 leading-snug">{v.title}</div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{v.description}</p>
                      <div className="pt-1.5 border-t border-slate-200">
                        <p className="text-[10px] text-blue-700 font-medium">Remédiation : {v.remediation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modules run */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 mb-2">Modules analysés</h3>
              <div className="flex flex-wrap gap-1.5">
                {scanDetails.modules.map((m) => (
                  <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-mono">{m}</span>
                ))}
              </div>
            </div>

            <button
              onClick={() => { /* TODO: export PDF */ }}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Exporter en PDF (bientôt)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
