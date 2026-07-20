"use client";

import React, { useState, useRef } from "react";
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
  Server
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawDomain = (params?.domain as string) || "cybelis.ma";
  const domain = decodeURIComponent(rawDomain);

  const reportRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"website" | "email" | "dns">("website");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [isExporting, setIsExporting] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  // Mock list of issues detected
  const [issues, setIssues] = useState([
    {
      id: "ssl_exp",
      category: "website",
      tool: "SSL Checker",
      title: "Le certificat SSL expire dans 12 jours",
      severity: "critical",
      description: "Le certificat SSL de votre serveur web expire très bientôt (le 20 juillet 2026). S'il n'est pas renouvelé, les navigateurs bloqueront l'accès à votre site avec un message d'avertissement de sécurité décourageant vos visiteurs.",
      impact: "Indisponibilité visuelle du site et rupture de confiance pour tous les utilisateurs.",
      fix: "Configurez le renouvellement automatique via votre hébergeur ou Let's Encrypt (Certbot), ou achetez et réinstallez un certificat SSL mis à jour auprès de votre autorité de certification.",
      resolved: false
    },
    {
      id: "hsts_missing",
      category: "website",
      tool: "Security Headers",
      title: "En-tête HSTS absent (Strict-Transport-Security)",
      severity: "high",
      description: "L'en-tête de sécurité HTTP Strict Transport Security (HSTS) n'est pas renvoyé par votre serveur web. Sans lui, votre site est vulnérable aux attaques par rétrogradation de protocole (SSL stripping) et au piratage de cookies.",
      impact: "Un attaquant sur le même réseau Wifi public peut intercepter les requêtes HTTP de vos utilisateurs avant leur redirection vers HTTPS.",
      fix: "Ajoutez l'en-tête suivant dans la configuration de votre serveur web (Nginx: 'add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;', Apache: 'Header always set Strict-Transport-Security \"max-age=31536000; includeSubDomains\"').",
      resolved: false
    },
    {
      id: "tls_obsolete",
      category: "website",
      tool: "TLS Analyzer",
      title: "Protocoles obsolètes TLS 1.0 & TLS 1.1 activés",
      severity: "high",
      description: "Votre serveur accepte les connexions chiffrées en TLS 1.0 et TLS 1.1. Ces protocoles cryptographiques datent de plus de 20 ans et présentent de nombreuses failles connues (e.g. BEAST, POODLE). Ils sont dépréciés par l'IETF depuis 2021.",
      impact: "Risque de décryptage des communications confidentielles par un attaquant en position d'écoute passive.",
      fix: "Modifiez les paramètres SSL/TLS de votre serveur (Apache / Nginx) ou de votre CDN (Cloudflare) pour rejeter les protocoles inférieurs à TLS 1.2. Privilégiez TLS 1.3.",
      resolved: false
    },
    {
      id: "cookie_insecure",
      category: "website",
      tool: "Cookie Analyzer",
      title: "Cookies de session sans flag 'Secure'",
      severity: "medium",
      description: "Certains cookies de session (Set-Cookie) retournés par le serveur web ne possèdent pas le flag 'Secure'. Ce flag indique au navigateur que le cookie doit uniquement être transmis via une connexion HTTPS chiffrée.",
      impact: "Un cookie contenant des données de session sensibles peut fuiter en clair si l'utilisateur accède par mégarde à une URL en http://.",
      fix: "Dans le code de votre application (ex: PHP session.cookie_secure, Node.js express-session secure: true), activez systématiquement le flag 'Secure' ainsi que 'HttpOnly' et 'SameSite=Lax'.",
      resolved: false
    },
    {
      id: "dmarc_missing",
      category: "email",
      tool: "SPF/DKIM/DMARC",
      title: "Enregistrement DNS DMARC manquant",
      severity: "high",
      description: "Aucun enregistrement DNS TXT n'a été trouvé pour la clé DMARC (_dmarc.domain). DMARC (Domain-based Message Authentication) permet de spécifier aux serveurs récepteurs de messagerie comment traiter vos e-mails s'ils échouent aux tests SPF/DKIM.",
      impact: "Risque très élevé d'usurpation de votre identité de domaine (email spoofing) pour envoyer des campagnes de phishing à votre nom.",
      fix: "Créez un enregistrement TXT DNS sous l'hôte '_dmarc' avec une valeur initiale : 'v=DMARC1; p=none; rua=mailto:dmarc-reports@votre-domaine.com'. Augmentez plus tard la politique à 'p=quarantine' ou 'p=reject'.",
      resolved: false
    },
    {
      id: "csp_missing",
      category: "website",
      tool: "CSP Validator",
      title: "Content Security Policy (CSP) non configurée",
      severity: "medium",
      description: "Votre serveur ne transmet aucun en-tête Content-Security-Policy. La CSP indique au navigateur quelles sources de scripts, d'images et de styles sont autorisées à s'exécuter, bloquant de fait les attaques XSS.",
      impact: "Si votre site contient une faille d'injection de script, des codes malveillants tiers peuvent s'exécuter dans le navigateur de vos clients.",
      fix: "Configurez l'en-tête 'Content-Security-Policy' en spécifiant des directives strictes. Exemple simple: \"default-src 'self'; script-src 'self' https://trustedscripts.com; style-src 'self' 'unsafe-inline';\".",
      resolved: false
    },
    {
      id: "spf_loose",
      category: "email",
      tool: "SPF/DKIM/DMARC",
      title: "Enregistrement DNS SPF trop permis (~all)",
      severity: "low",
      description: "Le mécanisme de votre enregistrement DNS SPF se termine par '~all' (SoftFail) ou '+all' au lieu de '-all' (HardFail). Les serveurs de réception considèrent cela comme une tolérance envers les expéditeurs non autorisés.",
      impact: "Les e-mails usurpant votre adresse ont plus de chances d'arriver dans la boîte de spam de vos clients au lieu d'être rejetés d'emblée.",
      fix: "Modifiez l'enregistrement TXT SPF de votre DNS pour remplacer '~all' par '-all' une fois que vous avez identifié toutes les passerelles d'envoi légitimes.",
      resolved: false
    },
    {
      id: "caa_missing",
      category: "dns",
      tool: "DNS Lookup",
      title: "Enregistrement DNS CAA absent",
      severity: "low",
      description: "L'enregistrement CAA (Certification Authority Authorization) n'est pas configuré. Cet enregistrement spécifie quelles autorités de certification (par exemple Let's Encrypt, Sectigo) sont autorisées à émettre des certificats SSL pour votre domaine.",
      impact: "N'importe quelle autorité de certification peut techniquement émettre un certificat SSL pour votre site si elle est sollicitée par un tiers malveillant.",
      fix: "Ajoutez un enregistrement DNS de type CAA avec la valeur '0 issue \"letsencrypt.org\"' pour limiter la génération de certificats à votre fournisseur habituel.",
      resolved: false
    }
  ]);

  // Handle marking an issue as resolved (purely client-side for UX interaction)
  const toggleResolve = (id: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === id ? { ...issue, resolved: !issue.resolved } : issue
    ));
  };

  // PDF generation method using html2canvas & jsPDF
  const exportPDF = async () => {
    if (!reportRef.current) return;
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

      pdf.save(`Rapport_Cybelis_${domain}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter issues based on active Tab and severity filter
  const activeIssues = issues.filter(issue => {
    if (activeTab === "website" && issue.category !== "website") return false;
    if (activeTab === "email" && issue.category !== "email") return false;
    if (activeTab === "dns" && issue.category !== "dns") return false;

    if (severityFilter !== "all" && issue.severity !== severityFilter) return false;

    return true;
  });

  // Calculate live score
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
    if (score >= 70) return { grade: "C", desc: "Moyen", color: "text-yellow-500 border-yellow-500/20" };
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
                <span className="text-white">185.190.140.15</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] text-neutral-500 uppercase font-semibold">Date d'analyse</span>
                <span className="text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {new Date().toLocaleDateString("fr-FR")}
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
              <span className="text-[9px] text-neutral-500 uppercase font-mono">Tests</span>
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

          <div className="lg:col-span-3 flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center gap-2">
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
