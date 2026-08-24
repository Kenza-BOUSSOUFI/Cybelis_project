"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Calendar,
  Globe,
  Info,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Mail,
  Server,
  Loader2,
  ShieldCheck,
  ExternalLink,
  FileCode,
  Lock,
  Briefcase,
  Activity
} from "lucide-react";
import { getOwaspMapping, OwaspInfo } from "@/lib/enrichment/owasp";
import { fetchCveForFinding, CveInfo } from "@/lib/enrichment/cve";
import { calculateIso27001Compliance, Iso27001Report } from "@/lib/enrichment/iso27001";
import { getSecurityImpact, getCiaCategoryInfo } from "@/lib/enrichment/securityImpact";

interface Issue {
  id: string;
  category: "website" | "email" | "dns";
  tool: string;
  toolSlug: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  impact: string;
  fix: string;
  resolved: boolean;
  owasp: OwaspInfo[];
  cve: CveInfo | null;
}

// ── CIA Impact Row with Progress Bar ──────────────────────────────────────────

function CiaItemRow({ title, score }: { title: string; score: number }) {
  const info = getCiaCategoryInfo(score);
  return (
    <div className="space-y-1 py-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{title}</span>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${info.badgeBg} ${info.badgeBorder}`}>
            {info.level}
          </span>
          <span className="font-mono text-xs font-semibold text-slate-600 w-9 text-right">
            {info.percentage}%
          </span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${info.barColor}`}
          style={{ width: `${info.percentage}%` }}
        />
      </div>
    </div>
  );
}

export function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params?.scanId as string;

  const reportRef = useRef<HTMLDivElement>(null);

  const [scan, setScan] = useState<any>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isoCompliance, setIsoCompliance] = useState<Iso27001Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"website" | "email" | "dns" | "iso27001">("website");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [isExporting, setIsExporting] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId) return;

    async function fetchScanDetails() {
      try {
        const response = await fetch(`/api/scans/${scanId}`);
        const json = await response.json();

        if (json.success && json.data) {
          setScan(json.data);

          // Calculate ISO 27001 Compliance dynamically using only tools executed in scan
          const iso = calculateIso27001Compliance(json.data.results || []);
          setIsoCompliance(iso);

          // Map DB results & enrich dynamically with OWASP & official CVEs
          const mapped: Issue[] = [];
          for (const result of json.data.results) {
            const toolSlug = result.tool.slug;
            if (result.recommendations && result.recommendations.length > 0) {
              for (const rec of result.recommendations) {
                let category: "website" | "email" | "dns" = "website";
                if (result.tool.category === "EMAIL_SECURITY") category = "email";
                else if (result.tool.category === "DNS_DOMAIN_SECURITY") category = "dns";

                let severity: "critical" | "high" | "medium" | "low" = "low";
                const sev = (rec.priority || result.severity)?.toLowerCase();
                if (sev === "critical") severity = "critical";
                else if (sev === "high") severity = "high";
                else if (sev === "medium") severity = "medium";

                const impactInfo = getSecurityImpact(toolSlug);
                const fixText = impactInfo.recommendation || rec.description;
                const impactText = impactInfo.description || "Risque d'exposition et de compromission des données ou de la disponibilité de la plateforme.";

                const owasp = getOwaspMapping(result.result);
                const cve = await fetchCveForFinding(result.result);

                mapped.push({
                  id: rec.id,
                  category,
                  tool: result.tool.name,
                  toolSlug,
                  title: rec.title,
                  severity,
                  description: rec.description,
                  impact: impactText,
                  fix: fixText,
                  resolved: false,
                  owasp,
                  cve
                });
              }
            } else if (result.status === "FAIL" || result.status === "WARNING") {
              let category: "website" | "email" | "dns" = "website";
              if (result.tool.category === "EMAIL_SECURITY") category = "email";
              else if (result.tool.category === "DNS_DOMAIN_SECURITY") category = "dns";

              let severity: "critical" | "high" | "medium" | "low" = "low";
              const sev = result.severity?.toLowerCase();
              if (sev === "critical") severity = "critical";
              else if (sev === "high") severity = "high";
              else if (sev === "medium") severity = "medium";

              const impactInfo = getSecurityImpact(toolSlug);
              const fixText = impactInfo.recommendation || `Vérifiez la configuration du module ${result.tool.name}.`;
              const impactText = impactInfo.description || "Risque d'exposition et de compromission des données ou de la disponibilité de la plateforme.";

              const owasp = getOwaspMapping(result.result);
              const cve = await fetchCveForFinding(result.result);

              mapped.push({
                id: result.id,
                category,
                tool: result.tool.name,
                toolSlug,
                title: `Alerte de sécurité : ${result.tool.name}`,
                severity,
                description: `Le module ${result.tool.name} a détecté une anomalie de sécurité (Statut : ${result.status}).`,
                impact: impactText,
                fix: fixText,
                resolved: false,
                owasp,
                cve
              });
            }
          }
          setIssues(mapped);
        } else {
          setError(json.error || "Impossible de charger les détails du scan.");
        }
      } catch (err) {
        setError("Erreur lors de la récupération des détails du scan.");
      } finally {
        setLoading(false);
      }
    }

    fetchScanDetails();
  }, [scanId]);

  const toggleResolve = (id: string) => {
    setIssues(prev => prev.map(issue =>
      issue.id === id ? { ...issue, resolved: !issue.resolved } : issue
    ));
  };

  const exportPDF = async () => {
    if (!scan) return;
    setIsExporting(true);
    try {
      const { generateClarveonPDF } = await import("@/lib/pdf/generateReport");
      await generateClarveonPDF(
        {
          id: scan.id,
          type: scan.type,
          website: { domain: scan.website?.domain },
          createdAt: scan.createdAt,
          startedAt: scan.startedAt ?? null,
          finishedAt: scan.finishedAt ?? null,
          companyName: scan.website?.user?.companyName ?? null,
          securityScore: scan.securityScore,
        },
        issues,
        isoCompliance
      );
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Erreur lors de la génération du PDF. Veuillez réessayer.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Chargement du rapport d'audit de sécurité...</span>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-900">Erreur de chargement</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">{error || "Rapport introuvable."}</p>
        </div>
        <Link
          href="/dashboard/reports"
          className="px-3.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Retour aux Rapports
        </Link>
      </div>
    );
  }

  const domain = scan.website.domain;

  const activeIssues = issues.filter(issue => {
    if (activeTab === "website" && issue.category !== "website") return false;
    if (activeTab === "email" && issue.category !== "email") return false;
    if (activeTab === "dns" && issue.category !== "dns") return false;

    if (severityFilter !== "all" && issue.severity !== severityFilter) return false;

    return true;
  });

  const baseScore = scan.securityScore?.score ?? 0;
  const dbGrade = scan.securityScore?.grade;
  const resolvedCount = issues.filter(i => i.resolved).length;

  const calculatedScore = resolvedCount > 0
    ? Math.min(100, baseScore + Math.round((resolvedCount / (issues.length || 1)) * (100 - baseScore)))
    : baseScore;

  const getScoreGradeInfo = (score: number, fallbackGrade?: string) => {
    const grade = fallbackGrade || (score >= 90 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : score >= 30 ? "D" : "F");
    let desc = "Critique";
    let color = "text-red-700 bg-red-50 border-red-200";
    if (grade === "A" || score >= 90) { desc = "Excellent"; color = "text-emerald-700 bg-emerald-50 border-emerald-200"; }
    else if (grade === "B" || score >= 70) { desc = "Bon"; color = "text-teal-700 bg-teal-50 border-teal-200"; }
    else if (grade === "C" || score >= 50) { desc = "Moyen"; color = "text-amber-700 bg-amber-50 border-amber-200"; }
    else if (grade === "D" || score >= 30) { desc = "Faible"; color = "text-orange-700 bg-orange-50 border-orange-200"; }
    return { grade, desc, color };
  };

  const currentGrade = getScoreGradeInfo(calculatedScore, resolvedCount > 0 ? undefined : dbGrade);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical": return "bg-red-100 text-red-700 border border-red-200";
      case "high": return "bg-red-50 text-red-700 border border-red-200";
      case "medium": return "bg-amber-50 text-amber-700 border border-amber-200";
      case "low": return "bg-slate-100 text-slate-700 border border-slate-200";
      default: return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  const criticalCount = issues.filter(i => i.severity === "critical" && !i.resolved).length;
  const highCount = issues.filter(i => i.severity === "high" && !i.resolved).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* 1. TOP HEADER & BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux rapports</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/dashboard/scan?domain=${domain}`)}
            className="px-3.5 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Re-scanner</span>
          </button>

          <button
            onClick={exportPDF}
            disabled={isExporting}
            className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Exportation...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Exporter le PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. REPORT EXECUTIVE SUMMARY HEADER */}
      <div ref={reportRef} className="space-y-6">
        <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-5 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-slate-400" />
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{domain}</h1>
              </div>
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                <span>Analyse du {new Date(scan.createdAt).toLocaleDateString("fr-FR")}</span>
                <span>•</span>
                <span>Résolution IP automatique</span>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Score de Sécurité
                </span>
                <div className="text-2xl font-bold font-mono text-blue-600 flex items-baseline justify-end gap-1">
                  <span>{calculatedScore}</span>
                  <span className="text-xs font-normal text-slate-400">/ 100</span>
                </div>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${currentGrade.color}`}>
                Grade {currentGrade.grade} · {currentGrade.desc}
              </div>
            </div>
          </div>

          {/* Metrics summary line */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{issues.length}</span>
              <span className="text-slate-500">alertes détectées</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${criticalCount > 0 ? "text-red-700" : "text-slate-900"}`}>
                {criticalCount}
              </span>
              <span className="text-slate-500">critiques</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${highCount > 0 ? "text-amber-700" : "text-slate-900"}`}>
                {highCount}
              </span>
              <span className="text-slate-500">élevées</span>
            </div>
          </div>
        </div>

        {/* 3. NAVIGATION TABS */}
        <div className="border-b border-slate-200 bg-white rounded-xl px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("website")}
              className={`py-3 px-3.5 text-xs font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "website"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Sécurité du Site Web</span>
            </button>

            <button
              onClick={() => setActiveTab("email")}
              className={`py-3 px-3.5 text-xs font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "email"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Sécurité Email</span>
            </button>

            <button
              onClick={() => setActiveTab("dns")}
              className={`py-3 px-3.5 text-xs font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "dns"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Server className="w-4 h-4" />
              <span>DNS & Domaine</span>
            </button>

            <button
              onClick={() => setActiveTab("iso27001")}
              className={`py-3 px-3.5 text-xs font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "iso27001"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Conformité ISO 27001</span>
            </button>
          </div>

          {activeTab !== "iso27001" && (
            <div className="flex items-center gap-2 py-2 md:py-0 self-end md:self-auto">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filtrer par gravité :</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
              >
                <option value="all">Toutes ({activeIssues.length})</option>
                <option value="critical">Critique</option>
                <option value="high">Élevée</option>
                <option value="medium">Moyenne</option>
                <option value="low">Faible</option>
              </select>
            </div>
          )}
        </div>

        {/* 4. ISO 27001 DEDICATED VIEW */}
        {activeTab === "iso27001" && isoCompliance && (
          <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">MATRICE DE CONFORMITÉ ISO/IEC 27001:2022</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synthèse des {isoCompliance.totalControls} contrôles analysés sur ce périmètre.
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {isoCompliance.compliancePercentage}% conforme
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {isoCompliance.controls.map((ctrl) => (
                <div key={ctrl.code} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{ctrl.code}</span>
                        <span className="text-xs font-semibold text-slate-900">{ctrl.name}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{ctrl.details}</p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 ${
                        ctrl.status === "CONFORME"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {ctrl.status === "CONFORME" ? "Conforme" : "Non conforme"}
                    </span>
                  </div>

                  {ctrl.status === "NON_CONFORME" && ctrl.recommendation && (
                    <div className="text-xs text-amber-900 bg-amber-50/80 p-3 rounded-md border border-amber-200/80 mt-2">
                      <span className="font-semibold">Recommandation d'amélioration :</span> {ctrl.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. ISSUES / FINDINGS LIST */}
        {activeTab !== "iso27001" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                VULNÉRABILITÉS DÉTECTÉES
              </span>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {activeIssues.length}
              </span>
            </div>

            {activeIssues.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {activeIssues.map((issue) => {
                  const isExpanded = expandedIssue === issue.id;
                  const impact = getSecurityImpact(issue.toolSlug);

                  return (
                    <div key={issue.id} className="transition-colors hover:bg-slate-50/60">
                      {/* Main Finding Line */}
                      <div
                        onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                        className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {issue.resolved ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle
                              className={`w-4 h-4 shrink-0 mt-0.5 ${
                                issue.severity === "critical"
                                  ? "text-red-600"
                                  : issue.severity === "high"
                                  ? "text-red-600"
                                  : issue.severity === "medium"
                                  ? "text-amber-600"
                                  : "text-slate-400"
                              }`}
                            />
                          )}

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${getSeverityBadge(issue.severity)}`}>
                                {issue.severity}
                              </span>
                              <h3 className={`text-sm font-semibold truncate ${issue.resolved ? "text-slate-400 line-through" : "text-slate-900"}`}>
                                {issue.title}
                              </h3>
                            </div>

                            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                              <span>{issue.tool}</span>
                              {issue.owasp && issue.owasp.length > 0 && issue.owasp.map((o, idx) => (
                                <React.Fragment key={idx}>
                                  <span>•</span>
                                  <span>OWASP {o.code}</span>
                                </React.Fragment>
                              ))}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleResolve(issue.id);
                            }}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                              issue.resolved
                                ? "text-slate-500 hover:text-slate-800 border border-slate-200 bg-white"
                                : "text-slate-600 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            {issue.resolved ? "Marquer non résolu" : "Simuler la résolution"}
                          </button>

                          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium hover:text-slate-800">
                            <span>Voir le détail</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Accordion Expanded Detail Panel */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-3 border-t border-slate-200 bg-slate-50/60 text-xs space-y-5">
                          {/* DESCRIPTION */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              DESCRIPTION
                            </span>
                            <p className="text-slate-700 leading-relaxed">{impact.description}</p>
                            {issue.description && issue.description !== impact.description && (
                              <p className="text-slate-500 italic text-[11px] pt-1">
                                {issue.description}
                              </p>
                            )}
                          </div>

                          {/* IMPACT MÉTIER */}
                          {impact.businessImpact.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                IMPACT MÉTIER
                              </span>
                              <ul className="list-disc list-inside space-y-1 text-slate-600 leading-relaxed">
                                {impact.businessImpact.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* IMPACT TECHNIQUE — MODÈLE CIA */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              IMPACT TECHNIQUE — MODÈLE CIA
                            </span>
                            <div className="space-y-2 max-w-xl">
                              <CiaItemRow title="Confidentialité" score={impact.technicalImpact.confidentiality} />
                              <CiaItemRow title="Intégrité" score={impact.technicalImpact.integrity} />
                              <CiaItemRow title="Disponibilité" score={impact.technicalImpact.availability} />
                            </div>
                          </div>

                          {/* RÉFÉRENCES DE SÉCURITÉ */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              RÉFÉRENCES DE SÉCURITÉ
                            </span>
                            {issue.cve ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[11px] font-semibold">
                                    {issue.cve.cveId} (CVSS {issue.cve.cvssScore})
                                  </span>
                                </div>
                                <p className="text-slate-600">{issue.cve.description}</p>
                                <a
                                  href={issue.cve.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium text-[11px]"
                                >
                                  <span>Consulter la référence NVD</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ) : (
                              <p className="text-slate-500 italic">
                                Aucune référence CVE disponible pour cette configuration.
                              </p>
                            )}
                          </div>

                          {/* RECOMMANDATION */}
                          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 space-y-1">
                            <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-xs">
                              <ShieldCheck className="w-4 h-4 text-blue-600" />
                              <span>Recommandation</span>
                            </div>
                            <p className="text-blue-800 leading-relaxed">{impact.recommendation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                Aucune anomalie détectée pour cette configuration de filtres.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
