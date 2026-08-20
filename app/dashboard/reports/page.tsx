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

// ── Design helpers ────────────────────────────────────────────────────────────

const scoreBadge = (score: number) => {
  if (score >= 90) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-red-600";
};

const severityLabel: Record<string, string> = {
  critical: "Critique",
  high: "Élevé",
  medium: "Moyen",
  low: "Faible",
  info: "Info",
};

// ── PDF generation — delegates to shared professional generator ───────────────

async function generateAndDownloadPDF(reportId: string) {
  // 1. Fetch the full scan data (same endpoint used by ReportDetailPage)
  const res = await fetch(`/api/scans/${reportId}`);
  if (!res.ok) {
    alert("Impossible de récupérer les données du rapport.");
    return;
  }
  const json = await res.json();
  if (!json.success || !json.data) {
    alert("Données de rapport invalides.");
    return;
  }
  const scanData = json.data;

  // 2. Dynamically import enrichment utilities (client-side only)
  const [
    { getOwaspMapping },
    { fetchCveForFinding },
    { calculateIso27001Compliance },
    { generateClarveonPDF },
  ] = await Promise.all([
    import("@/lib/enrichment/owasp"),
    import("@/lib/enrichment/cve"),
    import("@/lib/enrichment/iso27001"),
    import("@/lib/pdf/generateReport"),
  ]);

  // 3. Calculate ISO 27001 compliance from real scan results
  const isoCompliance = calculateIso27001Compliance(scanData.results || []);

  // 4. Build enriched issues list (same logic as ReportDetailPage)
  const issues: any[] = [];
  const getFixText = (slug: string) => {
    if (slug === "ssl-checker") return "Configurez le renouvellement automatique via Let's Encrypt (Certbot) ou installez un certificat SSL valide.";
    if (slug === "tls-analyzer") return "Désactivez TLS 1.0/1.1. Autorisez uniquement TLS 1.2 et TLS 1.3 dans la configuration de votre serveur.";
    if (slug === "security-headers") return "Ajoutez les en-têtes de sécurité manquants (HSTS, CSP, X-Frame-Options) dans la configuration de votre serveur web.";
    if (slug === "cookie-analyzer") return "Ajoutez les attributs Secure, HttpOnly et SameSite=Lax/Strict sur tous les cookies de session.";
    if (slug === "dmarc-checker") return "Créez un enregistrement TXT DNS '_dmarc.domaine.com' avec une politique p=reject.";
    if (slug === "spf-checker") return "Corrigez votre enregistrement SPF en remplaçant '~all' par '-all'.";
    return "Vérifiez la configuration du module et appliquez les recommandations de sécurité correspondantes.";
  };
  const getImpactText = (slug: string) => {
    if (slug === "ssl-checker") return "Les navigateurs bloquent l'accès au site, causant une perte totale de trafic.";
    if (slug === "tls-analyzer") return "Les données transmises peuvent être interceptées et déchiffrées par un attaquant.";
    if (slug === "security-headers") return "Vulnérabilité aux attaques Clickjacking, XSS ou injection de contenu non autorisé.";
    if (slug === "cookie-analyzer") return "Les scripts malveillants peuvent voler les cookies de session et usurper l'identité de l'utilisateur.";
    if (slug === "dmarc-checker") return "N'importe qui peut forger des emails usurpant votre domaine (phishing).";
    return "Risque d'exposition et de compromission des données ou de disponibilité de la plateforme.";
  };

  for (const result of scanData.results || []) {
    const toolSlug = result.tool.slug;
    let category: "website" | "email" | "dns" = "website";
    if (result.tool.category === "EMAIL_SECURITY") category = "email";
    else if (result.tool.category === "DNS_DOMAIN_SECURITY") category = "dns";

    const recs = result.recommendations && result.recommendations.length > 0
      ? result.recommendations
      : (result.status === "FAIL" || result.status === "WARNING") ? [null] : [];

    for (const rec of recs) {
      let severity: "critical" | "high" | "medium" | "low" = "low";
      const sev = ((rec?.priority || result.severity) ?? "").toLowerCase();
      if (sev === "critical") severity = "critical";
      else if (sev === "high") severity = "high";
      else if (sev === "medium") severity = "medium";

      const owasp = getOwaspMapping(result.result);
      const cve = await fetchCveForFinding(result.result);

      issues.push({
        id: rec?.id ?? result.id,
        category,
        tool: result.tool.name,
        toolSlug,
        title: rec?.title ?? `Alerte de sécurité : ${result.tool.name}`,
        severity,
        description: rec?.description ?? `Le module ${result.tool.name} a détecté une anomalie (Statut : ${result.status}).`,
        impact: getImpactText(toolSlug),
        fix: getFixText(toolSlug),
        resolved: false,
        owasp,
        cve,
      });
    }
  }

  // 5. Generate the professional PDF using the shared utility
  await generateClarveonPDF(
    {
      website: { domain: scanData.website.domain },
      createdAt: scanData.createdAt,
      securityScore: scanData.securityScore,
    },
    issues,
    isoCompliance
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);

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
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400 shrink-0" />
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Rapports</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Consultez et téléchargez vos rapports d'audit.</p>
        </div>
        <Link
          href="/dashboard/scan"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
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
                    <span className={`text-xs font-mono font-bold ${scoreBadge(report.score)}`}>
                      {report.score}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">{report.summary}</p>

                <div className="flex items-center gap-2 mt-3">
                  {report.critical > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 font-mono font-bold">
                      {report.critical} Critique{report.critical > 1 ? "s" : ""}
                    </span>
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