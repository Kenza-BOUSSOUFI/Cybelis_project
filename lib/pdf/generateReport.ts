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

  // ─── UTF-8 → LATIN-1 SAFE TEXT ───────────────────────────────────────────
  // jsPDF's built-in Helvetica uses Windows-1252/Latin-1 encoding internally.
  // Raw UTF-8 multi-byte sequences for French accented characters (é, è, à…)
  // will appear as squares or ? in the generated PDF without this mapping.
  const safeText = (s: string): string =>
    s
      .replace(/\u00e9/g, "\xe9") // é
      .replace(/\u00e8/g, "\xe8") // è
      .replace(/\u00ea/g, "\xea") // ê
      .replace(/\u00eb/g, "\xeb") // ë
      .replace(/\u00e0/g, "\xe0") // à
      .replace(/\u00e2/g, "\xe2") // â
      .replace(/\u00e4/g, "\xe4") // ä
      .replace(/\u00e7/g, "\xe7") // ç
      .replace(/\u00ee/g, "\xee") // î
      .replace(/\u00ef/g, "\xef") // ï
      .replace(/\u00f4/g, "\xf4") // ô
      .replace(/\u00f6/g, "\xf6") // ö
      .replace(/\u00f9/g, "\xf9") // ù
      .replace(/\u00fb/g, "\xfb") // û
      .replace(/\u00fc/g, "\xfc") // ü
      .replace(/\u00c9/g, "\xc9") // É
      .replace(/\u00c8/g, "\xc8") // È
      .replace(/\u00ca/g, "\xca") // Ê
      .replace(/\u00c0/g, "\xc0") // À
      .replace(/\u00c2/g, "\xc2") // Â
      .replace(/\u00c7/g, "\xc7") // Ç
      .replace(/\u00ce/g, "\xce") // Î
      .replace(/\u00d4/g, "\xd4") // Ô
      .replace(/\u00d9/g, "\xd9") // Ù
      .replace(/\u00db/g, "\xdb") // Û
      .replace(/\u00dc/g, "\xdc") // Ü
      .replace(/\u00e6/g, "\xe6") // æ
      .replace(/\u0153/g, "\x9c") // œ  (Windows-1252)
      .replace(/\u2019/g, "\x92") // ' right single quotation (Windows-1252)
      .replace(/\u2014/g, "\x97") // — em dash (Windows-1252)
      .replace(/\u2013/g, "\x96") // – en dash (Windows-1252)
      .replace(/\u00a9/g, "\xa9") // ©
      .replace(/\u00ae/g, "\xae") // ®
      .replace(/\u2122/g, "\x99"); // ™ (Windows-1252)

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
    doc.text(safeText(`Audit du ${scanDate.toLocaleDateString("fr-FR")}`), PW - M, 12.5, { align: "right" });
  };

  const drawPageFooter = (page: number, totalPages: number) => {
    doc.setDrawColor(...C.border);
    doc.line(M, PH - FOOTER_H, PW - M, PH - FOOTER_H);
    doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
    doc.text(safeText(`\xa9 ${new Date().getFullYear()} Cybelis \x97 Rapport Confidentiel`), M, PH - 5);
    doc.text(safeText(`G\xe9n\xe9r\xe9 le ${new Date().toLocaleDateString("fr-FR")} \xe0 ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`), PW / 2, PH - 5, { align: "center" });
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
    if (sev === "high")     return { fg: C.high,     bg: C.highBg,     label: "\xc9LEV\xc9" };
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
  doc.text(safeText("Rapport d'Audit de S\xe9curit\xe9 \x97 Analyse Externe"), PW / 2, 90, { align: "center" });

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
  doc.text(safeText(`G\xe9n\xe9r\xe9 par : Cybelis Security Platform`), M + 22, 129);

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
    { label: "\xc9LEV\xc9",    count: highCount,     fg: C.high,     bg: C.highBg     },
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
    doc.text(safeText(`Conformit\xe9 ISO/IEC 27001:2022 : ${isoCompliance.compliancePercentage}% \x97 ${isoCompliance.passedCount} / ${isoCompliance.totalControls} contr\xf4les`), PW / 2, 186, { align: "center" });
  }

  doc.setFillColor(15, 35, 80);
  doc.rect(0, PH - 22, PW, 22, "F");
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
  doc.text(safeText("DOCUMENT CONFIDENTIEL \x97 R\xe9serv\xe9 \xe0 usage interne ou client d\xe9sign\xe9"), PW / 2, PH - 12, { align: "center" });
  doc.text(safeText(`\xa9 ${new Date().getFullYear()} Cybelis \x97 Tous droits r\xe9serv\xe9s`), PW / 2, PH - 7, { align: "center" });

  doc.addPage();
  currentPage = 2;
  drawPageHeader();
  y = CONTENT_TOP + 4;

  doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
  doc.text(safeText("Table des Mati\xe8res"), M, y); y += 10;
  hRule();

  const tocItems = [
    { num: "01", title: safeText("R\xe9sum\xe9 Ex\xe9cutif"), page: 3 },
    { num: "02", title: safeText("D\xe9tail des Vuln\xe9rabilit\xe9s & R\xe9f\xe9rences OWASP / CVE"), page: 4 },
    { num: "03", title: safeText("Matrice de Conformit\xe9 ISO/IEC 27001:2022"), page: issues.length > 5 ? 6 : 5 },
    { num: "04", title: safeText("Conclusion & Priorit\xe9s de Rem\xe9diation"), page: issues.length > 8 ? 8 : 6 },
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

  newPage();
  sectionTitle(safeText("01 \x97 R\xe9sum\xe9 Ex\xe9cutif"));

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
  doc.text(safeText("R\xe9sultats de l'analyse de s\xe9curit\xe9"), statsX, y + 8);
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
  doc.text(`Domaine analysé : ${domain}`, statsX, y + 14);
  doc.text(`Date : ${scanDate.toLocaleDateString("fr-FR")} — ${scanDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`, statsX, y + 20);
  doc.text(safeText(`Total vuln\xe9rabilit\xe9s : ${issues.length}`), statsX, y + 26);
  if (isoCompliance) {
    doc.text(safeText(`Conformit\xe9 ISO 27001 : ${isoCompliance.compliancePercentage}% (${isoCompliance.passedCount}/${isoCompliance.totalControls})`), statsX, y + 32);
  }
  y += 44;

  checkPage(35);
  doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
  doc.text(safeText("R\xe9partition des vuln\xe9rabilit\xe9s par s\xe9v\xe9rit\xe9"), M, y); y += 7;
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

  sectionTitle(safeText("02 \x97 D\xe9tail des Vuln\xe9rabilit\xe9s"));

  if (issues.length === 0) {
    checkPage(16);
    doc.setFillColor(...C.greenBg);
    doc.roundedRect(M, y, CW, 12, 2, 2, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.green);
    doc.text(safeText("\u2713  Aucune vuln\xe9rabilit\xe9 d\xe9tect\xe9e lors de cette analyse."), M + 5, y + 8);
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
      doc.text(safeText(`Outil : ${issue.tool}  |  Cat\xe9gorie : ${issue.category.toUpperCase()}`), M + 5, y + 4);
      y += 8;

      checkPage(12);
      doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
      doc.text("Description", M + 3, y); y += 5;
      bodyText(safeText(impactInfo.description || issue.description), 7.5, C.body, 3);
      y += 2;

      if (impactInfo.businessImpact.length > 0) {
        checkPage(18);
        doc.setFillColor(255, 247, 237);
        const bizH = impactInfo.businessImpact.length * 5.5 + 7;
        checkPage(bizH + 4);
        doc.roundedRect(M + 3, y, CW - 3, bizH, 1.5, 1.5, "F");
        doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.high);
        doc.text(safeText("Impact M\xe9tier"), M + 6, y + 5);
        y += 8;
        impactInfo.businessImpact.forEach((item) => {
          doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(154, 52, 18);
          const bLines = doc.splitTextToSize(safeText(`\u2022 ${item}`), CW - 12);
          bLines.forEach((bl: string) => {
            doc.text(bl, M + 6, y);
            y += 4.5;
          });
        });
        y += 3;
      }

      checkPage(30);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(M + 3, y, CW - 3, 26, 1.5, 1.5, "F");
      doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
      doc.text(safeText("Impact Technique \x97 Mod\xe8le CIA"), M + 6, y + 5);
      y += 8;

      const ciaItems = [
        { name: safeText("Confidentialit\xe9"), score: impactInfo.technicalImpact.confidentiality },
        { name: safeText("Int\xe9grit\xe9"),       score: impactInfo.technicalImpact.integrity },
        { name: safeText("Disponibilit\xe9"),   score: impactInfo.technicalImpact.availability },
      ];

      ciaItems.forEach((cia) => {
        const info = getCiaCategoryInfo(cia.score);
        doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
        doc.text(cia.name, M + 6, y + 2.5);

        const badgeFg: [number, number, number] =
          info.level === "Faible" ? C.green :
          info.level === safeText("Mod\xe9r\xe9") ? C.medium :
          info.level === safeText("\xc9lev\xe9") ? C.high : C.red;
        const badgeBg: [number, number, number] =
          info.level === "Faible" ? C.greenBg :
          info.level === safeText("Mod\xe9r\xe9") ? C.mediumBg :
          info.level === safeText("\xc9lev\xe9") ? C.highBg : C.criticalBg;

        drawBadge(safeText(`Impact : ${info.level}`), badgeFg, badgeBg, M + 35, y + 2.5, 20, 4);

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

      if (issue.owasp && issue.owasp.length > 0) {
        checkPage(18);
        doc.setFillColor(...C.purpleBg);
        const owaspBlockH = issue.owasp.length * 13 + 6;
        checkPage(owaspBlockH + 4);
        doc.roundedRect(M + 3, y, CW - 3, owaspBlockH, 1.5, 1.5, "F");
        doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.purple);
        doc.text(safeText("OWASP Top 10 2021"), M + 6, y + 5);
        y += 7;
        issue.owasp.forEach(o => {
          doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.purple);
          doc.text(`[${o.code}]`, M + 6, y);
          doc.setFont("helvetica", "normal"); doc.setTextColor(...C.ink);
          doc.text(safeText(o.title), M + 24, y);
          y += 6;
          const owLines = doc.splitTextToSize(safeText(o.description), CW - 12);
          doc.setFontSize(6.5); doc.setTextColor(...C.body);
          owLines.slice(0, 2).forEach((l: string) => { doc.text(l, M + 6, y); y += 4.5; });
        });
        y += 3;
      }

      checkPage(12);
      if (issue.cve) {
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(M + 3, y, CW - 3, 16, 1.5, 1.5, "F");
        doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.red);
        doc.text(safeText("R\xe9f\xe9rence CVE / CVSS"), M + 6, y + 5);
        doc.setFont("helvetica", "normal"); doc.setTextColor(...C.ink);
        doc.text(`${issue.cve.cveId}`, M + 6, y + 10);
        drawBadge(`CVSS ${issue.cve.cvssScore}`, C.red, [254,226,226], M + 36, y + 10, 22, 5.5);
        drawBadge(issue.cve.severity, C.red, [254,226,226], M + 62, y + 10, 22, 5.5);
        doc.setFontSize(6); doc.setTextColor(...C.accent);
        doc.text(issue.cve.url, M + 6, y + 15);
        y += 20;
      } else {
        doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
        doc.text(safeText("Aucune r\xe9f\xe9rence CVE disponible pour cette vuln\xe9rabilit\xe9 de configuration."), M + 3, y + 4);
        y += 9;
      }

      const recText = impactInfo.recommendation || issue.fix;
      if (recText) {
        checkPage(14);
        doc.setFillColor(239, 246, 255);
        const recLines = doc.splitTextToSize(safeText(recText), CW - 12);
        const recH = recLines.length * 4.5 + 8;
        checkPage(recH + 4);
        doc.roundedRect(M + 3, y, CW - 3, recH, 1.5, 1.5, "F");
        doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.accent);
        doc.text(safeText("Recommandation G\xe9n\xe9rale"), M + 6, y + 5);
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

  if (isoCompliance && isoCompliance.totalControls > 0) {
    newPage();
    sectionTitle(safeText("03 \x97 Matrice de Conformit\xe9 ISO/IEC 27001:2022"));

    checkPage(12);
    const isoBarW = CW;
    const isoBarFill = (isoCompliance.passedCount / isoCompliance.totalControls) * isoBarW;
    doc.setFillColor(...C.border);
    doc.roundedRect(M, y, isoBarW, 5, 1, 1, "F");
    doc.setFillColor(...C.green);
    doc.roundedRect(M, y, isoBarFill, 5, 1, 1, "F");
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
    doc.text(safeText(`${isoCompliance.compliancePercentage}% de conformit\xe9 \x97 ${isoCompliance.passedCount} conformes / ${isoCompliance.totalControls} contr\xf4les analys\xe9s`), M, y + 10);
    y += 14;

    checkPage(12);
    doc.setFillColor(...C.navy);
    doc.rect(M, y, CW, 7, "F");
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
    const colCode = M + 2, colStatus = M + 22, colName = M + 42, colRec = M + 100;
    doc.text("Code", colCode, y + 5);
    doc.text("Statut", colStatus, y + 5);
    doc.text(safeText("Contr\xf4le"), colName, y + 5);
    doc.text(safeText("Recommandation"), colRec, y + 5);
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
      const nameStr = safeText(ctrl.name.length > 32 ? ctrl.name.substring(0, 29) + "..." : ctrl.name);
      doc.text(nameStr, colName, y + 6);
      const recStr = safeText((ctrl.status === "NON_CONFORME" && ctrl.recommendation)
        ? (ctrl.recommendation.length > 38 ? ctrl.recommendation.substring(0, 35) + "..." : ctrl.recommendation)
        : "\x97");
      doc.setTextColor(...C.muted);
      doc.text(recStr, colRec, y + 6);
      y += rowH;
    });
    y += 6;
    hRule();
  }

  checkPage(60);
  sectionTitle(safeText("04 \x97 Conclusion & Priorit\xe9s de Rem\xe9diation"));

  const overallRisk = criticalCount > 0 ? { label: "CRITIQUE", color: C.critical, bg: C.criticalBg }
    : highCount > 0 ? { label: safeText("\xc9LEV\xc9"), color: C.high, bg: C.highBg }
    : mediumCount > 0 ? { label: "MOYEN", color: C.medium, bg: C.mediumBg }
    : { label: "FAIBLE", color: C.low, bg: C.lowBg };

  checkPage(20);
  doc.setFillColor(...overallRisk.bg);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...overallRisk.color);
  doc.text(safeText(`Niveau de Risque Global : ${overallRisk.label}`), M + 5, y + 6);
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.body);
  doc.text(safeText(`Score de s\xe9curit\xe9 : ${score}/100 (Grade ${grade})  |  ${issues.length} vuln\xe9rabilit\xe9(s) d\xe9tect\xe9e(s)`), M + 5, y + 11);
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
  doc.text(safeText("Actions Prioritaires de Rem\xe9diation"), M, y); y += 7;

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
  doc.text(safeText("Ce rapport a \xe9t\xe9 g\xe9n\xe9r\xe9 automatiquement par la plateforme Cybelis \xe0 partir de donn\xe9es r\xe9elles d'analyse externe passive."), M, y);
  y += 5;
  doc.text(safeText("Il ne refl\xe8te que les donn\xe9es disponibles publiquement au moment du scan et ne constitue pas un audit de s\xe9curit\xe9 exhaustif."), M, y);

  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageHeader();
    drawPageFooter(p, totalPages);
  }

  doc.save(`Cybelis_Security_Report_${domain}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
