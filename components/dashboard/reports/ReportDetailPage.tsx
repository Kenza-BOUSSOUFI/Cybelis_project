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
  Loader2
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Issue {
  id: string;
  category: "website" | "email" | "dns";
  tool: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  impact: string;
  fix: string;
  resolved: boolean;
}

function getFixTextForTool(slug: string, title: string): string | null {
  const tLower = title.toLowerCase();
  if (slug === 'ssl-checker') {
    return "Configurez le renouvellement automatique via votre hébergeur ou Let's Encrypt (Certbot), ou installez un certificat SSL valide auprès de votre autorité de certification.";
  }
  if (slug === 'tls-analyzer') {
    return "Désactivez les protocoles obsolètes (TLS 1.0, TLS 1.1) dans les réglages système ou de votre serveur web (Nginx/Apache). Configurez le serveur pour n'autoriser que TLS 1.2 et TLS 1.3.";
  }
  if (slug === 'security-headers') {
    if (tLower.includes('hsts') || tLower.includes('strict-transport')) {
      return "Ajoutez l'en-tête suivant dans la configuration de votre serveur web (Nginx: 'add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\" always;', Apache: 'Header always set Strict-Transport-Security \"max-age=31536000; includeSubDomains\"').";
    }
    if (tLower.includes('frame') || tLower.includes('clickjacking')) {
      return "Ajoutez l'en-tête 'X-Frame-Options: DENY' ou 'X-Frame-Options: SAMEORIGIN' sur toutes les réponses HTTP.";
    }
    return "Ajoutez l'en-tête de sécurité manquant dans les configurations de réponse HTTP de votre serveur web.";
  }
  if (slug === 'cookie-analyzer') {
    return "Ajoutez les attributs 'Secure' (force le HTTPS), 'HttpOnly' (interdit la lecture par JavaScript) et 'SameSite=Lax/Strict' sur tous les cookies de session ou d'authentification.";
  }
  if (slug === 'csp-validator') {
    return "Mettez en place une politique d'en-tête Content-Security-Policy (CSP) stricte (ex: default-src 'self'). Testez-la d'abord via l'en-tête Content-Security-Policy-Report-Only.";
  }
  if (slug === 'dmarc-checker') {
    return "Créez ou mettez à jour votre enregistrement DNS TXT sous le sous-domaine '_dmarc.votre-domaine.com' (valeur recommandée: 'v=DMARC1; p=reject; rua=mailto:dmarc-reports@votre-domaine.com').";
  }
  if (slug === 'spf-checker') {
    return "Vérifiez la liste de vos serveurs d'envoi légitimes (Google Workspace, Mailgun...) et remplacez le suffixe permissif '~all' par le mode strict '-all' dans votre enregistrement DNS TXT SPF.";
  }
  return null;
}

function getImpactTextForTool(slug: string, title: string): string | null {
  const tLower = title.toLowerCase();
  if (slug === 'ssl-checker') {
    return "Les navigateurs modernes bloquent immédiatement l'accès au site, causant une perte totale de trafic et de confiance.";
  }
  if (slug === 'tls-analyzer') {
    return "Possibilité d'intercepter, d'écouter et de déchiffrer les données sensibles transmises par les utilisateurs sur le réseau local ou public.";
  }
  if (slug === 'security-headers') {
    if (tLower.includes('hsts')) {
      return "Les attaquants locaux peuvent forcer les requêtes de vos utilisateurs à basculer vers HTTP (SSL Stripping) pour voler leurs cookies.";
    }
    return "Vulnérabilité aux attaques par intégration de frame (Clickjacking), injection de MIME type ou vols d'identifiants.";
  }
  if (slug === 'cookie-analyzer') {
    return "Les scripts malveillants (XSS) ou les connexions non chiffrées peuvent intercepter les identifiants de session et usurper le compte de la victime.";
  }
  if (slug === 'csp-validator') {
    return "Vulnérabilité critique aux failles Cross-Site Scripting (XSS), permettant à des scripts distants non autorisés de s'exécuter à la place du site légitime.";
  }
  if (slug === 'dmarc-checker') {
    return "N'importe qui peut forger des emails légitimes usurpant votre domaine, ruinant votre réputation d'expéditeur et piégeant vos clients par hameçonnage.";
  }
  return null;
}

export function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params?.scanId as string;

  const reportRef = useRef<HTMLDivElement>(null);
  
  const [scan, setScan] = useState<any>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"website" | "email" | "dns">("website");
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
          
          // Map DB results to Page UI issues format
          const mapped: Issue[] = [];
          for (const result of json.data.results) {
            for (const rec of result.recommendations) {
              let category: "website" | "email" | "dns" = "website";
              if (result.tool.category === "EMAIL_SECURITY") category = "email";
              else if (result.tool.category === "DNS_DOMAIN_SECURITY") category = "dns";

              let severity: "critical" | "high" | "medium" | "low" = "low";
              const sev = result.severity?.toLowerCase();
              if (sev === "critical") severity = "critical";
              else if (sev === "high") severity = "high";
              else if (sev === "medium") severity = "medium";

              const fixText = getFixTextForTool(result.tool.slug, rec.title) || rec.description;
              const impactText = getImpactTextForTool(result.tool.slug, rec.title) || "Risque d'exposition et de compromission des données ou de la disponibilité de la plateforme.";

              mapped.push({
                id: rec.id,
                category,
                tool: result.tool.name,
                title: rec.title,
                severity,
                description: rec.description,
                impact: impactText,
                fix: fixText,
                resolved: false
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

  // Handle marking an issue as resolved (purely client-side for UX interaction)
  const toggleResolve = (id: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === id ? { ...issue, resolved: !issue.resolved } : issue
    ));
  };

  // PDF generation method using html2canvas & jsPDF
  const exportPDF = async () => {
    if (!reportRef.current || !scan) return;
    setIsExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#09090b" // match our neutral-950 color
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 size
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Rapport_Cybelis_${scan.website.domain}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <span className="text-xs text-neutral-400 font-medium">Chargement du rapport détaillé...</span>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-neutral-200">Erreur de chargement</h3>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">{error || "Rapport introuvable."}</p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 transition-colors"
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const domain = scan.website.domain;

  // Filter issues based on active Tab and severity filter
  const activeIssues = issues.filter(issue => {
    if (activeTab === "website" && issue.category !== "website") return false;
    if (activeTab === "email" && issue.category !== "email") return false;
    if (activeTab === "dns" && issue.category !== "dns") return false;

    if (severityFilter !== "all" && issue.severity !== severityFilter) return false;

    return true;
  });

  // Calculate live score dynamically
  const unresolvedIssues = issues.filter(i => !i.resolved);
  const calculatedScore = Math.max(0, 100 - unresolvedIssues.reduce((acc, curr) => {
    let penalty = 0;
    if (curr.severity === "critical") penalty = 30;
    else if (curr.severity === "high") penalty = 18;
    else if (curr.severity === "medium") penalty = 10;
    else if (curr.severity === "low") penalty = 5;
    return acc + penalty;
  }, 0));

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical": return "bg-red-500/10 text-red-500 border border-red-500/20";
      case "high": return "bg-orange-500/10 text-orange-500 border border-orange-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
      case "low": return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
      default: return "bg-neutral-800 text-neutral-400";
    }
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: "A", desc: "Excellent", color: "text-emerald-500 border-emerald-500/20" };
    if (score >= 70) return { grade: "B", desc: "Bon", color: "text-teal-500 border-teal-500/20" };
    if (score >= 50) return { grade: "C", desc: "Moyen", color: "text-yellow-500 border-yellow-500/20" };
    if (score >= 30) return { grade: "D", desc: "Faible", color: "text-orange-500 border-orange-500/20" };
    return { grade: "F", desc: "Critique", color: "text-red-500 border-red-500/20" };
  };

  const currentGrade = getScoreGrade(calculatedScore);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* 1. BACK HEADER ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au Tableau de bord
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/scan?domain=${domain}`)}
            className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-scanner</span>
          </button>
          
          <button
            onClick={exportPDF}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

      {/* 2. THE REPORT CONTENT (WRAPPED FOR PDF CAPTURE) */}
      <div ref={reportRef} className="space-y-8 bg-neutral-950 p-1 rounded-2xl">
        
        {/* REPORT SUMMARY CARD */}
        <div className="p-6 md:p-8 rounded-3xl bg-neutral-900/40 border border-neutral-900 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">{domain}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-neutral-400">
              <div className="space-y-1">
                <span className="block text-[10px] text-neutral-500 uppercase font-semibold">IP Résolue</span>
                <span className="text-white">Résolution IP Auto</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] text-neutral-500 uppercase font-semibold">Date d'analyse</span>
                <span className="text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(scan.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-3">
              <Info className="w-4 h-4 text-neutral-400 shrink-0" />
              <p className="text-[10px] text-neutral-400 leading-normal">
                Analyse externe passive. Ce document récapitule les correctifs nécessaires pour éliminer vos vulnérabilités.
              </p>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-wrap gap-3 justify-center items-center">
            <div className="text-center p-4 rounded-2xl bg-neutral-950 border border-neutral-900 w-24">
              <span className="block text-xl font-bold text-white font-mono">{issues.length}</span>
              <span className="text-[9px] text-neutral-500 uppercase font-mono">Alertes</span>
            </div>
            <div className="text-center p-4 rounded-2xl bg-neutral-950 border border-neutral-900 w-24">
              <span className="block text-xl font-bold text-red-500 font-mono">
                {issues.filter(i => i.severity === "critical" && !i.resolved).length}
              </span>
              <span className="text-[9px] text-red-500/80 uppercase font-mono">Critiques</span>
            </div>
            <div className="text-center p-4 rounded-2xl bg-neutral-950 border border-neutral-900 w-24">
              <span className="block text-xl font-bold text-orange-400 font-mono">
                {issues.filter(i => i.severity === "high" && !i.resolved).length}
              </span>
              <span className="text-[9px] text-orange-400/80 uppercase font-mono">Élevées</span>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-950 border border-neutral-850 text-center gap-2">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Score de Sécurité</span>
            <div className="text-5xl font-extrabold text-indigo-400 font-mono">
              {calculatedScore}<span className="text-xs text-neutral-500">/100</span>
            </div>
            <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${currentGrade.color} border bg-white/5`}>
              Grade {currentGrade.grade} • {currentGrade.desc}
            </div>
          </div>

        </div>

        {/* CONTROLS BAR: CATEGORY TABS & FILTER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
          
          {/* Tabs for categories */}
          <div className="flex gap-2 p-1 rounded-lg bg-neutral-900 border border-neutral-800/80 text-xs self-start">
            <button
              onClick={() => setActiveTab("website")}
              className={`px-4 py-2 rounded-md font-semibold transition-colors flex items-center gap-2 ${activeTab === "website" ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Website Security</span>
            </button>
            <button
              onClick={() => setActiveTab("email")}
              className={`px-4 py-2 rounded-md font-semibold transition-colors flex items-center gap-2 ${activeTab === "email" ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Security</span>
            </button>
            <button
              onClick={() => setActiveTab("dns")}
              className={`px-4 py-2 rounded-md font-semibold transition-colors flex items-center gap-2 ${activeTab === "dns" ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>DNS & WHOIS</span>
            </button>
          </div>

          {/* Severity selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">Filtrer par gravité :</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Toutes ({activeIssues.length})</option>
              <option value="critical">Critique</option>
              <option value="high">Élevé</option>
              <option value="medium">Moyen</option>
              <option value="low">Faible</option>
            </select>
          </div>

        </div>

        {/* ISSUES LIST GRID */}
        <div className="space-y-4">
          {activeIssues.length > 0 ? (
            activeIssues.map((issue) => {
              const isExpanded = expandedIssue === issue.id;
              return (
                <div 
                  key={issue.id} 
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    issue.resolved 
                      ? "bg-neutral-950 border-neutral-900 opacity-60" 
                      : "bg-neutral-900/40 border-neutral-900 hover:border-neutral-800"
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
                        <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                          issue.severity === "critical" ? "text-red-500 animate-pulse" :
                          issue.severity === "high" ? "text-orange-500" :
                          issue.severity === "medium" ? "text-yellow-500" : "text-sky-400"
                        }`} />
                      )}

                      <div>
                        <h4 className={`text-sm font-bold leading-snug ${issue.resolved ? "text-neutral-500 line-through" : "text-white"}`}>
                          {issue.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-mono text-neutral-500">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase ${getSeverityBadge(issue.severity)}`}>
                            {issue.severity}
                          </span>
                          <span>•</span>
                          <span>Outil: {issue.tool}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleResolve(issue.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-colors ${
                          issue.resolved
                            ? "border-neutral-800 hover:bg-neutral-900 text-neutral-400"
                            : "border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/15 text-indigo-400"
                        }`}
                      >
                        {issue.resolved ? "Marquer non résolu" : "Simuler résolution"}
                      </button>
                      
                      <div className="p-1 rounded bg-neutral-950 border border-neutral-900 text-neutral-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Issue Expanding Detail Panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-neutral-900/60 bg-neutral-950/40 text-xs space-y-4 leading-relaxed text-neutral-400">
                      
                      <div>
                        <span className="block text-[10px] text-neutral-500 uppercase font-mono font-semibold mb-1">Description</span>
                        <p>{issue.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/10">
                          <span className="block text-[10px] text-red-400 uppercase font-mono font-semibold mb-1">Impact potentiel</span>
                          <p className="text-neutral-300">{issue.impact}</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <span className="block text-[10px] text-emerald-400 uppercase font-mono font-semibold mb-1">Procédure de correction</span>
                          <p className="text-neutral-300 font-mono text-[11px] whitespace-pre-wrap">{issue.fix}</p>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="p-8 rounded-2xl bg-neutral-900/10 border border-neutral-900 text-center text-xs text-neutral-500">
              Aucune anomalie détectée pour cette configuration de filtres.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
