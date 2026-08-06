import type { OwaspInfo } from "@/lib/enrichment/owasp";
import type { CveInfo } from "@/lib/enrichment/cve";
import type { Iso27001Report } from "@/lib/enrichment/iso27001";
import { getSecurityImpact, getCiaCategoryInfo } from "@/lib/enrichment/securityImpact";

export interface PdfIssue {
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

export interface PdfScanData {
  website: { domain: string };
  createdAt: string;
  securityScore?: { score: number; grade: string } | null;
}

export async function generateCybelisPDF(
  scan: PdfScanData,
  issues: PdfIssue[],
  isoCompliance: Iso27001Report | null
): Promise<void> {
  const { jsPDF } = await import("jspdf");

  // ─── CONSTANTS & PALETTE ──────────────────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210, PH = 297;
  const M = 18;
  const CW = PW - M * 2;
  const HEADER_H = 14, FOOTER_H = 10;
  const CONTENT_TOP = HEADER_H + 6;
  const CONTENT_BOTTOM = PH - FOOTER_H - 4;

  const C = {
    navy:       [10, 25, 60]    as [number,number,number],
    navyLight:  [20, 48, 100]   as [number,number,number],
    accent:     [37, 99, 235]   as [number,number,number],
    white:      [255,255,255]   as [number,number,number],
    ink:        [15, 23, 42]    as [number,number,number],
    body:       [51, 65, 85]    as [number,number,number],
    muted:      [100,116,139]   as [number,number,number],
    border:     [203,213,225]   as [number,number,number],
    bg:         [248,250,252]   as [number,number,number],
    critical:   [185, 28, 28]   as [number,number,number],
    criticalBg: [254,226,226]   as [number,number,number],
    high:       [194, 65, 12]   as [number,number,number],
    highBg:     [255,237,213]   as [number,number,number],
    medium:     [161, 98, 7]    as [number,number,number],
    mediumBg:   [254,243,199]   as [number,number,number],
    low:        [3, 105, 161]   as [number,number,number],
    lowBg:      [224,242,254]   as [number,number,number],
    green:      [5, 150, 105]   as [number,number,number],
    greenBg:    [209,250,229]   as [number,number,number],
    red:        [220, 38, 38]   as [number,number,number],
    purple:     [79, 70, 229]   as [number,number,number],
    purpleBg:   [237,233,254]   as [number,number,number],
  };

  const domain = scan.website.domain;
  const scanDate = new Date(scan.createdAt);
  const score = scan.securityScore?.score ?? 0;
  const grade = scan.securityScore?.grade ?? (score >= 90 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : score >= 30 ? "D" : "F");
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const highCount     = issues.filter(i => i.severity === "high").length;
  const mediumCount   = issues.filter(i => i.severity === "medium").length;
  const lowCount      = issues.filter(i => i.severity === "low").length;

  // ─── HELPERS ──────────────────────────────────────────────────────────
  let y = CONTENT_TOP;
  let currentPage = 1;

  const drawPageHeader = () => {
    doc.setFillColor(...C.navy);
    doc.rect(0, 0, PW, HEADER_H, "F");
    doc.setFillColor(...C.accent);
    doc.rect(0, HEADER_H - 1.5, PW, 1.5, "F");
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
    doc.text("CYBELIS", M, 9);
    doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
    doc.text("Cyber Security Assessment", M, 12.5);
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
    drawPageHeader();
  };

  const checkPage = (needed: number) => {
    if (y + needed > CONTENT_BOTTOM) newPage();
  };

  const sectionTitle = (title: string) => {
    checkPage(16);
    doc.setFillColor(...C.navy);
    doc.roundedRect(M, y, CW, 9, 1.5, 1.5, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
    doc.text(title, M + 4, y + 6);
    y += 14;
  };

  const bodyText = (text: string, size = 9, color: [number,number,number] = C.body, indent = 0) => {
    doc.setFontSize(size); doc.setFont("helvetica", "normal"); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CW - indent);
    lines.forEach((l: string) => { checkPage(6); doc.text(l, M + indent, y); y += 5; });
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

  const hRule = () => {
    checkPage(6);
    doc.setDrawColor(...C.border);
    doc.line(M, y, PW - M, y);
    y += 6;
  };

  // ════════════════════════════════════════════════════════════════════
  // PAGE 1 : COVER PAGE
  // ════════════════════════════════════════════════════════════════════
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, PW, PH, "F");
  doc.setFillColor(...C.navyLight);
  doc.rect(0, 100, PW, 2, "F");

  doc.setFontSize(28); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
  doc.text("CYBELIS", PW / 2, 55, { align: "center" });
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
  doc.text("CYBER SECURITY PLATFORM", PW / 2, 63, { align: "center" });

  doc.setFillColor(...C.accent);
  doc.rect(M + 30, 67, CW - 60, 1, "F");

  doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
  doc.text("Cyber Security Assessment Report", PW / 2, 82, { align: "center" });
  doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
  doc.text("Rapport d'Audit de Sécurité — Analyse Externe", PW / 2, 90, { align: "center" });

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

  if (isoCompliance && isoCompliance.totalControls > 0) {
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
    doc.text(`Conformité ISO/IEC 27001:2022 : ${isoCompliance.compliancePercentage}% — ${isoCompliance.passedCount} / ${isoCompliance.totalControls} contrôles`, PW / 2, 186, { align: "center" });
  }

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
  drawPageHeader();
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

  checkPage(40);
  doc.setFillColor(...C.bg);
  doc.roundedRect(M, y, CW, 38, 3, 3, "F");
  doc.setDrawColor(...C.border);
  doc.roundedRect(M, y, CW, 38, 3, 3, "S");

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

  checkPage(35);
  doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
  doc.text("Répartition des vulnérabilités par sévérité", M, y); y += 7;
  const totalIssues = issues.length || 1;
  const barGroups = [
    { label: "Critique", count: criticalCount, fg: C.critical, bg: C.criticalBg },
    { label: "Élevé",    count: highCount,     fg: C.high,     bg: C.highBg },
    { label: "Moyen",    count: mediumCount,   fg: C.medium,   bg: C.mediumBg },
    { label: "Faible",   count: lowCount,      fg: C.low,      bg: C.lowBg },
  ];
  const barMaxW = CW - 42;
  barGroups.forEach(bg_item => {
    checkPage(9);
    const barW = Math.max((bg_item.count / totalIssues) * barMaxW, bg_item.count > 0 ? 2 : 0);
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
      checkPage(50);
      const sev = severityColors(issue.severity);
      const impactInfo = getSecurityImpact(issue.toolSlug);

      doc.setFillColor(...C.bg);
      doc.setDrawColor(...C.border);
      doc.roundedRect(M, y, CW, 7, 1.5, 1.5, "F");
      doc.setFillColor(...sev.fg);
      doc.roundedRect(M, y, 3, 7, 1.5, 1.5, "F");
      doc.rect(M, y + 3, 3, 4, "F");

      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.muted);
      doc.text(`#${String(idx + 1).padStart(2, "0")}`, M + 6, y + 5);
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
      const titleTruncated = issue.title.length > 70 ? issue.title.substring(0, 67) + "..." : issue.title;
      doc.text(titleTruncated, M + 16, y + 5);
      drawBadge(sev.label, sev.fg, sev.bg, PW - M - 26, y + 5);
      y += 9;

      doc.setFillColor(240, 244, 248);
      doc.rect(M + 3, y, CW - 3, 6, "F");
      doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
      doc.text(`Outil : ${issue.tool}  |  Catégorie : ${issue.category.toUpperCase()}`, M + 5, y + 4);
      y += 8;

      // 1. Description
      checkPage(12);
      doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
      doc.text("Description", M + 3, y); y += 5;
      bodyText(impactInfo.description || issue.description, 7.5, C.body, 3);
      y += 2;

      // 2. Business Impact (Impact Métier)
      if (impactInfo.businessImpact.length > 0) {
        checkPage(18);
        doc.setFillColor(255, 247, 237);
        const bizH = impactInfo.businessImpact.length * 5.5 + 7;
        checkPage(bizH + 4);
        doc.roundedRect(M + 3, y, CW - 3, bizH, 1.5, 1.5, "F");
        doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.high);
        doc.text("Impact Métier", M + 6, y + 5);
        y += 8;
        impactInfo.businessImpact.forEach((item) => {
          doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(154, 52, 18);
          const bLines = doc.splitTextToSize(`• ${item}`, CW - 12);
          bLines.forEach((bl: string) => {
            doc.text(bl, M + 6, y);
            y += 4.5;
          });
        });
        y += 3;
      }

      // 3. Technical Impact (Modèle CIA)
      checkPage(30);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(M + 3, y, CW - 3, 26, 1.5, 1.5, "F");
      doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
      doc.text("Impact Technique — Modèle CIA", M + 6, y + 5);
      y += 8;

      const ciaItems = [
        { name: "Confidentialité", score: impactInfo.technicalImpact.confidentiality },
        { name: "Intégrité",       score: impactInfo.technicalImpact.integrity },
        { name: "Disponibilité",   score: impactInfo.technicalImpact.availability },
      ];

      ciaItems.forEach((cia) => {
        const info = getCiaCategoryInfo(cia.score);
        doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
        doc.text(cia.name, M + 6, y + 2.5);

        const badgeFg: [number, number, number] =
          info.level === "Faible" ? C.green :
          info.level === "Modéré" ? C.medium :
          info.level === "Élevé" ? C.high : C.red;
        const badgeBg: [number, number, number] =
          info.level === "Faible" ? C.greenBg :
          info.level === "Modéré" ? C.mediumBg :
          info.level === "Élevé" ? C.highBg : C.criticalBg;

        drawBadge(`Impact : ${info.level}`, badgeFg, badgeBg, M + 35, y + 2.5, 20, 4);

        const barX = M + 60;
        const barW = 75;
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(barX, y, barW, 3, 1, 1, "F");

        const fillW = (info.percentage / 100) * barW;
        doc.setFillColor(...badgeFg);
        if (fillW > 0) {
          doc.roundedRect(barX, y, fillW, 3, 1, 1, "F");
        }

        doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
        doc.text(`${info.percentage}%`, barX + barW + 3, y + 2.5);

        y += 5;
      });
      y += 4;

      // 4. OWASP Top 10
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

      // 5. CVE / CVSS Reference
      checkPage(12);
      if (issue.cve) {
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(M + 3, y, CW - 3, 16, 1.5, 1.5, "F");
        doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.red);
        doc.text("Référence CVE / CVSS", M + 6, y + 5);
        doc.setFont("helvetica", "normal"); doc.setTextColor(...C.ink);
        doc.text(`${issue.cve.cveId}`, M + 6, y + 10);
        drawBadge(`CVSS ${issue.cve.cvssScore}`, C.red, [254,226,226], M + 36, y + 10, 22, 5.5);
        drawBadge(issue.cve.severity, C.red, [254,226,226], M + 62, y + 10, 22, 5.5);
        doc.setFontSize(6); doc.setTextColor(...C.accent);
        doc.text(issue.cve.url, M + 6, y + 15);
        y += 20;
      } else {
        doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
        doc.text("Aucune référence CVE disponible pour cette vulnérabilité de configuration.", M + 3, y + 4);
        y += 9;
      }

      // 6. Recommandation Générale
      const recText = impactInfo.recommendation || issue.fix;
      if (recText) {
        checkPage(14);
        doc.setFillColor(239, 246, 255);
        const recLines = doc.splitTextToSize(recText, CW - 12);
        const recH = recLines.length * 4.5 + 8;
        checkPage(recH + 4);
        doc.roundedRect(M + 3, y, CW - 3, recH, 1.5, 1.5, "F");
        doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.accent);
        doc.text("Recommandation Générale", M + 6, y + 5);
        y += 8;
        doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(30, 64, 175);
        recLines.forEach((fl: string) => {
          doc.text(fl, M + 6, y);
          y += 4.5;
        });
        y += 3;
      }

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

    isoCompliance.controls.forEach((ctrl, ri) => {
      const rowH = 9;
      checkPage(rowH + 2);
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
  // HEADERS & FOOTERS ON ALL PAGES
  // ════════════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageHeader();
    drawPageFooter(p, totalPages);
  }

  doc.save(`Cybelis_Security_Report_${domain}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
