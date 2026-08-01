"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Download, Globe, ChevronRight, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Report {
  id: string;
  domain: string;
  score: number;
  createdAt: string;
  summary: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  remediation: string;
}

interface ScanDetails {
  id: string;
  domain: string;
  score: number;
  createdAt: string;
  vulnerabilities: Vulnerability[];
  modules: string[];
}

// ── Design helpers (identical to original) ────────────────────────────────────

const scoreBadge = (score: number) => {
  if (score >= 90) return "bg-emerald-50 text-emerald-600 border border-emerald-200";
  if (score >= 70) return "bg-amber-50 text-amber-600 border border-amber-200";
  return "bg-red-50 text-red-600 border border-red-200";
};

const severityLabel: Record<string, string> = {
  critical: "Critique",
  high:     "Élevé",
  medium:   "Moyen",
  low:      "Faible",
  info:     "Info",
};

// ── PDF generation — jsPDF only, no html2canvas/canvg ────────────────────────

async function generateAndDownloadPDF(reportId: string) {
  const res = await fetch(`/api/reports/${reportId}`);
  if (!res.ok) {
    alert("Impossible de récupérer les données du rapport.");
    return;
  }
  const data: ScanDetails = await res.json();

  // Dynamic import: never bundled server-side → fixes canvg/core-js errors
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210;
  const M = 16;
  const CW = PW - M * 2;
  let y = 20;

  // helpers
  const line = (
    text: string,
    size = 10,
    bold = false,
    color: [number, number, number] = [30, 30, 30]
  ) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    doc.text(text, M, y);
    y += size * 0.45 + 2;
  };

  const wrapped = (
    text: string,
    size = 9,
    color: [number, number, number] = [80, 80, 80]
  ) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CW) as string[];
    doc.text(lines, M, y);
    y += lines.length * (size * 0.45 + 1.5) + 1;
  };

  const sep = () => {
    doc.setDrawColor(220, 220, 220);
    doc.line(M, y, PW - M, y);
    y += 5;
  };

  const checkPage = (need = 30) => {
    if (y + need > 282) { doc.addPage(); y = 20; }
  };

  // ── Blue header bar ──────────────────────────────────────────────────────
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, PW, 14, "F");
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text("CYBELIS — Rapport d'Audit de Sécurité", M, 9);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, PW - M, 9, { align: "right" });
  y = 22;

  // ── Summary ──────────────────────────────────────────────────────────────
  line(`Domaine : ${data.domain}`, 13, true);
  y += 1;
  line(
    `Date du scan : ${new Date(data.createdAt).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    })}`,
    9, false, [100, 100, 100]
  );
  y += 3;

  const score = data.score;
  const scoreRGB: [number, number, number] =
    score >= 80 ? [5, 150, 105] : score >= 60 ? [217, 119, 6] : [220, 38, 38];
  doc.setFillColor(...scoreRGB);
  doc.roundedRect(M, y, 42, 10, 2, 2, "F");
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text(`Score : ${score} / 100`, M + 4, y + 6.5);
  y += 16;

  if (data.modules.length > 0) {
    line("Modules analysés :", 9, true);
    wrapped(data.modules.join("  •  "), 8, [60, 80, 180]);
    y += 2;
  }
  sep();

  // ── Severity summary ─────────────────────────────────────────────────────
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  data.vulnerabilities.forEach((v) => {
    if (v.severity in counts) counts[v.severity as keyof typeof counts]++;
  });

  checkPage(30);
  line("Résumé des vulnérabilités", 11, true);
  y += 2;
  (
    [
      ["Critique", counts.critical, [220, 38,  38]  as [number,number,number]],
      ["Élevé",    counts.high,     [234, 88,  12]  as [number,number,number]],
      ["Moyen",    counts.medium,   [202, 138, 4]   as [number,number,number]],
      ["Faible",   counts.low,      [14,  165, 233] as [number,number,number]],
    ] as [string, number, [number, number, number]][]
  ).forEach(([label, count, color]) => {
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...color);
    doc.text(`${label} :  ${count}`, M + 4, y);
    y += 5.5;
  });
  y += 2;
  sep();

  // ── Vulnerability detail ─────────────────────────────────────────────────
  if (data.vulnerabilities.length === 0) {
    line("✓ Aucune vulnérabilité détectée.", 10, false, [5, 150, 105]);
  } else {
    checkPage(20);
    line("Détail des vulnérabilités", 11, true);
    y += 3;

    data.vulnerabilities.forEach((v, idx) => {
      checkPage(40);

      const sevRGB: [number, number, number] =
        v.severity === "critical" ? [220, 38,  38]  :
        v.severity === "high"     ? [234, 88,  12]  :
        v.severity === "medium"   ? [202, 138, 4]   :
                                    [14,  165, 233];

      // severity pill
      doc.setFillColor(...sevRGB);
      doc.roundedRect(M, y, 24, 5.5, 1.2, 1.2, "F");
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
      doc.text((severityLabel[v.severity] ?? v.severity).toUpperCase(), M + 2, y + 3.8);

      // title
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 20);
      const titleLines = doc.splitTextToSize(`${idx + 1}. ${v.title}`, CW - 28) as string[];
      doc.text(titleLines, M + 27, y + 3.8);
      y += Math.max(8, titleLines.length * 4.5 + 2);

      wrapped(`Description : ${v.description}`, 8.5);
      y += 1;
      wrapped(`Remédiation : ${v.remediation}`, 8.5, [37, 99, 235]);
      y += 5;

      doc.setDrawColor(235, 235, 235);
      doc.line(M + 8, y - 3, PW - M, y - 3);
    });
  }

  // ── Page footer ───────────────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(160, 160, 160);
    doc.text(`Cybelis Security Audit — ${data.domain} — Page ${p}/${total}`, M, 292);
  }

  doc.save(`Rapport_Cybelis_${data.domain}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports]           = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [exportingId, setExportingId]   = useState<string | null>(null);

  // Fetch report list
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) setReports(await res.json());
      } finally {
        setLoadingReports(false);
      }
    })();
  }, []);

  // Navigate to the full-page report detail
  const handleSelect = (r: Report) =>
    router.push(`/dashboard/reports/${r.id}`);

  const handlePDF = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExportingId(id);
    try { await generateAndDownloadPDF(id); }
    finally { setExportingId(null); }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  // ── Render ────────────────────────────────────────────────────────────────

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

      {/* Reports list — always full width, no side panel */}
      <div className="grid gap-6 grid-cols-1">
        <div className="space-y-3">
          {loadingReports ? (
            <div className="text-center py-12 text-slate-400 text-xs">Chargement des rapports...</div>
          ) : reports.length === 0 ? (
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
                onClick={() => handleSelect(report)}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{report.domain}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{fmt(report.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${scoreBadge(report.score)}`}>
                      {report.score}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
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
                    onClick={(e) => handlePDF(e, report.id)}
                    disabled={exportingId === report.id}
                    className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 hover:text-blue-600 transition-colors font-medium disabled:opacity-50"
                    title="Télécharger le PDF"
                  >
                    {exportingId === report.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Download className="w-3.5 h-3.5" />}
                    PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
