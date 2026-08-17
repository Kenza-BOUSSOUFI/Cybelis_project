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
    <div className="space-y-1.5 py-1.5 border-b border-slate-200/60 last:border-0">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-800">{title}</span>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${info.badgeBg} ${info.badgeBorder}`}>
            Impact : {info.level}
          </span>
          <span className="font-mono text-xs font-bold text-slate-700 w-10 text-right">
            {info.percentage}%
          </span>
        </div>
      </div>
      <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${info.barColor}`}
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
      const { generateCybelisPDF } = await import("@/lib/pdf/generateReport");
      await generateCybelisPDF(scan, issues, isoCompliance);
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
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Chargement du rapport détaillé (OWASP, CVE, ISO 27001)...</span>
      </div>
    );
  }


  if (error || !scan) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-500">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900">Erreur de chargement</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">{error || "Rapport introuvable."}</p>
        </div>
        <Link
          href="/dashboard/reports"
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
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
    let color = "text-red-600 border-red-200";
    if (grade === "A" || score >= 90) { desc = "Excellent"; color = "text-emerald-600 border-emerald-200"; }
    else if (grade === "B" || score >= 70) { desc = "Bon"; color = "text-teal-600 border-teal-200"; }
    else if (grade === "C" || score >= 50) { desc = "Moyen"; color = "text-amber-600 border-amber-200"; }
    else if (grade === "D" || score >= 30) { desc = "Faible"; color = "text-orange-600 border-orange-200"; }
    return { grade, desc, color };
  };

  const currentGrade = getScoreGradeInfo(calculatedScore, resolvedCount > 0 ? undefined : dbGrade);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical": return "bg-red-50 text-red-600 border border-red-200";
      case "high": return "bg-orange-50 text-orange-600 border border-orange-200";
      case "medium": return "bg-amber-50 text-amber-600 border border-amber-200";
      case "low": return "bg-sky-50 text-sky-600 border border-sky-200";
      default: return "bg-slate-50 text-slate-500 border border-slate-200";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* 1. BACK HEADER ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux Rapports
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/scan?domain=${domain}`)}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-scanner</span>
          </button>

          <button
            onClick={exportPDF}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white text-xs font-semibold transition-opacity flex items-center gap-1.5 shadow-md shadow-blue-600/15"
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

      {/* 2. THE REPORT CONTENT */}
      <div ref={reportRef} className="space-y-6">

        {/* REPORT SUMMARY CARD */}
        <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{domain}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-500">
              <div className="space-y-1">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">IP Résolue</span>
                <span className="text-slate-900">Résolution IP Auto</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Date d'analyse</span>
                <span className="text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(scan.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <p className="text-[10px] text-slate-500 leading-normal">
                Analyse externe passive. Ce document intègre la cartographie OWASP Top 10, le référentiel CVE / CVSS et la conformité ISO/IEC 27001.
              </p>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-wrap gap-3 justify-center items-center">
            <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-200 w-24">
              <span className="block text-xl font-bold text-slate-900 font-mono">{issues.length}</span>
              <span className="text-[9px] text-slate-400 uppercase font-mono">Alertes</span>
            </div>
            <div className="text-center p-4 rounded-2xl bg-red-50 border border-red-200 w-24">
              <span className="block text-xl font-bold text-red-600 font-mono">
                {issues.filter(i => i.severity === "critical" && !i.resolved).length}
              </span>
              <span className="text-[9px] text-red-500 uppercase font-mono">Critiques</span>
            </div>
            <div className="text-center p-4 rounded-2xl bg-orange-50 border border-orange-200 w-24">
              <span className="block text-xl font-bold text-orange-600 font-mono">
                {issues.filter(i => i.severity === "high" && !i.resolved).length}
              </span>
              <span className="text-[9px] text-orange-500 uppercase font-mono">Élevées</span>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center gap-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Score de Sécurité</span>
            <div className="text-5xl font-extrabold text-blue-600 font-mono">
              {calculatedScore}<span className="text-xs text-slate-400">/100</span>
            </div>
            <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${currentGrade.color} border bg-white`}>
              Grade {currentGrade.grade} • {currentGrade.desc}
            </div>
          </div>

        </div>

        {/* 3. ISO/IEC 27001 COMPLIANCE CARD SUMMARY */}
        {isoCompliance && isoCompliance.totalControls > 0 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Conformité ISO/IEC 27001:2022</h3>
                  <p className="text-xs text-slate-500">Évaluation calculée uniquement sur les contrôles réellement analysés ({isoCompliance.totalControls} contrôles).</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-emerald-600">
                    {isoCompliance.compliancePercentage}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Taux de conformité</div>
                </div>
                <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200 hidden sm:block">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${isoCompliance.compliancePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {isoCompliance.controls.map((control) => (
                <div
                  key={control.code}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${control.status === "CONFORME"
                    ? "bg-emerald-50/50 border-emerald-200 text-slate-800"
                    : "bg-amber-50/50 border-amber-200 text-slate-800"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500">{control.code}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${control.status === "CONFORME"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}>
                      {control.status === "CONFORME" ? "CONFORME" : "NON CONFORME"}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs leading-snug">{control.name}</div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{control.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTROLS BAR: CATEGORY TABS & FILTER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">

          {/* Tabs for categories */}
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs self-start">
            <button
              onClick={() => setActiveTab("website")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${activeTab === "website" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900"}`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Sécurité du Site Web</span>
            </button>
            <button
              onClick={() => setActiveTab("email")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${activeTab === "email" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900"}`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Sécurité Email</span>
            </button>
            <button
              onClick={() => setActiveTab("dns")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${activeTab === "dns" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900"}`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>DNS & Domaine</span>
            </button>
            <button
              onClick={() => setActiveTab("iso27001")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${activeTab === "iso27001" ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900"}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Conformité ISO 27001</span>
            </button>
          </div>

          {/* Severity selector */}
          {activeTab !== "iso27001" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filtrer par gravité :</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm"
              >
                <option value="all">Toutes ({activeIssues.length})</option>
                <option value="critical">Critique</option>
                <option value="high">Élevé</option>
                <option value="medium">Moyen</option>
                <option value="low">Faible</option>
              </select>
            </div>
          )}

        </div>

        {/* TAB CONTENT: ISO 27001 DEDICATED VIEW */}
        {activeTab === "iso27001" && isoCompliance && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Matrice de Conformité ISO/IEC 27001:2022</h3>
                <p className="text-xs text-slate-500">Synthèse calculée à partir des {isoCompliance.totalControls} contrôles effectivement analysés dans ce scan.</p>
              </div>
            </div>

            <div className="space-y-3">
              {isoCompliance.controls.map((ctrl) => (
                <div key={ctrl.code} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">{ctrl.code}</span>
                      <span className="text-xs font-bold text-slate-900">{ctrl.name}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${ctrl.status === "CONFORME"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                      }`}>
                      {ctrl.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{ctrl.details}</p>
                  {ctrl.status === "NON_CONFORME" && ctrl.recommendation && (
                    <div className="pt-2 border-t border-slate-200 text-xs text-amber-800 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200">
                      <span className="font-bold">Recommandation d'amélioration ISO 27001 :</span> {ctrl.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ISSUES LIST GRID */}
        {activeTab !== "iso27001" && (
          <div className="space-y-3">
            {activeIssues.length > 0 ? (
              activeIssues.map((issue) => {
                const isExpanded = expandedIssue === issue.id;
                const impact = getSecurityImpact(issue.toolSlug);
                return (
                  <div
                    key={issue.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${issue.resolved
                      ? "bg-slate-50 border-slate-200 opacity-60"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                      }`}
                  >

                    {/* Issue Main Summary Panel */}
                    <div
                      onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex items-start gap-4">

                        {/* Alert Icon depending on status */}
                        {issue.resolved ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${issue.severity === "critical" ? "text-red-500 animate-pulse" :
                            issue.severity === "high" ? "text-orange-500" :
                              issue.severity === "medium" ? "text-amber-500" : "text-sky-500"
                            }`} />
                        )}

                        <div>
                          <h4 className={`text-sm font-bold leading-snug ${issue.resolved ? "text-slate-400 line-through" : "text-slate-900"}`}>
                            {issue.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-mono text-slate-400">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase ${getSeverityBadge(issue.severity)}`}>
                              {issue.severity}
                            </span>
                            <span>•</span>
                            <span>Outil : {issue.tool}</span>
                            {issue.owasp && issue.owasp.length > 0 && issue.owasp.map((o, idx) => (
                              <React.Fragment key={idx}>
                                <span>•</span>
                                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold">
                                  OWASP {o.code}
                                </span>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleResolve(issue.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-colors ${issue.resolved
                            ? "border-slate-200 hover:bg-slate-100 text-slate-500"
                            : "border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600"
                            }`}
                        >
                          {issue.resolved ? "Marquer non résolu" : "Simuler résolution"}
                        </button>

                        <div className="p-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Issue Expanding Detail Panel */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 text-xs space-y-4 leading-relaxed text-slate-600">

                        {/* 1. DESCRIPTION */}
                        <div className="space-y-1.5">
                          <span className="block text-[10px] text-slate-400 uppercase font-mono font-semibold">Description</span>
                          <p className="text-slate-700">{impact.description}</p>
                          {issue.description && issue.description !== impact.description && (
                            <p className="text-[11px] text-slate-500 italic border-t border-slate-200 pt-1.5 mt-1.5">
                              Détail de l'alerte : {issue.description}
                            </p>
                          )}
                        </div>

                        {/* 2. BUSINESS IMPACT */}
                        {impact.businessImpact.length > 0 && (
                          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 space-y-2">
                            <div className="flex items-center gap-2 text-orange-900 font-bold text-xs">
                              <Briefcase className="w-4 h-4 text-orange-600" />
                              <span>Impact Métier</span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 pt-1">
                              {impact.businessImpact.map((item, i) => (
                                <li key={i} className="text-[11px] text-orange-800 leading-relaxed">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 3. TECHNICAL IMPACT — CIA MODEL */}
                        <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 space-y-3">
                          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                            <Activity className="w-4 h-4 text-slate-600" />
                            <span>Impact Technique — Modèle CIA</span>
                          </div>
                          <div className="space-y-2 pt-1">
                            <CiaItemRow title="Confidentialité" score={impact.technicalImpact.confidentiality} />
                            <CiaItemRow title="Intégrité" score={impact.technicalImpact.integrity} />
                            <CiaItemRow title="Disponibilité" score={impact.technicalImpact.availability} />
                          </div>
                        </div>

                        {/* 4. OWASP TOP 10 (existing — unchanged) */}
                        {issue.owasp && issue.owasp.length > 0 && issue.owasp.map((o, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                              <FileCode className="w-4 h-4 text-indigo-600" />
                              <span>OWASP Top 10 : {o.code} — {o.title}</span>
                            </div>
                            <p className="text-[11px] text-indigo-800 leading-relaxed">{o.description}</p>
                            {o.recommendations.length > 0 && (
                              <ul className="list-disc list-inside text-[11px] text-indigo-900 space-y-0.5 pt-1 font-medium">
                                {o.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                              </ul>
                            )}
                          </div>
                        ))}

                        {/* 5. CVE / CVSS REFERENCE (existing — unchanged) */}
                        <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                              <Lock className="w-4 h-4 text-slate-600" />
                              <span>Référence CVE / CVSS</span>
                            </div>
                            {issue.cve ? (
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 font-mono font-bold text-[10px]">
                                {issue.cve.cveId} (CVSS {issue.cve.cvssScore})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-semibold">
                                Aucune référence CVE disponible
                              </span>
                            )}
                          </div>
                          {issue.cve ? (
                            <div className="space-y-2 pt-1">
                              <p className="text-[11px] text-slate-700 leading-relaxed">{issue.cve.description}</p>
                              <a
                                href={issue.cve.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                Consulter la référence officielle NVD (CVE.org)
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic">
                              Aucune vulnérabilité CVE répertoriée pour ce motif de configuration spécifique.
                            </p>
                          )}
                        </div>

                        {/* 6. GENERAL RECOMMENDATION */}
                        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                          <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            <span>Recommandation Générale</span>
                          </div>
                          <p className="text-[11px] text-blue-800 leading-relaxed">{impact.recommendation}</p>
                        </div>

                      </div>
                    )}

                  </div>
                );
              })
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                Aucune anomalie détectée pour cette configuration de filtres.
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
