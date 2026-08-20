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

export async function generateClarveonPDF(
  scan: PdfScanData,
  issues: PdfIssue[],
  isoCompliance: Iso27001Report | null
): Promise<void> {
  const { jsPDF } = await import("jspdf");

  // ─── LOAD LOGO WITH EXACT ASPECT RATIO PRESERVATION ────────────────────────
  interface LoadedLogo {
    data: string;
    aspectRatio: number; // width / height
  }

  const loadLogoBase64 = (): Promise<LoadedLogo | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = "/logo.png";
      img.onload = () => {
        const scale = 2; // High resolution scale factor
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve({
            data: canvas.toDataURL("image/png"),
            aspectRatio: img.width / img.height
          });
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
    });
  };

  const logoObj = await loadLogoBase64();

  // ─── UTF-8 → LATIN-1 SAFE TEXT ENCODING FOR HELVETICA ──────────────────────
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
      .replace(/\u0153/g, "\x9c") // œ
      .replace(/\u2019/g, "\x92") // '
      .replace(/\u2014/g, "\x97") // —
      .replace(/\u2013/g, "\x96") // –
      .replace(/\u00a9/g, "\xa9") // ©
      .replace(/\u00ae/g, "\xae") // ®
      .replace(/\u2122/g, "\x99"); // ™

  // ─── DOCUMENT DIMENSIONS & PAGE BOUNDS ────────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210, PH = 297;
  const M = 15; // 15mm margin
  const CW = PW - M * 2;
  const HEADER_H = 14;
  const FOOTER_H = 10;
  const CONTENT_TOP = HEADER_H + 6;
  const CONTENT_BOTTOM = PH - FOOTER_H - 4;

  // ─── ENTERPRISE LIGHT MODE COLOR PALETTE ──────────────────────────────────
  const C = {
    // Structure & Neutral
    navy: [15, 23, 42] as [number, number, number], // #0f172a
    navyMid: [30, 41, 59] as [number, number, number], // #1e293b
    slate: [71, 85, 105] as [number, number, number], // #475569
    muted: [100, 116, 139] as [number, number, number], // #64748b
    border: [226, 232, 240] as [number, number, number], // #e2e8f0
    borderDark: [203, 213, 225] as [number, number, number], // #cbd5e1
    borderLight: [241, 245, 249] as [number, number, number], // #f1f5f9
    bg: [248, 250, 252] as [number, number, number], // #f8fafc
    bgMid: [241, 245, 249] as [number, number, number], // #f1f5f9
    white: [255, 255, 255] as [number, number, number],

    // Primary Brand Accent
    accent: [37, 99, 235] as [number, number, number], // #2563eb
    accentBg: [239, 246, 255] as [number, number, number], // #eff6ff
    accentPill: [219, 234, 254] as [number, number, number], // #dbeafe
    accentText: [29, 78, 216] as [number, number, number], // #1d4ed8

    // Severity Tones (Refined Navy / Blue / Slate Gray Palette — Zero Red, Green, or Yellow)
    critical: [15, 23, 42] as [number, number, number], // #0f172a Deep Navy
    criticalBg: [241, 245, 249] as [number, number, number], // #f1f5f9 Slate-100
    criticalBd: [203, 213, 225] as [number, number, number], // #cbd5e1 Slate-300

    high: [29, 78, 216] as [number, number, number], // #1d4ed8 Dark Blue
    highBg: [239, 246, 255] as [number, number, number], // #eff6ff Blue-50
    highBd: [191, 219, 254] as [number, number, number], // #bfdbfe Blue-200

    medium: [37, 99, 235] as [number, number, number], // #2563eb Royal Blue
    mediumBg: [239, 246, 255] as [number, number, number], // #eff6ff Blue-50
    mediumBd: [191, 219, 254] as [number, number, number], // #bfdbfe Blue-200

    low: [71, 85, 105] as [number, number, number], // #475569 Slate Gray
    lowBg: [248, 250, 252] as [number, number, number], // #f8fafc Slate-50
    lowBd: [226, 232, 240] as [number, number, number], // #e2e8f0 Slate-200

    green: [29, 78, 216] as [number, number, number], // #1d4ed8 Blue
    greenBg: [239, 246, 255] as [number, number, number],
    greenBd: [191, 219, 254] as [number, number, number],

    purple: [30, 41, 59] as [number, number, number], // #1e293b Dark Slate
    purpleBg: [241, 245, 249] as [number, number, number],
    purpleBd: [203, 213, 225] as [number, number, number],
  };

  // ─── DERIVED SCAN DATA ───────────────────────────────────────────────────
  const domain = scan.website.domain;
  const scanDate = new Date(scan.createdAt);
  const score = scan.securityScore?.score ?? 0;
  const grade = scan.securityScore?.grade ?? (score >= 90 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : score >= 30 ? "D" : "F");
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const highCount = issues.filter(i => i.severity === "high").length;
  const mediumCount = issues.filter(i => i.severity === "medium").length;
  const lowCount = issues.filter(i => i.severity === "low").length;
  const scoreColor: [number, number, number] = C.navy;
  const scoreLevel = score >= 80 ? "Bon" : score >= 60 ? "Modéré" : "Faible";

  // ─── LAYOUT & PAGINATION STATE ───────────────────────────────────────────
  let y = CONTENT_TOP;
  let currentPage = 1;

  // ─── RECURRING HEADER & FOOTER (INTERNAL PAGES) ──────────────────────────
  const drawPageHeader = () => {
    doc.setFillColor(...C.white);
    doc.rect(0, 0, PW, HEADER_H, "F");
    doc.setDrawColor(...C.border);
    doc.line(0, HEADER_H, PW, HEADER_H);

    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    doc.text("CLARVEON", M, 6.5);
    doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
    doc.text("Cyber Security Assessment", M, 10.5);

    doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
    doc.text(domain, PW - M, 6.5, { align: "right" });
    doc.text(safeText(`Audit du ${scanDate.toLocaleDateString("fr-FR")}`), PW - M, 10.5, { align: "right" });
  };

  const drawPageFooter = (page: number, totalPages: number) => {
    doc.setFillColor(...C.bg);
    doc.rect(0, PH - FOOTER_H, PW, FOOTER_H, "F");
    doc.setDrawColor(...C.border);
    doc.line(0, PH - FOOTER_H, PW, PH - FOOTER_H);

    doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
    doc.text(safeText(`\xa9 ${new Date().getFullYear()} Clarveon \x97 Confidential Assessment Report`), M, PH - 4);
    doc.text(safeText(`G\xe9n\xe9r\xe9 le ${new Date().toLocaleDateString("fr-FR")} \xe0 ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`), PW / 2, PH - 4, { align: "center" });
    doc.text(`Page ${page} / ${totalPages}`, PW - M, PH - 4, { align: "right" });
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

  // ─── TYPOGRAPHY & COMPONENT HELPERS ──────────────────────────────────────
  const sectionTitle = (title: string) => {
    checkPage(16);
    doc.setFillColor(...C.bgMid);
    doc.rect(M, y, CW, 8, "F");
    doc.setFillColor(...C.navy);
    doc.rect(M, y, 3, 8, "F");

    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    doc.text(title, M + 7, y + 5.5);
    y += 13;
  };

  const bodyText = (text: string, size = 8, color: [number, number, number] = C.slate, indent = 0) => {
    doc.setFontSize(size); doc.setFont("helvetica", "normal"); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CW - indent);
    lines.forEach((l: string) => { checkPage(5); doc.text(l, M + indent, y); y += 4.5; });
  };

  const severityColors = (sev: string): { fg: [number, number, number], bg: [number, number, number], bd: [number, number, number], label: string } => {
    if (sev === "critical") return { fg: C.critical, bg: C.criticalBg, bd: C.criticalBd, label: "CRITIQUE" };
    if (sev === "high") return { fg: C.high, bg: C.highBg, bd: C.highBd, label: "\xc9LEV\xc9" };
    if (sev === "medium") return { fg: C.medium, bg: C.mediumBg, bd: C.mediumBd, label: "MOYEN" };
    return { fg: C.low, bg: C.lowBg, bd: C.lowBd, label: "FAIBLE" };
  };

  const drawBadge = (label: string, fg: [number, number, number], bg: [number, number, number], x: number, yPos: number, w = 22, h = 5.5) => {
    doc.setFillColor(...bg);
    doc.roundedRect(x, yPos - 4, w, h, 1.2, 1.2, "F");
    doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...fg);
    doc.text(label, x + w / 2, yPos, { align: "center" });
  };

  const hRule = () => {
    checkPage(5);
    doc.setDrawColor(...C.border);
    doc.line(M, y, PW - M, y);
    y += 6;
  };

  // ════════════════════════════════════════════════════════════════════════════
  // ─── COVER PAGE — PREMIUM ENTERPRISE SAAS DESIGN ───────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  // Pure White Background
  doc.setFillColor(...C.white);
  doc.rect(0, 0, PW, PH, "F");

  // Top Accent Gradient Strip (3mm high blue accent bar)
  doc.setFillColor(37, 99, 235); // #2563eb
  doc.rect(0, 0, PW, 3.5, "F");

  // Subtle Light Blue Waves Accent on Top-Right Background
  doc.setDrawColor(224, 242, 254);
  doc.setLineWidth(0.5);
  doc.lines([[30, 10], [50, -5], [70, 15]], PW - 80, 5, [1, 1], "S");
  doc.lines([[40, 15], [60, -2], [80, 20]], PW - 90, 8, [1, 1], "S");

  // Fine Outer Frame
  doc.setDrawColor(...C.borderDark);
  doc.setLineWidth(0.3);
  doc.rect(4, 4, PW - 8, PH - 8, "S");

  // ── 1. TOP HEADER (LOGO LEFT, CONFIDENTIAL BADGE RIGHT) ──
  const headerY = 14;

  // Real Clarveon Logo
  if (logoObj && logoObj.data) {
    const logoW = 48;
    const logoH = logoW / logoObj.aspectRatio;
    doc.addImage(logoObj.data, "PNG", M, headerY, logoW, logoH);
  } else {
    doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    doc.text("CLARVEON", M, headerY + 10);
  }

  // Confidential Badge (Top Right)
  const confW = 32, confH = 6.5;
  const confX = PW - M - confW;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(219, 234, 254);
  doc.roundedRect(confX, headerY + 2, confW, confH, 3, 3, "FD");

  // Lock vector icon inside badge
  const lockX = confX + 4.5;
  const lockY = headerY + 5.2;
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.4);
  doc.roundedRect(lockX - 1.2, lockY - 0.5, 2.4, 2.2, 0.4, 0.4, "S");
  doc.circle(lockX, lockY - 1.2, 0.9, "S");

  doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(29, 78, 216);
  doc.text(safeText("CONFIDENTIEL"), confX + 18, headerY + 6.3, { align: "center" });

  // Header Divider Line
  let cy = headerY + 22;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(M, cy, PW - M, cy);
  cy += 14;

  // ── 2. HERO TITLE SECTION WITH LEFT BRAND ACCENT BAR ──
  const titleCardX = M;
  const titleCardW = CW;
  const titleCardH = 34;

  // Title Box Container Background
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...C.border);
  doc.roundedRect(titleCardX, cy, titleCardW, titleCardH, 3, 3, "FD");

  // Solid Blue Left Accent Strip
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(titleCardX, cy, 3.5, titleCardH, 1.5, 1.5, "F");

  // Category Tag Pill Inside Title Box
  const tagX = titleCardX + 10;
  const tagY = cy + 6;
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(tagX, tagY, 66, 6, 2, 2, "F");
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(29, 78, 216);
  doc.text(safeText("RAPPORT D'AUDIT & D'\xc9VALUATION DE S\xc9CURIT\xc9"), tagX + 33, tagY + 4.2, { align: "center" });

  // Main Target Domain Title
  doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
  doc.text(domain, tagX, cy + 20);

  // Subtitle / Time
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
  const timeStr = `${scanDate.toLocaleDateString("fr-FR")} à ${scanDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  doc.text(safeText(`Posture de sécurité passive HTTPS, SSL/TLS, DNS & Headers • ${timeStr}`), tagX, cy + 28);

  cy += titleCardH + 14;

  // ── 3. METRICS SHOWCASE SECTION (2 COLUMNS) ──
  const colW = (CW - 10) / 2; // 85mm each
  const metricsH = 48;

  // LEFT COLUMN: HERO SCORE CARD
  const leftColX = M;
  doc.setFillColor(...C.white);
  doc.setDrawColor(...C.border);
  doc.roundedRect(leftColX, cy, colW, metricsH, 3.5, 3.5, "FD");

  // Ring Gauge Center
  const ringX = leftColX + 24;
  const ringY = cy + 24;
  const ringR = 15;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(3.5);
  doc.circle(ringX, ringY, ringR, "S");

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(3.5);
  doc.circle(ringX, ringY, ringR, "S");

  doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
  doc.text(`${score}`, ringX, ringY + 2.5, { align: "center" });
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
  doc.text("/100", ringX, ringY + 8, { align: "center" });

  // Score Info Right of Ring
  const sInfoX = leftColX + 44;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
  doc.text(safeText("Score Global"), sInfoX, cy + 13);

  // Grade Badge Pill
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(sInfoX, cy + 17, 36, 7, 2, 2, "F");
  doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(29, 78, 216);
  doc.text(safeText(`GRADE ${grade}`), sInfoX + 18, cy + 21.8, { align: "center" });

  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
  doc.text("Niveau :", sInfoX, cy + 34);
  doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
  doc.text(safeText(scoreLevel), sInfoX + 16, cy + 34);

  // RIGHT COLUMN: 4 SEVERITY CARDS (WITH COLORED STRIPS)
  const rightColX = M + colW + 10;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...C.border);
  doc.roundedRect(rightColX, cy, colW, metricsH, 3.5, 3.5, "FD");

  doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
  doc.text(safeText("Vulnérabilités Détectées"), rightColX + 8, cy + 10);

  const sevGrid = [
    { label: "Critique", count: criticalCount, fg: C.critical, bg: C.criticalBg, bd: C.criticalBd },
    { label: safeText("Élevé"), count: highCount, fg: C.high, bg: C.highBg, bd: C.highBd },
    { label: "Moyen", count: mediumCount, fg: C.medium, bg: C.mediumBg, bd: C.mediumBd },
    { label: "Faible", count: lowCount, fg: C.low, bg: C.lowBg, bd: C.lowBd },
  ];

  const itemW = (colW - 20) / 2;
  const itemH = 13;

  sevGrid.forEach((item, idx) => {
    const ix = rightColX + 8 + (idx % 2) * (itemW + 4);
    const iy = cy + 15 + Math.floor(idx / 2) * (itemH + 3);

    doc.setFillColor(...C.white);
    doc.setDrawColor(...item.bd);
    doc.roundedRect(ix, iy, itemW, itemH, 2, 2, "FD");

    // Left Colored Accent Strip
    doc.setFillColor(...item.fg);
    doc.roundedRect(ix, iy, 2, itemH, 1, 1, "F");

    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...item.fg);
    doc.text(`${item.count}`, ix + 6, iy + 9);

    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    doc.text(item.label, ix + 16, iy + 8.5);
  });

  cy += metricsH + 14;

  // Divider Line
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(M, cy, PW - M, cy);
  cy += 12;

  // ── 4. INFORMATIONS D'AUDIT (ENTERPRISE CARD TABLE) ──
  const infoCardW = CW;
  const infoCardH = 48;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...C.border);
  doc.roundedRect(M, cy, infoCardW, infoCardH, 3.5, 3.5, "FD");

  doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
  doc.text(safeText("Spécifications Générales de l'Audit"), M + 8, cy + 10);

  const infoRows = [
    { key: "Cible d'analyse", val: domain },
    { key: "Date de l'évaluation", val: timeStr },
    { key: "Périmètre technique", val: "Analyse passive HTTPS, certificats SSL/TLS, DNS & Headers" },
    { key: "Référentiel ISO 27001", val: isoCompliance ? `${isoCompliance.compliancePercentage}% de contrôles satisfaits (${isoCompliance.passedCount}/${isoCompliance.totalControls})` : "50% de contrôles satisfaits (2/4)" },
  ];

  const rowH = 8.5;
  infoRows.forEach((row, ri) => {
    const ry = cy + 15 + ri * rowH;

    doc.setDrawColor(241, 245, 249);
    doc.line(M + 6, ry, M + infoCardW - 6, ry);

    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    doc.text(safeText(row.key), M + 8, ry + 6);

    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
    doc.text(safeText(row.val), M + 54, ry + 6);
  });

  // ── 5. FULL-WIDTH DARK NAVY FOOTER BANNER ──
  const footerY = PH - 20;
  doc.setFillColor(11, 19, 41); // Deep Navy #0b1329
  doc.rect(0, footerY, PW, 20, "F");

  // Left Logo & Platform Title
  if (logoObj && logoObj.data) {
    const fLogoW = 30;
    const fLogoH = fLogoW / logoObj.aspectRatio;
    doc.addImage(logoObj.data, "PNG", M, footerY + 4.5, fLogoW, fLogoH);
  } else {
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
    doc.text("CLARVEON", M, footerY + 10);
  }

  // Right Confidential Copyright
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
  doc.text(safeText(`© ${new Date().getFullYear()} Clarveon — Document Confidentiel`), PW - M, footerY + 11, { align: "right" });


  // ════════════════════════════════════════════════════════════════════════════
  // ─── PAGE 2: TABLE DES MATIÈRES ─────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  doc.addPage();
  currentPage = 2;
  drawPageHeader();
  y = CONTENT_TOP + 4;

  doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
  doc.text(safeText("Table des Mati\xe8res"), M, y); y += 4;
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
  doc.text(safeText(`Audit d'infrastructure — ${domain} — ${scanDate.toLocaleDateString("fr-FR")}`), M, y + 4); y += 10;
  hRule();

  const tocItems = [
    { num: "01", title: safeText("R\xe9sum\xe9 Ex\xe9cutif"), page: 3 },
    { num: "02", title: safeText("D\xe9tail des Vuln\xe9rabilit\xe9s & R\xe9f\xe9rences OWASP / CVE"), page: 4 },
    { num: "03", title: safeText("Matrice de Conformit\xe9 ISO/IEC 27001:2022"), page: issues.length > 5 ? 6 : 5 },
    { num: "04", title: safeText("Conclusion & Priorit\xe9s de Rem\xe9diation"), page: issues.length > 8 ? 8 : 6 },
  ];

  tocItems.forEach((item, i) => {
    checkPage(12);
    if (i % 2 === 0) {
      doc.setFillColor(...C.bg);
      doc.rect(M, y - 5, CW, 9, "F");
    }
    doc.setFillColor(...C.navy);
    doc.roundedRect(M, y - 4, 10, 7, 1, 1, "F");
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
    doc.text(item.num, M + 5, y, { align: "center" });

    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.navy);
    doc.text(item.title, M + 14, y);

    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.accent);
    doc.text(`p. ${item.page}`, PW - M, y, { align: "right" });

    doc.setDrawColor(...C.border);
    const titleW = doc.getTextWidth(item.title);
    const pageW = doc.getTextWidth(`p. ${item.page}`);
    const leaderStart = M + 14 + titleW + 4;
    const leaderEnd = PW - M - pageW - 6;
    for (let lx = leaderStart; lx < leaderEnd; lx += 3.5) {
      doc.setFillColor(...C.borderDark);
      doc.circle(lx, y - 1.5, 0.35, "F");
    }
    y += 12;
  });

  // ════════════════════════════════════════════════════════════════════════════
  // ─── PAGE 3+: RÉSUMÉ EXÉCUTIF ───────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  newPage();
  sectionTitle(safeText("01 \x97 R\xe9sum\xe9 Ex\xe9cutif"));

  checkPage(42);
  doc.setFillColor(...C.bg);
  doc.setDrawColor(...C.border);
  doc.roundedRect(M, y, CW, 38, 2, 2, "FD");

  const sc = { x: M + 20, y: y + 19 };
  doc.setFillColor(...scoreColor);
  doc.circle(sc.x, sc.y, 13, "F");
  doc.setFillColor(...C.white);
  doc.circle(sc.x, sc.y, 10.5, "F");
  doc.setFontSize(15); doc.setFont("helvetica", "bold"); doc.setTextColor(...scoreColor);
  doc.text(`${score}`, sc.x, sc.y + 2, { align: "center" });
  doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
  doc.text("/100", sc.x, sc.y + 6.5, { align: "center" });
  doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
  doc.text(`Grade ${grade}`, sc.x, sc.y + 12, { align: "center" });

  const statsX = M + 42;
  const statGap = (CW - 42) / 4;
  const statItems = [
    { label: "Domaine", value: domain },
    { label: "Date scan", value: scanDate.toLocaleDateString("fr-FR") },
    { label: "Vulnérabilités", value: `${issues.length} détectée(s)` },
    { label: "ISO 27001", value: isoCompliance ? `${isoCompliance.compliancePercentage}%` : "N/A" },
  ];
  statItems.forEach((s, i) => {
    doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.muted);
    doc.text(s.label.toUpperCase(), statsX + i * statGap, y + 10);
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    const vl = doc.splitTextToSize(s.value, statGap - 2);
    vl.forEach((l: string, li: number) => doc.text(l, statsX + i * statGap, y + 16 + li * 4.5));
  });
  y += 44;

  checkPage(38);
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
  doc.text(safeText("R\xe9partition des vuln\xe9rabilit\xe9s par niveau de s\xe9v\xe9rit\xe9"), M, y); y += 6;

  const totalIssues = issues.length || 1;
  const barGroups = [
    { label: "Critique", count: criticalCount, fg: C.critical, bg: C.criticalBg },
    { label: safeText("\xc9LEV\xc9"), count: highCount, fg: C.high, bg: C.highBg },
    { label: "Moyen", count: mediumCount, fg: C.medium, bg: C.mediumBg },
    { label: "Faible", count: lowCount, fg: C.low, bg: C.lowBg },
  ];
  const barMaxW = CW - 48;

  barGroups.forEach(bg_item => {
    checkPage(8.5);
    const barW = Math.max((bg_item.count / totalIssues) * barMaxW, bg_item.count > 0 ? 3 : 0);

    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    doc.text(bg_item.label, M, y + 0.5);

    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...bg_item.fg);
    doc.text(`${bg_item.count}`, M + 24, y + 0.5);

    doc.setFillColor(...C.bgMid);
    doc.roundedRect(M + 30, y - 3, barMaxW, 5, 1, 1, "F");

    doc.setFillColor(...bg_item.fg);
    if (barW > 0) doc.roundedRect(M + 30, y - 3, barW, 5, 1, 1, "F");

    y += 8.5;
  });

  y += 4;
  hRule();

  // ════════════════════════════════════════════════════════════════════════════
  // ─── PAGE 4+: VULNERABILITIES DETAIL ────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  sectionTitle(safeText("02 \x97 D\xe9tail des Vuln\xe9rabilit\xe9s"));

  if (issues.length === 0) {
    checkPage(14);
    doc.setFillColor(...C.greenBg);
    doc.setDrawColor(...C.greenBd);
    doc.roundedRect(M, y, CW, 11, 1.5, 1.5, "FD");
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.green);
    doc.text(safeText("\u2713  Aucune vuln\xe9rabilit\xe9 d\xe9tect\xe9e lors de cet audit."), M + 5, y + 7);
    y += 16;
  } else {
    issues.forEach((issue, idx) => {
      checkPage(50);
      const sev = severityColors(issue.severity);
      const impactInfo = getSecurityImpact(issue.toolSlug);

      doc.setFillColor(...sev.bg);
      doc.setDrawColor(...sev.bd);
      doc.roundedRect(M, y, CW, 7.5, 1.5, 1.5, "FD");
      doc.setFillColor(...sev.fg);
      doc.roundedRect(M, y, 3, 7.5, 1.5, 0, "F");
      doc.rect(M + 1.5, y, 1.5, 7.5, "F");

      doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.muted);
      doc.text(`#${String(idx + 1).padStart(2, "0")}`, M + 6, y + 5);
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
      const titleTruncated = issue.title.length > 70 ? issue.title.substring(0, 67) + "..." : issue.title;
      doc.text(safeText(titleTruncated), M + 16, y + 5);
      drawBadge(sev.label, sev.fg, sev.bg, PW - M - 24, y + 5);
      y += 9.5;

      doc.setFillColor(...C.bg);
      doc.rect(M, y, CW, 5, "F");
      doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
      doc.text(safeText(`Outil : ${issue.tool}  |  Cat\xe9gorie : ${issue.category.toUpperCase()}`), M + 4, y + 3.5);
      y += 7;

      checkPage(12);
      doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
      doc.text("Description", M, y); y += 4.5;
      bodyText(safeText(impactInfo.description || issue.description), 7.5, C.slate, 0);
      y += 2;

      if (impactInfo.businessImpact.length > 0) {
        const bizH = impactInfo.businessImpact.length * 5 + 8;
        checkPage(bizH + 3);
        doc.setFillColor(...C.highBg);
        doc.setDrawColor(...C.highBd);
        doc.roundedRect(M, y, CW, bizH, 1.5, 1.5, "FD");
        doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.high);
        doc.text(safeText("Impact M\xe9tier"), M + 4, y + 5.5);
        y += 8;
        impactInfo.businessImpact.forEach((item) => {
          doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.high);
          const bLines = doc.splitTextToSize(safeText(`- ${item}`), CW - 10);
          bLines.forEach((bl: string) => {
            doc.text(bl, M + 4, y);
            y += 4;
          });
        });
        y += 3;
      }

      checkPage(30);
      doc.setFillColor(...C.bg);
      doc.setDrawColor(...C.border);
      doc.roundedRect(M, y, CW, 25, 1.5, 1.5, "FD");
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
      doc.text(safeText("Impact Technique \x97 Mod\xe8le CIA"), M + 4, y + 5.5);
      y += 8;

      const ciaItems = [
        { name: safeText("Confidentialit\xe9"), score: impactInfo.technicalImpact.confidentiality },
        { name: safeText("Int\xe9grit\xe9"), score: impactInfo.technicalImpact.integrity },
        { name: safeText("Disponibilit\xe9"), score: impactInfo.technicalImpact.availability },
      ];

      ciaItems.forEach((cia) => {
        const info = getCiaCategoryInfo(cia.score);
        const badgeFg: [number, number, number] =
          info.level === "Faible" ? C.green :
            info.level === safeText("Mod\xe9r\xe9") ? C.high : C.critical;
        const badgeBg: [number, number, number] =
          info.level === "Faible" ? C.greenBg :
            info.level === safeText("Mod\xe9r\xe9") ? C.highBg : C.criticalBg;

        doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
        doc.text(cia.name, M + 4, y + 2.5);
        drawBadge(safeText(`${info.level}`), badgeFg, badgeBg, M + 36, y + 2.5, 18, 4.5);

        const barX = M + 60;
        const barW = 80;
        doc.setFillColor(...C.bgMid);
        doc.roundedRect(barX, y, barW, 3, 1, 1, "F");
        const fillW = (info.percentage / 100) * barW;
        doc.setFillColor(...badgeFg);
        if (fillW > 0) doc.roundedRect(barX, y, fillW, 3, 1, 1, "F");
        doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.muted);
        doc.text(`${info.percentage}%`, barX + barW + 3, y + 2.5);

        y += 5;
      });
      y += 3;

      if (issue.owasp && issue.owasp.length > 0) {
        const owaspBlockH = issue.owasp.length * 12 + 7;
        checkPage(owaspBlockH + 3);
        doc.setFillColor(...C.purpleBg);
        doc.setDrawColor(...C.purpleBd);
        doc.roundedRect(M, y, CW, owaspBlockH, 1.5, 1.5, "FD");
        doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.purple);
        doc.text(safeText("OWASP Top 10 2021"), M + 4, y + 5.5);
        y += 7;
        issue.owasp.forEach(o => {
          doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.purple);
          doc.text(`[${o.code}]`, M + 4, y);
          doc.setFont("helvetica", "normal"); doc.setTextColor(...C.navy);
          doc.text(safeText(o.title), M + 22, y);
          y += 5;
          const owLines = doc.splitTextToSize(safeText(o.description), CW - 10);
          doc.setFontSize(6); doc.setTextColor(...C.slate);
          owLines.slice(0, 2).forEach((l: string) => { doc.text(l, M + 4, y); y += 4; });
        });
        y += 3;
      }

      checkPage(14);
      if (issue.cve) {
        doc.setFillColor(...C.criticalBg);
        doc.setDrawColor(...C.criticalBd);
        doc.roundedRect(M, y, CW, 15, 1.5, 1.5, "FD");
        doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.critical);
        doc.text(safeText("R\xe9f\xe9rence CVE / CVSS"), M + 4, y + 5.5);
        doc.setFont("helvetica", "normal"); doc.setTextColor(...C.navy);
        doc.text(`${issue.cve.cveId}`, M + 4, y + 10.5);
        drawBadge(`CVSS ${issue.cve.cvssScore}`, C.critical, C.criticalBg, M + 36, y + 10.5, 20, 5);
        drawBadge(issue.cve.severity, C.critical, C.criticalBg, M + 60, y + 10.5, 20, 5);
        doc.setFontSize(5.5); doc.setTextColor(...C.accent);
        doc.text(issue.cve.url, M + 4, y + 14);
        y += 18;
      } else {
        doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
        doc.text(safeText("Aucune r\xe9f\xe9rence CVE disponible pour cette vuln\xe9rabilit\xe9 de configuration."), M, y + 3.5);
        y += 8;
      }

      const recText = impactInfo.recommendation || issue.fix;
      if (recText) {
        const recLines = doc.splitTextToSize(safeText(recText), CW - 10);
        const recH = recLines.length * 4 + 8;
        checkPage(recH + 3);
        doc.setFillColor(...C.accentBg);
        doc.setDrawColor(...C.accent);
        doc.roundedRect(M, y, CW, recH, 1.5, 1.5, "FD");
        doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.accent);
        doc.text(safeText("Recommandation G\xe9n\xe9rale"), M + 4, y + 5);
        y += 8;
        doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.navyMid);
        recLines.forEach((fl: string) => {
          doc.text(fl, M + 4, y);
          y += 4;
        });
        y += 3;
      }

      y += 2;
      hRule();
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ISO 27001 COMPLIANCE MATRIX ────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  if (isoCompliance && isoCompliance.totalControls > 0) {
    newPage();
    sectionTitle(safeText("03 \x97 Matrice de Conformit\xe9 ISO/IEC 27001:2022"));

    checkPage(12);
    const isoBarW = CW;
    const isoBarFill = (isoCompliance.passedCount / isoCompliance.totalControls) * isoBarW;
    doc.setFillColor(...C.bgMid);
    doc.roundedRect(M, y, isoBarW, 4.5, 1, 1, "F");
    doc.setFillColor(...C.green);
    doc.roundedRect(M, y, isoBarFill, 4.5, 1, 1, "F");
    y += 6.5;
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    doc.text(safeText(`${isoCompliance.compliancePercentage}% de conformit\xe9 \x97 ${isoCompliance.passedCount} conformes / ${isoCompliance.totalControls} contr\xf4les analys\xe9s`), M, y);
    y += 9;

    checkPage(10);
    doc.setFillColor(...C.navy);
    doc.rect(M, y, CW, 6.5, "F");
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.white);
    const colCode = M + 2, colStatus = M + 22, colName = M + 46, colRec = M + 102;
    doc.text("Code", colCode, y + 4.5);
    doc.text("Statut", colStatus, y + 4.5);
    doc.text(safeText("Contr\xf4le"), colName, y + 4.5);
    doc.text(safeText("Recommandation"), colRec, y + 4.5);
    y += 6.5;

    isoCompliance.controls.forEach((ctrl, ri) => {
      const rowH = 8.5;
      checkPage(rowH + 2);
      if (ri % 2 === 0) {
        doc.setFillColor(...C.bg);
        doc.rect(M, y, CW, rowH, "F");
      }
      const sColor: [number, number, number] = ctrl.status === "CONFORME" ? C.green : C.critical;
      const sBg: [number, number, number] = ctrl.status === "CONFORME" ? C.greenBg : C.criticalBg;

      doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.muted);
      doc.text(ctrl.code, colCode, y + 5.5);
      drawBadge(ctrl.status === "CONFORME" ? "CONFORME" : "NON CONF.", sColor, sBg, colStatus, y + 5.5, 20, 5);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...C.navy);
      const nameStr = safeText(ctrl.name.length > 30 ? ctrl.name.substring(0, 27) + "..." : ctrl.name);
      doc.text(nameStr, colName, y + 5.5);
      const recStr = safeText((ctrl.status === "NON_CONFORME" && ctrl.recommendation)
        ? (ctrl.recommendation.length > 40 ? ctrl.recommendation.substring(0, 37) + "..." : ctrl.recommendation)
        : "\x97");
      doc.setTextColor(...C.muted);
      doc.text(recStr, colRec, y + 5.5);
      y += rowH;
    });
    y += 5;
    hRule();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── CONCLUSION & REMEDIATION PRIORITIES ────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  checkPage(55);
  sectionTitle(safeText("04 \x97 Conclusion & Priorit\xe9s de Rem\xe9diation"));

  const overallRisk = criticalCount > 0 ? { label: "CRITIQUE", color: C.critical, bg: C.criticalBg, bd: C.criticalBd }
    : highCount > 0 ? { label: safeText("\xc9LEV\xc9"), color: C.high, bg: C.highBg, bd: C.highBd }
      : mediumCount > 0 ? { label: "MOYEN", color: C.medium, bg: C.mediumBg, bd: C.mediumBd }
        : { label: "FAIBLE", color: C.low, bg: C.lowBg, bd: C.lowBd };

  checkPage(18);
  doc.setFillColor(...overallRisk.bg);
  doc.setDrawColor(...overallRisk.bd);
  doc.roundedRect(M, y, CW, 13, 1.5, 1.5, "FD");
  doc.setFillColor(...overallRisk.color);
  doc.roundedRect(M, y, 3, 13, 1, 0, "F");
  doc.rect(M + 1.5, y, 1.5, 13, "F");

  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...overallRisk.color);
  doc.text(safeText(`Niveau de Risque Global : ${overallRisk.label}`), M + 7, y + 5.5);
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
  doc.text(safeText(`Score de s\xe9curit\xe9 : ${score}/100 (Grade ${grade})  |  ${issues.length} vuln\xe9rabilit\xe9(s) d\xe9tect\xe9e(s)`), M + 7, y + 10);
  y += 18;

  const priorities = [
    criticalCount > 0 ? `Traiter imm\xe9diatement les ${criticalCount} vuln\xe9rabilit\xe9(s) CRITIQUE(S) \x97 risque de compromission imm\xe9diate.` : null,
    highCount > 0 ? `Planifier la correction des ${highCount} vuln\xe9rabilit\xe9(s) \xc9LEV\xc9E(S) dans les 30 prochains jours.` : null,
    mediumCount > 0 ? `Corriger les ${mediumCount} vuln\xe9rabilit\xe9(s) MOYENNE(S) dans les 90 prochains jours.` : null,
    isoCompliance && isoCompliance.totalControls > isoCompliance.passedCount
      ? `Am\xe9liorer la conformit\xe9 ISO 27001:2022 : ${isoCompliance.totalControls - isoCompliance.passedCount} contr\xf4le(s) non conformes.`
      : null,
    `Effectuer un nouveau scan de s\xe9curit\xe9 apr\xe8s chaque correction pour valider l\x92am\xe9lioration.`,
  ].filter(Boolean) as string[];

  checkPage(10);
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
  doc.text(safeText("Actions Prioritaires de Rem\xe9diation"), M, y); y += 6;

  priorities.forEach((p, i) => {
    checkPage(10);
    const pColor: [number, number, number] = i === 0 && criticalCount > 0 ? C.critical
      : i <= 1 && highCount > 0 ? C.high
        : C.slate;

    doc.setFillColor(...C.bgMid);
    doc.roundedRect(M, y - 3.5, 7, 6, 1, 1, "F");
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    doc.text(`${i + 1}`, M + 3.5, y, { align: "center" });

    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...pColor);
    const bLines = doc.splitTextToSize(safeText(p), CW - 12);
    bLines.forEach((l: string, li: number) => {
      checkPage(5);
      doc.text(l, M + 10, y + (li === 0 ? 0 : li * 4.5));
    });
    y += bLines.length * 4.5 + 2.5;
  });

  y += 3;
  hRule();

  checkPage(12);
  doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
  doc.text(safeText("Ce rapport a \xe9t\xe9 g\xe9n\xe9r\xe9 automatiquement par la plateforme Clarveon \xe0 partir de donn\xe9es r\xe9elles d\x92analyse externe passive."), M, y);
  y += 4.5;
  doc.text(safeText("Il ne refl\xe8te que les donn\xe9es disponibles publiquement au moment du scan et ne constitue pas un audit de s\xe9curit\xe9 exhaustif."), M, y);

  // ─── APPLY HEADERS & FOOTERS TO ALL INTERNAL PAGES ─────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageHeader();
    drawPageFooter(p, totalPages);
  }

  doc.save(`Clarveon_Security_Report_${domain}_${new Date().toISOString().slice(0, 10)}.pdf`);
}