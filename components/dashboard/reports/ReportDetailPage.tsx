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
  Lock
} from "lucide-react";
import { getOwaspMapping, OwaspInfo } from "@/lib/enrichment/owasp";
import { fetchCveForFinding, CveInfo } from "@/lib/enrichment/cve";
import { calculateIso27001Compliance, Iso27001Report } from "@/lib/enrichment/iso27001";

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

                const fixText = getFixTextForTool(toolSlug, rec.title) || rec.description;
                const impactText = getImpactTextForTool(toolSlug, rec.title) || "Risque d'exposition et de compromission des données ou de la disponibilité de la plateforme.";

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

              const fixText = getFixTextForTool(toolSlug, result.tool.name) || `Vérifiez la configuration du module ${result.tool.name}.`;
              const impactText = getImpactTextForTool(toolSlug, result.tool.name) || "Risque d'exposition et de compromission des données ou de la disponibilité de la plateforme.";

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
      const { jsPDF } = await import("jspdf");

      // ─── CONSTANTS & PALETTE ──────────────────────────────────────────────
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const PW = 210, PH = 297;
      const M = 18; // margin
      const CW = PW - M * 2;
      const HEADER_H = 14, FOOTER_H = 10;
      const CONTENT_TOP = HEADER_H + 6;
      const CONTENT_BOTTOM = PH - FOOTER_H - 4;

      // Color palette
      const C = {
        navy:    [10, 25, 60]   as [number,number,number],
        navyLight:[20, 48, 100] as [number,number,number],
        accent:  [37, 99, 235]  as [number,number,number],
        accentLight:[219,234,254] as [number,number,number],
        white:   [255,255,255]  as [number,number,number],
        ink:     [15, 23, 42]   as [number,number,number],
        body:    [51, 65, 85]   as [number,number,number],
        muted:   [100,116,139]  as [number,number,number],
        border:  [203,213,225]  as [number,number,number],
        bg:      [248,250,252]  as [number,number,number],
        critical:[185, 28, 28]  as [number,number,number],
        criticalBg:[254,226,226] as [number,number,number],
        high:    [194, 65, 12]  as [number,number,number],
        highBg:  [255,237,213]  as [number,number,number],
        medium:  [161, 98, 7]   as [number,number,number],
        mediumBg:[254,243,199]  as [number,number,number],
        low:     [3, 105, 161]  as [number,number,number],
        lowBg:   [224,242,254]  as [number,number,number],
        green:   [5, 150, 105]  as [number,number,number],
        greenBg: [209,250,229]  as [number,number,number],
        red:     [220, 38, 38]  as [number,number,number],
        amber:   [217,119,6]    as [number,number,number],
        purple:  [79, 70, 229]  as [number,number,number],
        purpleBg:[237,233,254]  as [number,number,number],
      };

      // Scan data
      const domain = scan.website.domain;
      const scanDate = new Date(scan.createdAt);
      const score = scan.securityScore?.score ?? 0;
      const grade = scan.securityScore?.grade ?? (score >= 90 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : score >= 30 ? "D" : "F");
      const criticalCount = issues.filter(i => i.severity === "critical").length;
      const highCount = issues.filter(i => i.severity === "high").length;
      const mediumCount = issues.filter(i => i.severity === "medium").length;
      const lowCount = issues.filter(i => i.severity === "low").length;

      // ─── HELPERS ────────────────────────────────────────────────────────
      let y = CONTENT_TOP;
      let currentPage = 1;

      const drawPageHeader = (page: number) => {
        // Background strip
        doc.setFillColor(...C.navy);
        doc.rect(0, 0, PW, HEADER_H, "F");
        // Accent bar
        doc.setFillColor(...C.accent);
        doc.rect(0, HEADER_H - 1.5, PW, 1.5, "F");
        // Left: brand name
        doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
        doc.text("CYBELIS", M, 9);
        doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
        doc.text("Cyber Security Assessment", M, 12.5);
        // Right: domain
        doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
        doc.text(domain, PW - M, 9, { align: "right" });
        doc.text(`Audit du ${scanDate.toLocaleDateString("fr-FR")}`, PW - M, 12.5, { align: "right" });
      };

      const drawPageFooter = (page: number, totalPages: number) => {
        doc.setDrawColor(...C.border);
        doc.line(M, PH - FOOTER_H, PW - M, PH - FOOTER_H);
        doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
        doc.text(`© ${new Date().getFullYear()} Cybelis — Rapport Confidentiel`, M, PH - 5);
        doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`, PW / 2, PH - 5, { align: "center" });
        doc.text(`Page ${page} / ${totalPages}`, PW - M, PH - 5, { align: "right" });
      };

      const newPage = () => {
        doc.addPage();
        currentPage++;
        y = CONTENT_TOP;
        drawPageHeader(currentPage);
      };

      const checkPage = (needed: number) => {
        if (y + needed > CONTENT_BOTTOM) newPage();
      };

      const sectionTitle = (title: string, icon: string = "") => {
        checkPage(16);
        doc.setFillColor(...C.navy);
        doc.roundedRect(M, y, CW, 9, 1.5, 1.5, "F");
        doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
        doc.text(`${icon}  ${title}`.trim(), M + 4, y + 6);
        y += 14;
      };

      const bodyText = (text: string, size = 9, color: [number,number,number] = C.body, indent = 0) => {
        doc.setFontSize(size); doc.setFont("helvetica", "normal"); doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, CW - indent);
        lines.forEach((l: string) => { checkPage(6); doc.text(l, M + indent, y); y += 5; });
      };

      const labelText = (label: string, value: string, labelColor = C.muted, valueColor = C.ink) => {
        checkPage(7);
        doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...labelColor);
        doc.text(label, M + 3, y);
        doc.setFont("helvetica", "normal"); doc.setTextColor(...valueColor);
        doc.text(value, M + 38, y);
        y += 5.5;
      };

      const severityColors = (sev: string): { fg: [number,number,number], bg: [number,number,number], label: string } => {
        if (sev === "critical") return { fg: C.critical, bg: C.criticalBg, label: "CRITIQUE" };
        if (sev === "high")     return { fg: C.high,     bg: C.highBg,     label: "ÉLEVÉ" };
        if (sev === "medium")   return { fg: C.medium,   bg: C.mediumBg,   label: "MOYEN" };
        return                         { fg: C.low,      bg: C.lowBg,      label: "FAIBLE" };
      };

      const drawBadge = (label: string, fg: [number,number,number], bg: [number,number,number], x: number, yPos: number, w = 22, h = 5.5) => {
        doc.setFillColor(...bg);
        doc.roundedRect(x, yPos - 4, w, h, 1.5, 1.5, "F");
        doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...fg);
        doc.text(label, x + w / 2, yPos, { align: "center" });
      };

      const hRule = (alpha = C.border) => {
        checkPage(6);
        doc.setDrawColor(...alpha);
        doc.line(M, y, PW - M, y);
        y += 6;
      };

      // ════════════════════════════════════════════════════════════════════
      // PAGE 1 : COVER PAGE
      // ════════════════════════════════════════════════════════════════════
      doc.setFillColor(...C.navy);
      doc.rect(0, 0, PW, PH, "F");

      // Accent diagonal stripe
      doc.setFillColor(...C.navyLight);
      doc.rect(0, 100, PW, 2, "F");

      // Top brand
      doc.setFontSize(28); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
      doc.text("CYBELIS", PW / 2, 55, { align: "center" });
      doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
      doc.text("CYBER SECURITY PLATFORM", PW / 2, 63, { align: "center" });

      // Accent line
      doc.setFillColor(...C.accent);
      doc.rect(M + 30, 67, CW - 60, 1, "F");

      // Report title
      doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
      doc.text("Cyber Security Assessment Report", PW / 2, 82, { align: "center" });
      doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
      doc.text("Rapport d'Audit de Sécurité — Analyse Externe", PW / 2, 90, { align: "center" });

      // Target info box
      doc.setFillColor(20, 45, 100);
      doc.roundedRect(M + 15, 98, CW - 30, 36, 3, 3, "F");
      doc.setFillColor(...C.accent);
      doc.roundedRect(M + 15, 98, 3, 36, 1.5, 1.5, "F");

      doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(148, 163, 184);
      doc.text("CIBLE D'ANALYSE", M + 22, 108);
      doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
      doc.text(domain, M + 22, 116);
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
      doc.text(`Date du scan : ${scanDate.toLocaleDateString("fr-FR")}  |  Heure : ${scanDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`, M + 22, 123);
      doc.text(`Généré par : Cybelis Security Platform`, M + 22, 129);

      // Score gauge
      const scoreGaugeX = PW - M - 30;
      const scoreGaugeY = 145;
      const scoreColor: [number,number,number] = score >= 80 ? C.green : score >= 60 ? [234, 179, 8] : C.red;
      doc.setFillColor(20, 45, 100);
      doc.circle(scoreGaugeX, scoreGaugeY, 20, "F");
      doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.setTextColor(...scoreColor);
      doc.text(`${score}`, scoreGaugeX, scoreGaugeY + 3, { align: "center" });
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
      doc.text("/100", scoreGaugeX, scoreGaugeY + 9, { align: "center" });
      doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
      doc.text(`Grade ${grade}`, scoreGaugeX, scoreGaugeY + 15.5, { align: "center" });
      doc.text("Security Score", scoreGaugeX, scoreGaugeY + 19, { align: "center" });

      // Vuln summary pills on cover
      const pills = [
        { label: "CRITIQUE", count: criticalCount, fg: C.critical, bg: C.criticalBg },
        { label: "ÉLEVÉ",    count: highCount,     fg: C.high,     bg: C.highBg     },
        { label: "MOYEN",    count: mediumCount,   fg: C.medium,   bg: C.mediumBg   },
        { label: "FAIBLE",   count: lowCount,      fg: C.low,      bg: C.lowBg      },
      ];
      const pillW = 36, pillH = 22, pillGap = 5;
      const pillsTotalW = pills.length * pillW + (pills.length - 1) * pillGap;
      let pillX = (PW - pillsTotalW) / 2;
      const pillY = 155;
      pills.forEach(p => {
        doc.setFillColor(20, 45, 100);
        doc.roundedRect(pillX, pillY, pillW, pillH, 2, 2, "F");
        doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(...p.fg);
        doc.text(`${p.count}`, pillX + pillW / 2, pillY + 12, { align: "center" });
        doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(148, 163, 184);
        doc.text(p.label, pillX + pillW / 2, pillY + 18, { align: "center" });
        pillX += pillW + pillGap;
      });

      // ISO 27001 on cover
      if (isoCompliance && isoCompliance.totalControls > 0) {
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
        doc.text(`Conformité ISO/IEC 27001:2022 : ${isoCompliance.compliancePercentage}% — ${isoCompliance.passedCount} / ${isoCompliance.totalControls} contrôles`, PW / 2, 186, { align: "center" });
      }

      // Cover footer
      doc.setFillColor(15, 35, 80);
      doc.rect(0, PH - 22, PW, 22, "F");
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
      doc.text("DOCUMENT CONFIDENTIEL — Réservé à usage interne ou client désigné", PW / 2, PH - 12, { align: "center" });
      doc.text(`© ${new Date().getFullYear()} Cybelis — Tous droits réservés`, PW / 2, PH - 7, { align: "center" });

      // ════════════════════════════════════════════════════════════════════
      // PAGE 2 : TABLE OF CONTENTS
      // ════════════════════════════════════════════════════════════════════
      doc.addPage();
      currentPage = 2;
      drawPageHeader(currentPage);
      y = CONTENT_TOP + 4;

      doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
      doc.text("Table des Matières", M, y); y += 10;
      hRule();

      const tocItems = [
        { num: "01", title: "Résumé Exécutif", page: 3 },
        { num: "02", title: "Détail des Vulnérabilités & Références OWASP / CVE", page: 4 },
        { num: "03", title: "Matrice de Conformité ISO/IEC 27001:2022", page: issues.length > 5 ? 6 : 5 },
        { num: "04", title: "Conclusion & Priorités de Remédiation", page: issues.length > 8 ? 8 : 6 },
      ];

      tocItems.forEach((item) => {
        checkPage(12);
        doc.setFillColor(...C.bg);
        doc.roundedRect(M, y - 4.5, CW, 8, 1, 1, "F");
        doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.accent);
        doc.text(item.num, M + 3, y);
        doc.setFont("helvetica", "normal"); doc.setTextColor(...C.ink);
        doc.text(item.title, M + 12, y);
        doc.setTextColor(...C.muted);
        doc.text(`p. ${item.page}`, PW - M - 3, y, { align: "right" });
        // Dotted leader
        doc.setDrawColor(...C.border);
        const titleW = doc.getTextWidth(item.title);
        const pageW = doc.getTextWidth(`p. ${item.page}`);
        const leaderStart = M + 12 + titleW + 4;
        const leaderEnd = PW - M - 3 - pageW - 4;
        for (let lx = leaderStart; lx < leaderEnd; lx += 3) {
          doc.circle(lx, y - 1.5, 0.3, "F");
        }
        y += 12;
      });

      // ════════════════════════════════════════════════════════════════════
      // PAGE 3+ : EXECUTIVE SUMMARY
      // ════════════════════════════════════════════════════════════════════
      newPage();
      sectionTitle("01 — Résumé Exécutif");

      // Score card
      checkPage(40);
      doc.setFillColor(...C.bg);
      doc.roundedRect(M, y, CW, 38, 3, 3, "F");
      doc.setDrawColor(...C.border);
      doc.roundedRect(M, y, CW, 38, 3, 3, "S");

      // Score circle inside exec summary
      const sc = { x: M + 22, y: y + 19 };
      const scoreColor2: [number,number,number] = score >= 80 ? C.green : score >= 60 ? [234, 179, 8] : C.red;
      doc.setFillColor(...scoreColor2);
      doc.circle(sc.x, sc.y, 14, "F");
      doc.setFillColor(...C.white);
      doc.circle(sc.x, sc.y, 11.5, "F");
      doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(...scoreColor2);
      doc.text(`${score}`, sc.x, sc.y + 2, { align: "center" });
      doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
      doc.text("/100", sc.x, sc.y + 7, { align: "center" });
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
      doc.text(`Grade ${grade}`, sc.x, sc.y + 13, { align: "center" });

      // Stats inside card
      const statsX = M + 50;
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
      doc.text("Résultats de l'analyse de sécurité", statsX, y + 8);
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
      doc.text(`Domaine analysé : ${domain}`, statsX, y + 14);
      doc.text(`Date : ${scanDate.toLocaleDateString("fr-FR")} — ${scanDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`, statsX, y + 20);
      doc.text(`Total vulnérabilités : ${issues.length}`, statsX, y + 26);
      if (isoCompliance) {
        doc.text(`Conformité ISO 27001 : ${isoCompliance.compliancePercentage}% (${isoCompliance.passedCount}/${isoCompliance.totalControls})`, statsX, y + 32);
      }
      y += 44;

      // Severity breakdown bar chart
      checkPage(35);
      doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
      doc.text("Répartition des vulnérabilités par sévérité", M, y); y += 7;
      const total_issues = issues.length || 1;
      const barGroups = [
        { label: "Critique", count: criticalCount, fg: C.critical, bg: C.criticalBg },
        { label: "Élevé",    count: highCount,     fg: C.high,     bg: C.highBg },
        { label: "Moyen",    count: mediumCount,   fg: C.medium,   bg: C.mediumBg },
        { label: "Faible",   count: lowCount,      fg: C.low,      bg: C.lowBg },
      ];
      const barMaxW = CW - 42;
      barGroups.forEach(bg_item => {
        checkPage(9);
        const barW = Math.max((bg_item.count / total_issues) * barMaxW, bg_item.count > 0 ? 2 : 0);
        doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
        doc.text(bg_item.label, M, y);
        doc.setFillColor(...bg_item.bg);
        doc.roundedRect(M + 20, y - 4.5, barMaxW, 6, 1, 1, "F");
        doc.setFillColor(...bg_item.fg);
        if (barW > 0) doc.roundedRect(M + 20, y - 4.5, barW, 6, 1, 1, "F");
        doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
        if (barW > 6) doc.text(`${bg_item.count}`, M + 20 + barW - 3, y - 0.5, { align: "right" });
        else {
          doc.setTextColor(...bg_item.fg);
          doc.text(`${bg_item.count}`, M + 20 + barMaxW + 3, y - 0.5);
        }
        y += 9;
      });
      y += 4;
      hRule();

      // ════════════════════════════════════════════════════════════════════
      // VULNERABILITY DETAIL CARDS
      // ════════════════════════════════════════════════════════════════════
      sectionTitle("02 — Détail des Vulnérabilités");

      if (issues.length === 0) {
        checkPage(16);
        doc.setFillColor(...C.greenBg);
        doc.roundedRect(M, y, CW, 12, 2, 2, "F");
        doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.green);
        doc.text("✓  Aucune vulnérabilité détectée lors de cette analyse.", M + 5, y + 8);
        y += 18;
      } else {
        issues.forEach((issue, idx) => {
          // Estimate card height to check page
          checkPage(50);

          const sev = severityColors(issue.severity);

          // Card background
          doc.setFillColor(...C.bg);
          doc.setDrawColor(...C.border);
          doc.roundedRect(M, y, CW, 7, 1.5, 1.5, "F");
          // Severity color bar on left
          doc.setFillColor(...sev.fg);
          doc.roundedRect(M, y, 3, 7, 1.5, 1.5, "F");
          doc.rect(M, y + 3, 3, 4, "F");

          // Issue number & title
          doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.muted);
          doc.text(`#${String(idx + 1).padStart(2, "0")}`, M + 6, y + 5);
          doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
          const titleTruncated = issue.title.length > 70 ? issue.title.substring(0, 67) + "..." : issue.title;
          doc.text(titleTruncated, M + 16, y + 5);
          // Severity badge
          drawBadge(sev.label, sev.fg, sev.bg, PW - M - 26, y + 5);
          y += 9;

          // Metadata row
          doc.setFillColor(240, 244, 248);
          doc.rect(M + 3, y, CW - 3, 6, "F");
          doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
          doc.text(`Outil : ${issue.tool}  |  Catégorie : ${issue.category.toUpperCase()}`, M + 5, y + 4);
          y += 8;

          // Description
          checkPage(12);
          doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
          doc.text("Description", M + 3, y); y += 5;
          bodyText(issue.description, 7.5, C.body, 3);
          y += 2;

          // Impact
          if (issue.impact) {
            checkPage(10);
            doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.medium);
            doc.text("Impact", M + 3, y); y += 5;
            bodyText(issue.impact, 7.5, C.body, 3);
            y += 2;
          }

          // Recommendation / Fix
          if (issue.fix) {
            checkPage(12);
            doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.green);
            doc.text("Recommandation", M + 3, y); y += 5;
            // Display as bullet
            const fixLines = doc.splitTextToSize(issue.fix, CW - 9);
            doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.body);
            fixLines.forEach((fl: string, fi: number) => {
              checkPage(6);
              if (fi === 0) {
                doc.text("•", M + 5, y);
                doc.text(fl, M + 9, y);
              } else {
                doc.text(fl, M + 9, y);
              }
              y += 5;
            });
            y += 2;
          }

          // OWASP badges
          if (issue.owasp && issue.owasp.length > 0) {
            checkPage(18);
            doc.setFillColor(...C.purpleBg);
            const owaspBlockH = issue.owasp.length * 13 + 6;
            checkPage(owaspBlockH + 4);
            doc.roundedRect(M + 3, y, CW - 3, owaspBlockH, 1.5, 1.5, "F");
            doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.purple);
            doc.text("OWASP Top 10 2021", M + 6, y + 5);
            y += 7;
            issue.owasp.forEach(o => {
              doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.purple);
              doc.text(`[${o.code}]`, M + 6, y);
              doc.setFont("helvetica", "normal"); doc.setTextColor(...C.ink);
              doc.text(o.title, M + 24, y);
              y += 6;
              const owLines = doc.splitTextToSize(o.description, CW - 12);
              doc.setFontSize(6.5); doc.setTextColor(...C.body);
              owLines.slice(0, 2).forEach((l: string) => { doc.text(l, M + 6, y); y += 4.5; });
            });
            y += 3;
          }

          // CVE / CVSS
          checkPage(12);
          if (issue.cve) {
            doc.setFillColor(254, 242, 242);
            doc.roundedRect(M + 3, y, CW - 3, 16, 1.5, 1.5, "F");
            doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.red);
            doc.text("CVE / CVSS", M + 6, y + 5);
            doc.setFont("helvetica", "normal"); doc.setTextColor(...C.ink);
            doc.text(`${issue.cve.cveId}`, M + 6, y + 10);
            drawBadge(`CVSS ${issue.cve.cvssScore}`, C.red, [254,226,226], M + 26, y + 10, 22, 5.5);
            drawBadge(issue.cve.severity, C.red, [254,226,226], M + 52, y + 10, 22, 5.5);
            doc.setFontSize(6); doc.setTextColor(...C.accent);
            doc.text(issue.cve.url, M + 6, y + 15);
            y += 20;
          } else {
            doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
            doc.text("Aucune référence CVE disponible pour cette vulnérabilité de configuration.", M + 3, y + 4);
            y += 9;
          }

          // Separator between issues
          y += 3;
          doc.setDrawColor(...C.border);
          doc.setLineDashPattern([1, 2], 0);
          doc.line(M, y, PW - M, y);
          doc.setLineDashPattern([], 0);
          y += 6;
        });
      }

      // ════════════════════════════════════════════════════════════════════
      // ISO 27001 TABLE
      // ════════════════════════════════════════════════════════════════════
      if (isoCompliance && isoCompliance.totalControls > 0) {
        newPage();
        sectionTitle("03 — Matrice de Conformité ISO/IEC 27001:2022");

        // ISO summary bar
        checkPage(12);
        const isoBarW = CW;
        const isoBarFill = (isoCompliance.passedCount / isoCompliance.totalControls) * isoBarW;
        doc.setFillColor(...C.border);
        doc.roundedRect(M, y, isoBarW, 5, 1, 1, "F");
        doc.setFillColor(...C.green);
        doc.roundedRect(M, y, isoBarFill, 5, 1, 1, "F");
        doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
        doc.text(`${isoCompliance.compliancePercentage}% de conformité — ${isoCompliance.passedCount} conformes / ${isoCompliance.totalControls} contrôles analysés`, M, y + 10);
        y += 14;

        // Table header
        checkPage(12);
        doc.setFillColor(...C.navy);
        doc.rect(M, y, CW, 7, "F");
        doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
        const colCode = M + 2, colStatus = M + 22, colName = M + 42, colRec = M + 100;
        doc.text("Code", colCode, y + 5);
        doc.text("Statut", colStatus, y + 5);
        doc.text("Contrôle", colName, y + 5);
        doc.text("Recommandation", colRec, y + 5);
        y += 7;

        // Table rows
        isoCompliance.controls.forEach((ctrl, ri) => {
          const rowH = 9;
          checkPage(rowH + 2);

          // Alternate row background
          if (ri % 2 === 0) {
            doc.setFillColor(...C.bg);
            doc.rect(M, y, CW, rowH, "F");
          }

          const sColor: [number,number,number] = ctrl.status === "CONFORME" ? C.green : C.red;
          const sBg: [number,number,number] = ctrl.status === "CONFORME" ? C.greenBg : C.criticalBg;

          doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.muted);
          doc.text(ctrl.code, colCode, y + 6);

          drawBadge(ctrl.status === "CONFORME" ? "CONFORME" : "NON CONF.", sColor, sBg, colStatus, y + 6, 18, 5.5);

          doc.setFont("helvetica", "normal"); doc.setTextColor(...C.ink);
          const nameStr = ctrl.name.length > 32 ? ctrl.name.substring(0, 29) + "..." : ctrl.name;
          doc.text(nameStr, colName, y + 6);

          const recStr = (ctrl.status === "NON_CONFORME" && ctrl.recommendation)
            ? (ctrl.recommendation.length > 38 ? ctrl.recommendation.substring(0, 35) + "..." : ctrl.recommendation)
            : "—";
          doc.setTextColor(...C.muted);
          doc.text(recStr, colRec, y + 6);

          y += rowH;
        });
        y += 6;
        hRule();
      }

      // ════════════════════════════════════════════════════════════════════
      // CONCLUSION
      // ════════════════════════════════════════════════════════════════════
      checkPage(60);
      sectionTitle("04 — Conclusion & Priorités de Remédiation");

      // Overall risk level
      const overallRisk = criticalCount > 0 ? { label: "CRITIQUE", color: C.critical, bg: C.criticalBg }
        : highCount > 0 ? { label: "ÉLEVÉ", color: C.high, bg: C.highBg }
        : mediumCount > 0 ? { label: "MOYEN", color: C.medium, bg: C.mediumBg }
        : { label: "FAIBLE", color: C.low, bg: C.lowBg };

      checkPage(20);
      doc.setFillColor(...overallRisk.bg);
      doc.roundedRect(M, y, CW, 14, 2, 2, "F");
      doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...overallRisk.color);
      doc.text(`Niveau de Risque Global : ${overallRisk.label}`, M + 5, y + 6);
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.body);
      doc.text(`Score de sécurité : ${score}/100 (Grade ${grade})  |  ${issues.length} vulnérabilité(s) détectée(s)`, M + 5, y + 11);
      y += 19;

      // Priority actions
      const priorities = [
        criticalCount > 0 ? `Traiter immédiatement les ${criticalCount} vulnérabilité(s) CRITIQUE(S) — elles représentent un risque de compromission immédiate.` : null,
        highCount > 0 ? `Planifier la correction des ${highCount} vulnérabilité(s) ÉLEVÉE(S) dans les 30 prochains jours.` : null,
        mediumCount > 0 ? `Corriger les ${mediumCount} vulnérabilité(s) MOYENNE(S) dans les 90 prochains jours.` : null,
        isoCompliance && isoCompliance.totalControls > isoCompliance.passedCount ? `Améliorer la conformité ISO 27001:2022 : ${isoCompliance.totalControls - isoCompliance.passedCount} contrôle(s) non conformes.` : null,
        "Effectuer un nouveau scan de sécurité après chaque correction pour valider l'amélioration.",
      ].filter(Boolean) as string[];

      checkPage(12);
      doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
      doc.text("Actions Prioritaires de Remédiation", M, y); y += 7;

      priorities.forEach((p, i) => {
        checkPage(12);
        const pColor: [number,number,number] = i === 0 && criticalCount > 0 ? C.critical
          : i === 1 && highCount > 0 ? C.high
          : C.body;
        doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...pColor);
        const bLines = doc.splitTextToSize(`${i + 1}. ${p}`, CW - 5);
        bLines.forEach((l: string, li: number) => {
          checkPage(6);
          doc.text(l, M + (li === 0 ? 0 : 5), y);
          y += 5.5;
        });
        y += 1;
      });

      y += 4;
      hRule();

      checkPage(12);
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
      doc.text("Ce rapport a été généré automatiquement par la plateforme Cybelis à partir de données réelles d'analyse externe passive.", M, y);
      y += 5;
      doc.text("Il ne reflète que les données disponibles publiquement au moment du scan et ne constitue pas un audit de sécurité exhaustif.", M, y);

      // ════════════════════════════════════════════════════════════════════
      // ADD HEADER & FOOTER TO ALL PAGES
      // ════════════════════════════════════════════════════════════════════
      const totalPages = doc.getNumberOfPages();
      for (let p = 2; p <= totalPages; p++) {
        doc.setPage(p);
        drawPageHeader(p);
        drawPageFooter(p, totalPages);
      }

      doc.save(`Cybelis_Security_Report_${domain}_${new Date().toISOString().slice(0, 10)}.pdf`);
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
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                    control.status === "CONFORME"
                      ? "bg-emerald-50/50 border-emerald-200 text-slate-800"
                      : "bg-amber-50/50 border-amber-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500">{control.code}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      control.status === "CONFORME"
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
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      ctrl.status === "CONFORME"
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
                return (
                  <div 
                    key={issue.id} 
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      issue.resolved 
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
                          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                            issue.severity === "critical" ? "text-red-500 animate-pulse" :
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
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-colors ${
                            issue.resolved
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
                        
                        <div>
                          <span className="block text-[10px] text-slate-400 uppercase font-mono font-semibold mb-1">Description</span>
                          <p>{issue.description}</p>
                        </div>

                        {/* OWASP TOP 10 CARDS */}
                        {issue.owasp && issue.owasp.length > 0 && issue.owasp.map((o, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                              <FileCode className="w-4 h-4 text-indigo-600" />
                              <span>OWASP Top 10 : {o.code} - {o.title}</span>
                            </div>
                            <p className="text-[11px] text-indigo-800 leading-relaxed">{o.description}</p>
                            {o.recommendations.length > 0 && (
                              <ul className="list-disc list-inside text-[11px] text-indigo-900 space-y-0.5 pt-1 font-medium">
                                {o.recommendations.map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}

                        {/* CVE / CVSS CARD */}
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
                            <span className="block text-[10px] text-red-600 uppercase font-mono font-semibold mb-1">Impact potentiel</span>
                            <p className="text-slate-700">{issue.impact}</p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                            <span className="block text-[10px] text-emerald-600 uppercase font-mono font-semibold mb-1">Procédure de correction</span>
                            <p className="text-slate-700 font-mono text-[11px] whitespace-pre-wrap">{issue.fix}</p>
                          </div>
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
