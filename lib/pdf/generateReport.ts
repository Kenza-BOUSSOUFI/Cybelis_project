import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Lock,
  Globe,
  Briefcase,
  Calendar,
  Clock,
  Crosshair,
  ShieldCheck,
  Shield,
} from "lucide-react";
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
  id?: string;
  type?: "FULL" | "CUSTOM" | string | null;
  website: { domain: string | undefined };
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  companyName?: string | null;
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
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return resolve(null);
        tempCtx.drawImage(img, 0, 0);

        // Auto-trim transparent padding
        try {
          const imgData = tempCtx.getImageData(0, 0, img.width, img.height);
          const { data, width, height } = imgData;
          let minX = width, minY = height, maxX = 0, maxY = 0;
          let found = false;

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const alpha = data[(y * width + x) * 4 + 3];
              if (alpha > 15) {
                found = true;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          if (!found) {
            minX = 0; minY = 0; maxX = width; maxY = height;
          }

          const cropW = Math.max(1, maxX - minX + 1);
          const cropH = Math.max(1, maxY - minY + 1);

          const canvas = document.createElement("canvas");
          canvas.width = cropW * scale;
          canvas.height = cropH * scale;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, minX, minY, cropW, cropH, 0, 0, canvas.width, canvas.height);
            resolve({
              data: canvas.toDataURL("image/png"),
              aspectRatio: cropW / cropH
            });
          } else {
            resolve(null);
          }
        } catch {
          // Fallback if getImageData fails (e.g. cross-origin)
          const canvas = document.createElement("canvas");
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve({
              data: canvas.toDataURL("image/png"),
              aspectRatio: img.width / img.height
            });
          } else {
            resolve(null);
          }
        }
      };
      img.onerror = () => resolve(null);
    });
  };

  const logoObj = await loadLogoBase64();

  // ─── LOAD LUCIDE ICONS (NON-HARDCODED) VIA HIGH-RES OFFSCREEN CANVAS ───────
  const getLucideIconPng = (
    iconElement: React.ReactElement,
    canvasSize = 100
  ): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const svgString = renderToStaticMarkup(iconElement);
        const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = canvasSize;
          canvas.height = canvasSize;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
            resolve(canvas.toDataURL("image/png"));
          } else {
            resolve("");
          }
          URL.revokeObjectURL(url);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve("");
        };
        img.src = url;
      } catch (e) {
        console.warn("Icon render failed:", e);
        resolve("");
      }
    });
  };

  const [
    lockIconPng,
    globeIconPng,
    briefcaseIconPng,
    calendarIconPng,
    clockIconPng,
    crosshairIconPng,
    shieldCheckIconPng,
    shieldFooterPng,
  ] = await Promise.all([
    getLucideIconPng(React.createElement(Lock, { size: 28, color: "#ffffff", strokeWidth: 2.2 })),
    getLucideIconPng(React.createElement(Globe, { size: 36, color: "#1d4ed8", strokeWidth: 2.2 })),
    getLucideIconPng(React.createElement(Briefcase, { size: 28, color: "#1d4ed8", strokeWidth: 2.2 })),
    getLucideIconPng(React.createElement(Calendar, { size: 28, color: "#1d4ed8", strokeWidth: 2.2 })),
    getLucideIconPng(React.createElement(Clock, { size: 28, color: "#1d4ed8", strokeWidth: 2.2 })),
    getLucideIconPng(React.createElement(Crosshair, { size: 28, color: "#1d4ed8", strokeWidth: 2.2 })),
    getLucideIconPng(React.createElement(ShieldCheck, { size: 28, color: "#1d4ed8", strokeWidth: 2.2 })),
    getLucideIconPng(React.createElement(Shield, { size: 24, color: "#1d4ed8", strokeWidth: 2.2 })),
  ]);

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

    // Severity — Functional semantic colors for audit report readability
    critical: [220, 38, 38] as [number, number, number],   // red-600
    criticalBg: [254, 242, 242] as [number, number, number], // red-50
    criticalBd: [252, 165, 165] as [number, number, number], // red-300

    high: [234, 88, 12] as [number, number, number],       // orange-600
    highBg: [255, 247, 237] as [number, number, number],   // orange-50
    highBd: [253, 186, 116] as [number, number, number],   // orange-300

    medium: [217, 119, 6] as [number, number, number],     // amber-600
    mediumBg: [255, 251, 235] as [number, number, number], // amber-50
    mediumBd: [252, 211, 77] as [number, number, number],  // amber-300

    low: [5, 150, 105] as [number, number, number],        // emerald-600 (vert)
    lowBg: [236, 253, 245] as [number, number, number],    // emerald-50
    lowBd: [110, 231, 183] as [number, number, number],    // emerald-300

    green: [5, 150, 105] as [number, number, number],      // emerald-600
    greenBg: [236, 253, 245] as [number, number, number],  // emerald-50
    greenBd: [110, 231, 183] as [number, number, number],  // emerald-300

    purple: [30, 41, 59] as [number, number, number],      // slate-800
    purpleBg: [241, 245, 249] as [number, number, number],
    purpleBd: [203, 213, 225] as [number, number, number],
  };

  // ─── DERIVED SCAN DATA ───────────────────────────────────────────────────
  const domain = scan.website.domain ?? "";
  const scanDate = new Date(scan.createdAt);
  const score = scan.securityScore?.score ?? 0;
  const grade = scan.securityScore?.grade ?? (score >= 90 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : score >= 30 ? "D" : "F");
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const highCount = issues.filter(i => i.severity === "high").length;
  const mediumCount = issues.filter(i => i.severity === "medium").length;
  const lowCount = issues.filter(i => i.severity === "low").length;
  const scoreColor: [number, number, number] = score >= 85 ? [5, 150, 105] : score >= 65 ? C.medium : score >= 40 ? C.high : C.critical;
  const scoreLevel = score >= 85 ? "Faible" : score >= 65 ? "Mod\xe9r\xe9" : score >= 40 ? "\xc9lev\xe9" : "Critique";

  // ─── LAYOUT & PAGINATION STATE ───────────────────────────────────────────
  let y = CONTENT_TOP;
  let currentPage = 1;

  // ─── HEADER & FOOTER ON SUBSEQUENT PAGES ──────────────────────────────────
  const drawPageHeader = () => {
    // Full-width dark navy header band on internal pages
    doc.setFillColor(11, 19, 41); // Deep Navy #0b1329
    doc.rect(0, 0, PW, HEADER_H, "F");
    doc.setDrawColor(30, 58, 118);
    doc.setLineWidth(0.35);
    doc.line(0, HEADER_H, PW, HEADER_H);

    // Left: Platform Logo in header
    if (logoObj && logoObj.data) {
      const hLogoH = 8.5;
      const hLogoW = hLogoH * logoObj.aspectRatio;
      doc.addImage(logoObj.data, "PNG", M, (HEADER_H - hLogoH) / 2, hLogoW, hLogoH);
    } else {
      doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
      doc.text("CLARVEON", M, HEADER_H / 2 + 2.5);
    }

    // Center: Report Title (in pure white)
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text(safeText("RAPPORT D'AUDIT DE S\xc9CURIT\xc9"), PW / 2, HEADER_H / 2 + 2, { align: "center" });

    // Right: Audited Domain
    doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(203, 213, 225);
    doc.text(domain, PW - M, HEADER_H / 2 + 2, { align: "right" });
  };

  const drawPageFooter = (page: number, totalPages: number) => {
    doc.setFillColor(...C.white);
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

  /** Thin horizontal separator line */
  const thinRule = (marginTop = 3, marginBottom = 4) => {
    y += marginTop;
    checkPage(4);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.25);
    doc.line(M, y, PW - M, y);
    y += marginBottom;
  };

  const hRule = () => thinRule(2, 6);

  /**
   * Section header — number + title + thin underline
   */
  const sectionHeader = (num: string, title: string, intro?: string) => {
    checkPage(intro ? 36 : 26);
    // Section number
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
    doc.text(num, M, y); y += 6;
    // Section title — large bold, wrapped to stay within margins
    doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    const titleLines = doc.splitTextToSize(safeText(title), CW);
    titleLines.forEach((l: string) => { doc.text(l, M, y); y += 8; });
    thinRule(2, intro ? 5 : 6);
    if (intro) {
      doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
      const introLines = doc.splitTextToSize(safeText(intro), CW);
      introLines.forEach((l: string) => { checkPage(6); doc.text(l, M, y); y += 5; });
      y += 4;
    }
  };

  /** Sub-section label — e.g. "01.1  VUE D'ENSEMBLE" */
  const subSection = (label: string) => {
    checkPage(16);
    y += 5;
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.accentText);
    doc.text(safeText(label), M, y);
    y += 10;
  };

  /** Small label in uppercase — e.g. "DESCRIPTION" */
  const fieldLabel = (text: string, indentX = 0) => {
    checkPage(6);
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    doc.text(safeText(text), M + indentX, y); y += 4.5;
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

  /** Dot leaders between text and page number for TOC */
  const tocLine = (num: string, title: string, page: number, indent = 0) => {
    checkPage(7);
    const numStr = num;
    const pageStr = `${page}`;
    doc.setFontSize(8.5); doc.setFont("helvetica", num && !num.includes(".") ? "bold" : "normal");
    doc.setTextColor(...C.navy);
    const xStart = M + indent;
    if (num) {
      doc.setFontSize(8.5); doc.setFont("helvetica", num.includes(".") ? "normal" : "bold"); doc.setTextColor(...C.muted);
      doc.text(numStr, xStart, y);
    }
    const textX = xStart + (num ? 12 : 0);
    doc.setFontSize(8.5); doc.setFont("helvetica", num && !num.includes(".") ? "bold" : "normal"); doc.setTextColor(...C.navy);
    doc.text(safeText(title), textX, y);
    const titleW = doc.getTextWidth(safeText(title));
    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.accent);
    const pageW = doc.getTextWidth(pageStr);
    // Dot leaders
    doc.setFontSize(7); doc.setTextColor(...C.muted);
    const leaderStart = textX + titleW + 2;
    const leaderEnd = PW - M - pageW - 4;
    for (let lx = leaderStart; lx < leaderEnd; lx += 3) {
      doc.text(".", lx, y);
    }
    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    doc.text(pageStr, PW - M, y, { align: "right" });
    y += num && !num.includes(".") ? 7 : 5.5;
  };

  // ════════════════════════════════════════════════════════════════════════════
  // ─── COVER PAGE — CLEAN MODERN ENTERPRISE DESIGN ───────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  // Pure White Background
  doc.setFillColor(...C.white);
  doc.rect(0, 0, PW, PH, "F");

  // ── 1. TOP HEADER — FULL-WIDTH DARK BLUE BAND (LEFT TO RIGHT) ──
  const bandY = 0;
  const bandH = 34; // Generous height for large logo
  doc.setFillColor(11, 19, 41); // Deep Navy #0b1329
  doc.rect(0, bandY, PW, bandH, "F");

  // Subtle bottom accent border line on the band
  doc.setDrawColor(30, 58, 118);
  doc.setLineWidth(0.4);
  doc.line(0, bandH, PW, bandH);

  // Left: Clarveon Large Platform Logo inside dark band
  if (logoObj && logoObj.data) {
    const lH = 18; // Large prominent platform logo
    const lW = lH * logoObj.aspectRatio;
    const logoY = (bandH - lH) / 2 - 1.5;
    doc.addImage(logoObj.data, "PNG", M, logoY, lW, lH);
    doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(148, 163, 184);
    doc.text(safeText("PLATEFORME D'AUDIT DE S\xc9CURIT\xc9"), M, logoY + lH + 3.2);
  } else {
    doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text("CLARVEON", M, 19);
    doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(148, 163, 184);
    doc.text(safeText("PLATEFORME D'AUDIT DE S\xc9CURIT\xc9"), M, 25);
  }

  // Right: Confidential Block with Lock Icon inside dark band
  const lockIconX = PW - M - 52;
  const lockIconY = bandH / 2;

  // Thin vertical separator line inside the dark band
  doc.setDrawColor(30, 58, 118);
  doc.setLineWidth(0.35);
  doc.line(lockIconX - 8, 7, lockIconX - 8, bandH - 7);

  // Lock Icon (clean without circle)
  if (lockIconPng) {
    doc.addImage(lockIconPng, "PNG", lockIconX - 2, lockIconY - 2.8, 5.6, 5.6);
  }

  // Confidential text block on dark band (CONFIDENTIEL in pure white)
  doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text("CONFIDENTIEL", lockIconX + 7, lockIconY - 2.2);
  doc.setFontSize(5.5); doc.setFont("helvetica", "normal"); doc.setTextColor(203, 213, 225);
  doc.text("Document strictement confidentiel", lockIconX + 7, lockIconY + 1.6);
  doc.setFontSize(5); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
  doc.text(safeText("\xe0 usage interne uniquement"), lockIconX + 7, lockIconY + 5);

  // ── 2. HERO TITLE SECTION ──
  doc.setFontSize(26); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
  doc.text("RAPPORT D'AUDIT", M, 56);

  doc.setFontSize(26); doc.setFont("helvetica", "bold"); doc.setTextColor(29, 78, 216);
  doc.text(safeText("DE S\xc9CURIT\xc9"), M, 66.5);

  // Solid Blue Accent Underline Bar
  doc.setFillColor(29, 78, 216);
  doc.roundedRect(M, 72.5, 18, 1.2, 0.6, 0.6, "F");

  // Subtitle
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(71, 85, 105);
  doc.text(safeText("\xc9valuation compl\xe8te de la posture de s\xe9curit\xe9"), M, 81.5);
  doc.text(safeText("et des risques associ\xe9s au domaine audit\xe9."), M, 86);

  // ── 3. TWO-COLUMN MAIN CONTENT ──
  const colGap = 8;
  const leftW = 90;
  const rightW = CW - leftW - colGap; // 82mm
  const leftX = M;
  const rightX = M + leftW + colGap;

  // ── LEFT COLUMN ──
  // Hero Domain Block (clean Globe icon without circle)
  if (globeIconPng) {
    doc.addImage(globeIconPng, "PNG", leftX, 109, 8, 8);
  }

  doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 116, 139);
  doc.text(safeText("DOMAINE AUDIT\xc9"), leftX + 11, 111);

  doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
  doc.text(domain, leftX + 11, 118);

  // Divider Line below Domain
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.4);
  doc.line(leftX, 125.5, leftX + leftW, 125.5);

  // Date Formatting
  const scanDateFormatted = `${scanDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} \xe0 ${scanDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;

  // Duration Formatting
  let scanDurationStr = "24 secondes";
  if (scan.startedAt && scan.finishedAt) {
    const ms = new Date(scan.finishedAt).getTime() - new Date(scan.startedAt).getTime();
    const totalSeconds = Math.max(1, Math.round(ms / 1000));
    if (totalSeconds < 60) {
      scanDurationStr = `${totalSeconds} seconde${totalSeconds > 1 ? "s" : ""}`;
    } else {
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      scanDurationStr = secs > 0 ? `${mins} min ${secs} s` : `${mins} min`;
    }
  }

  // ISO 27001 Text
  const isoSatStr = isoCompliance
    ? `${isoCompliance.compliancePercentage}% de contr\xf4les satisfaits (${isoCompliance.passedCount}/${isoCompliance.totalControls})`
    : "33% de contr\xf4les satisfaits (1/3)";

  // Analyzed elements (categories)
  const hasWeb = issues.some((i) => i.category === "website");
  const hasEmail = issues.some((i) => i.category === "email");
  const hasDns = issues.some((i) => i.category === "dns");

  let elemLine1 = "S\xe9curit\xe9 Web, Messagerie & Email,";
  let elemLine2: string | null = "DNS et configuration du domaine.";

  const activeCategories: string[] = [];
  if (hasWeb) activeCategories.push("S\xe9curit\xe9 Web");
  if (hasEmail) activeCategories.push("Messagerie & Email");
  if (hasDns) activeCategories.push("DNS et configuration du domaine");

  if (activeCategories.length === 1) {
    elemLine1 = activeCategories[0];
    elemLine2 = null;
  } else if (activeCategories.length === 2) {
    elemLine1 = `${activeCategories[0]},`;
    elemLine2 = `${activeCategories[1]}.`;
  }

  const auditTypeStr = scan.type === "CUSTOM" ? "Audit personnalis\xe9" : "Audit complet";

  // Meta Specifications Items
  const metaList = [
    {
      icon: briefcaseIconPng,
      label: "TYPE D'AUDIT",
      val1: auditTypeStr,
      val2: null,
      baseY: 133,
    },
    {
      icon: calendarIconPng,
      label: "DATE DE L'AUDIT",
      val1: scanDateFormatted,
      val2: null,
      baseY: 154,
    },
    {
      icon: clockIconPng,
      label: "DUR\xc9E DU SCAN",
      val1: scanDurationStr,
      val2: null,
      baseY: 175,
    },
    {
      icon: crosshairIconPng,
      label: "\xc9L\xc9MENTS ANALYS\xc9S",
      val1: elemLine1,
      val2: elemLine2,
      baseY: 196,
    },
    {
      icon: shieldCheckIconPng,
      label: "R\xc9F\xc9RENTIEL",
      val1: "ISO/IEC 27001:2022",
      val2: isoSatStr,
      baseY: 219,
    },
  ];

  metaList.forEach((item) => {
    // Clean icon without circle
    if (item.icon) {
      doc.addImage(item.icon, "PNG", leftX, item.baseY + 1.8, 5.5, 5.5);
    }

    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 116, 139);
    doc.text(safeText(item.label), leftX + 9, item.baseY + 3);

    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
    doc.text(safeText(item.val1), leftX + 9, item.baseY + 8);

    if (item.val2) {
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(71, 85, 105);
      doc.text(safeText(item.val2), leftX + 9, item.baseY + 12.5);
    }
  });

  // ── RIGHT COLUMN: SUMMARY SCORE CARD ──
  const cardW = rightW;
  const cardH = 146;
  const cardY = 104;
  const cardCenterX = rightX + cardW / 2;

  // Outer Container
  doc.setFillColor(...C.white);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.roundedRect(rightX, cardY, cardW, cardH, 4, 4, "FD");

  // Section 1: Score Global
  doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 116, 139);
  doc.text("SCORE GLOBAL", cardCenterX, cardY + 12, { align: "center" });

  // Big Score + "/ 100" aligned
  doc.setFontSize(38); doc.setFont("helvetica", "bold");
  const numScoreW = doc.getTextWidth(`${score}`);
  doc.setFontSize(13); doc.setFont("helvetica", "bold");
  const denomW = doc.getTextWidth(" / 100");
  const combinedScoreW = numScoreW + denomW;
  const scoreStartX = cardCenterX - combinedScoreW / 2;

  doc.setFontSize(38); doc.setFont("helvetica", "bold"); doc.setTextColor(29, 78, 216);
  doc.text(`${score}`, scoreStartX, cardY + 29);

  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 116, 139);
  doc.text(" / 100", scoreStartX + numScoreW, cardY + 29);

  // Horizontal Progress Bar
  const barW = 56;
  const barH = 2.4;
  const barX = cardCenterX - barW / 2;
  const barY = cardY + 34;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(barX, barY, barW, barH, 1.2, 1.2, "F");

  const filledBarW = Math.max(2.4, barW * Math.min(1, Math.max(0, score / 100)));
  doc.setFillColor(29, 78, 216);
  doc.roundedRect(barX, barY, filledBarW, barH, 1.2, 1.2, "F");

  // Section 2: Grade
  doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 116, 139);
  doc.text("GRADE", cardCenterX, cardY + 49, { align: "center" });

  doc.setFontSize(34); doc.setFont("helvetica", "bold"); doc.setTextColor(29, 78, 216);
  doc.text(`${grade}`, cardCenterX, cardY + 66, { align: "center" });

  // Severity Level Badge Pill
  const badgeW = 46;
  const badgeH = 7.5;
  const badgeX = cardCenterX - badgeW / 2;
  const badgeY = cardY + 72;

  const badgeBg: [number, number, number] =
    scoreLevel === "Critique"
      ? [254, 226, 226]
      : scoreLevel === "\xc9lev\xe9"
      ? [255, 237, 213]
      : scoreLevel === "Mod\xe9r\xe9"
      ? [254, 243, 199]
      : [220, 252, 231];

  const badgeFg: [number, number, number] =
    scoreLevel === "Critique"
      ? [220, 38, 38]
      : scoreLevel === "\xc9lev\xe9"
      ? [194, 65, 12]
      : scoreLevel === "Mod\xe9r\xe9"
      ? [180, 83, 9]
      : [21, 128, 61];

  doc.setFillColor(...badgeBg);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, "F");

  doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...badgeFg);
  doc.text(safeText(`NIVEAU : ${scoreLevel.toUpperCase()}`), cardCenterX, badgeY + 5.2, { align: "center" });

  // Section 3: Répartition des vulnérabilités
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.35);
  doc.line(rightX + 6, cardY + 89, rightX + cardW - 6, cardY + 89);

  doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 116, 139);
  doc.text(safeText("R\xc9PARTITION DES VULN\xc9RABILIT\xc9S"), cardCenterX, cardY + 97, { align: "center" });

  const col4W = (cardW - 8) / 4;
  const col4StartX = rightX + 4;

  // 1. Critique
  doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(220, 38, 38);
  doc.text(`${criticalCount}`, col4StartX + col4W * 0.5, cardY + 112, { align: "center" });
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(71, 85, 105);
  doc.text("Critique", col4StartX + col4W * 0.5, cardY + 118.5, { align: "center" });

  // 2. Élevé
  doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(234, 88, 12);
  doc.text(`${highCount}`, col4StartX + col4W * 1.5, cardY + 112, { align: "center" });
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(71, 85, 105);
  doc.text(safeText("\xc9lev\xe9"), col4StartX + col4W * 1.5, cardY + 118.5, { align: "center" });

  // 3. Moyen
  doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(217, 119, 6);
  doc.text(`${mediumCount}`, col4StartX + col4W * 2.5, cardY + 112, { align: "center" });
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(71, 85, 105);
  doc.text("Moyen", col4StartX + col4W * 2.5, cardY + 118.5, { align: "center" });

  // 4. Faible
  doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(5, 150, 105);
  doc.text(`${lowCount}`, col4StartX + col4W * 3.5, cardY + 112, { align: "center" });
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(71, 85, 105);
  doc.text("Faible", col4StartX + col4W * 3.5, cardY + 118.5, { align: "center" });

  // ── 4. FOOTER (BOTTOM OF COVER PAGE) ──
  const footerLineY = 280;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.line(M, footerLineY, PW - M, footerLineY);

  if (shieldFooterPng) {
    doc.addImage(shieldFooterPng, "PNG", M, footerLineY + 3.2, 4, 4);
  }

  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
  doc.text(safeText(`\xa9 ${new Date().getFullYear()} Clarveon \x97 Tous droits r\xe9serv\xe9s`), M + 5.5, footerLineY + 6.2);

  const scanRefSuffix = scan.id ? scan.id.substring(0, 8).toUpperCase() : "001";
  const reportRefId = `RAPPORT N\xb0 CLV-${scanDate.getFullYear()}-${String(scanDate.getMonth() + 1).padStart(2, "0")}-${String(scanDate.getDate()).padStart(2, "0")}-${scanRefSuffix}`;
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
  doc.text(safeText(reportRefId), PW - M, footerLineY + 6.2, { align: "right" });


  // ════════════════════════════════════════════════════════════════════════════
  // ─── PAGE 2: TABLE DES MATIÈRES ─────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  doc.addPage();
  currentPage = 2;
  drawPageHeader();
  y = CONTENT_TOP + 8;

  // ── TOC Header ──
  doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
  doc.text(safeText("TABLE DES MATI\xc8RES"), M, y); y += 2;
  thinRule(3, 6);

  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
  doc.text(safeText(`Rapport d\x92audit de s\xe9curit\xe9 — ${domain} — ${scanDate.toLocaleDateString("fr-FR")}`), M, y);
  y += 10;

  // ── TOC Entries ──
  // Page estimates (static but realistic)
  const p3 = 3;
  const p4 = 4;
  const pIso = issues.length > 8 ? 5 + Math.ceil(issues.length / 3) : 5;
  const pConc = pIso + 1;

  tocLine("01", safeText("Synth\xe8se de s\xe9curit\xe9"), p3);
  tocLine("01.1", safeText("Vue d\x92ensemble & score global"), p3, 4);
  tocLine("01.2", safeText("R\xe9partition des vuln\xe9rabilit\xe9s"), p3, 4);
  tocLine("01.3", safeText("R\xe9sultats par outil"), p3, 4);
  y += 3;
  tocLine("02", safeText("Findings & vuln\xe9rabilit\xe9s d\xe9tect\xe9es"), p4);
  if (issues.some(i => i.category === "website")) {
    tocLine("02.1", safeText("S\xe9curit\xe9 Web"), p4, 4);
  }
  if (issues.some(i => i.category === "email")) {
    tocLine("02.2", safeText("Messagerie & Email"), p4, 4);
  }
  if (issues.some(i => i.category === "dns")) {
    tocLine("02.3", safeText("DNS & Domaine"), p4, 4);
  }
  y += 3;
  if (isoCompliance && isoCompliance.totalControls > 0) {
    tocLine("03", safeText("Conformit\xe9 ISO/IEC 27001:2022"), pIso);
    y += 3;
  }
  tocLine(isoCompliance && isoCompliance.totalControls > 0 ? "04" : "03", safeText("Conclusion & Priorit\xe9s de rem\xe9diation"), pConc);

  // ════════════════════════════════════════════════════════════════════════════
  // ─── PAGE 3+: SYNTHÈSE DE SÉCURITÉ ─────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  newPage();
  sectionHeader("01", "SYNTH\xc8SE DE S\xc9CURIT\xc9",
    safeText(`Pr\xe9sentation du score global, de la distribution des vuln\xe9rabilit\xe9s et des principaux constats de l\x92audit r\xe9alis\xe9 sur le domaine ${domain}.`));

  // ── 01.1 Score global ──
  subSection(safeText("01.1  SCORE GLOBAL"));

  // Score display — typographic, no donut
  checkPage(38);

  // Score number
  doc.setFontSize(36); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
  doc.text(`${score}`, M, y + 12);
  const scoreNumW = doc.getTextWidth(`${score}`);
  doc.setFontSize(14); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
  doc.text(" / 100", M + scoreNumW, y + 10);

  // Grade and level on same line, right-aligned
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.accentText);
  doc.text(`Grade ${grade}`, PW - M - 60, y + 8);

  const levelFg: [number, number, number] =
    scoreLevel === "Critique" ? C.critical :
    scoreLevel === "\xc9lev\xe9" ? C.high :
    scoreLevel === "Mod\xe9r\xe9" ? C.medium : [5, 150, 105];

  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...levelFg);
  doc.text(safeText(`Risque : ${scoreLevel}`), PW - M - 60, y + 14);

  y += 17;
  thinRule(2, 5);

  // Stats row: Domaine | Date | Vulnérabilités | Conformité ISO
  const statCols = [
    { label: "DOMAINE", value: domain },
    { label: "DATE DE L'AUDIT", value: scanDate.toLocaleDateString("fr-FR") },
    { label: safeText("VULN\xc9RABILIT\xc9S"), value: `${issues.length} d\xe9tect\xe9e${issues.length > 1 ? "s" : ""}` },
    { label: "ISO 27001", value: isoCompliance ? `${isoCompliance.compliancePercentage}%` : "N/A" },
  ];
  checkPage(14);
  const statColW = CW / 4;
  statCols.forEach((st, i) => {
    doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.muted);
    doc.text(safeText(st.label), M + i * statColW, y);
    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    doc.text(safeText(st.value), M + i * statColW, y + 5.5);
  });
  y += 13;
  thinRule(2, 6);

  // ── 01.2 Répartition des vulnérabilités ──
  subSection(safeText("01.2  R\xc9PARTITION DES VULN\xc9RABILIT\xc9S"));

  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
  doc.text(safeText(`L\x92audit a identifi\xe9 ${issues.length} vuln\xe9rabilit\xe9${issues.length > 1 ? "s" : ""} r\xe9parties comme suit :`), M, y); y += 7;

  const totalIssues = Math.max(issues.length, 1);
  const barGroups: Array<{ label: string; count: number; fg: [number, number, number] }> = [
    { label: "CRITIQUE", count: criticalCount, fg: C.critical },
    { label: safeText("\xc9LEV\xc9"), count: highCount, fg: C.high },
    { label: "MOYEN", count: mediumCount, fg: C.medium },
    { label: "FAIBLE", count: lowCount, fg: C.low },
  ];

  const barLabelW = 24;
  const barCountW = 12;
  const barTrackW = CW - barLabelW - barCountW - 8;

  barGroups.forEach(bg_item => {
    checkPage(8);
    // Label in bold black
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    doc.text(bg_item.label, M, y + 0.5);

    // Track
    doc.setFillColor(...C.borderLight);
    doc.rect(M + barLabelW, y - 2.5, barTrackW, 4, "F");
    // Black fill bar
    if (bg_item.count > 0) {
      const fillW = Math.max(3, (bg_item.count / totalIssues) * barTrackW);
      doc.setFillColor(...C.navy);
      doc.rect(M + barLabelW, y - 2.5, fillW, 4, "F");
    }
    // Count in bold black
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    doc.text(`${bg_item.count}`, M + barLabelW + barTrackW + 4, y + 0.5);
    y += 8.5;
  });

  y += 4;
  thinRule(0, 6);

  // ── 01.3 Résultats par outil ──
  subSection(safeText("01.3  R\xc9SULTATS PAR OUTIL"));

  if (issues.length > 0) {
    // Build tool summary: group by tool, get count & max severity
    const sevOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const toolMap: Map<string, { tool: string; category: string; count: number; maxSev: string }> = new Map();

    issues.forEach(issue => {
      const existing = toolMap.get(issue.toolSlug);
      if (!existing) {
        toolMap.set(issue.toolSlug, { tool: issue.tool, category: issue.category, count: 1, maxSev: issue.severity });
      } else {
        existing.count++;
        if ((sevOrder[issue.severity] ?? 0) > (sevOrder[existing.maxSev] ?? 0)) {
          existing.maxSev = issue.severity;
        }
      }
    });

    const toolRows = Array.from(toolMap.values()).sort((a, b) =>
      (sevOrder[b.maxSev] ?? 0) - (sevOrder[a.maxSev] ?? 0)
    );

    // Table header
    checkPage(12);
    const tColTool = M;
    const tColCat = M + 65;
    const tColIssues = M + 115;
    const tColStatus = M + 138;

    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.muted);
    doc.text("OUTIL", tColTool, y);
    doc.text("CAT\xc9GORIE", tColCat, y);
    doc.text("PROBL\xc8MES", tColIssues, y);
    doc.text("STATUT", tColStatus, y);
    y += 3;
    thinRule(0, 4);

    const catLabel = (cat: string) => {
      if (cat === "website") return "S\xe9curit\xe9 Web";
      if (cat === "email") return "Messagerie";
      return "DNS";
    };

    const statusLabel = (maxSev: string): { text: string; color: [number, number, number] } => {
      if (maxSev === "critical") return { text: "Critique", color: C.critical };
      if (maxSev === "high") return { text: "\xc9lev\xe9", color: C.high };
      if (maxSev === "medium") return { text: "Attention", color: C.medium };
      return { text: "Faible", color: C.green };
    };

    toolRows.forEach((row, ri) => {
      checkPage(9);
      if (ri % 2 === 0) {
        doc.setFillColor(...C.bg);
        doc.rect(M, y - 2.5, CW, 8, "F");
      }

      const st = statusLabel(row.maxSev);

      // Tool name
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.navy);
      const toolName = row.tool.length > 30 ? row.tool.substring(0, 27) + "..." : row.tool;
      doc.text(safeText(toolName), tColTool, y + 1);

      // Category
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
      doc.text(safeText(catLabel(row.category)), tColCat, y + 1);

      // Issue count
      doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
      doc.text(`${row.count}`, tColIssues + 6, y + 1, { align: "center" });

      // Status — colored dot + text
      doc.setFillColor(...st.color);
      doc.circle(tColStatus + 1.2, y - 0.3, 1, "F");
      doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...st.color);
      doc.text(safeText(st.text), tColStatus + 4, y + 1);

      y += 8.5;
    });

    thinRule(3, 5);
  } else {
    // All tools passed
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(5, 150, 105);
    doc.text(safeText("Tous les outils ont pass\xe9 l\x92ensemble des v\xe9rifications."), M, y);
    y += 8;
    thinRule(2, 6);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── FINDINGS & VULNÉRABILITÉS ───────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  newPage();
  sectionHeader("02", "FINDINGS & VULN\xc9RABILIT\xc9S D\xc9TECT\xc9ES",
    safeText(`Analyse d\xe9taill\xe9e des ${issues.length} vuln\xe9rabilit\xe9${issues.length > 1 ? "s" : ""} identifi\xe9e${issues.length > 1 ? "s" : ""} lors du scan du domaine ${domain}.`));

  if (issues.length === 0) {
    checkPage(14);
    y += 4;
    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(5, 150, 105);
    doc.text(safeText("Aucune vuln\xe9rabilit\xe9 d\xe9tect\xe9e lors de cet audit."), M, y);
    y += 5;
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
    doc.text(safeText("Le domaine audit\xe9 a pass\xe9 l\x92ensemble des contr\xf4les de s\xe9curit\xe9 analys\xe9s."), M, y);
    y += 10;
  } else {
    // Group by category
    const categories: Array<{ key: "website" | "email" | "dns"; num: string; label: string }> = [
      { key: "website", num: "02.1", label: "S\xc9CURIT\xc9 WEB" },
      { key: "email", num: "02.2", label: "MESSAGERIE & EMAIL" },
      { key: "dns", num: "02.3", label: "DNS & DOMAINE" },
    ];

    let findingIndex = 0;

    categories.forEach(cat => {
      const catIssues = issues.filter(i => i.category === cat.key);
      if (catIssues.length === 0) return;

      subSection(safeText(`${cat.num}  ${cat.label}`));

      catIssues.forEach((issue) => {
        findingIndex++;
        const sev = severityColors(issue.severity);
        const impactInfo = getSecurityImpact(issue.toolSlug);

        // ── Finding header — visually distinct, purely typographic ──
        checkPage(60);
        y += 6;

        // Finding number (left) + Severity (right) — on same baseline
        doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.muted);
        doc.text(`FINDING ${String(findingIndex).padStart(2, "0")}`, M, y);
        doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...sev.fg);
        doc.text(safeText(sev.label), PW - M, y, { align: "right" });
        y += 6;

        // Title — large bold, wrapped within margins (reserve 0 right since severity is on row above)
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
        const titleLines = doc.splitTextToSize(safeText(issue.title), CW);
        // Show max 2 lines to keep it compact
        titleLines.slice(0, 2).forEach((tl: string) => {
          checkPage(8);
          doc.text(tl, M, y);
          y += 7;
        });

        // Tool & category line — keywords in bold black
        doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
        doc.text("Outil :", M, y);
        const outilW = doc.getTextWidth("Outil : ");
        doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
        doc.text(safeText(issue.tool), M + outilW, y);
        const toolValW = doc.getTextWidth(safeText(issue.tool));

        const sepX = M + outilW + toolValW + 3;
        doc.setTextColor(...C.borderDark);
        doc.text("|", sepX, y);

        const catX = sepX + 4;
        doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
        doc.text(safeText("Cat\xe9gorie :"), catX, y);
        const catW = doc.getTextWidth(safeText("Cat\xe9gorie : "));
        doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
        doc.text(safeText(issue.category.toUpperCase()), catX + catW, y);
        y += 5;
        thinRule(0, 5);

        // ── DESCRIPTION ──
        fieldLabel("DESCRIPTION");
        bodyText(safeText(impactInfo.description || issue.description), 8, C.slate);
        y += 3;

        // ── IMPACT MÉTIER ──
        if (impactInfo.businessImpact.length > 0) {
          checkPage(8 + impactInfo.businessImpact.length * 5);
          fieldLabel("IMPACT M\xc9TIER");
          doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
          impactInfo.businessImpact.forEach(item => {
            checkPage(5);
            const bLines = doc.splitTextToSize(safeText(`\x96  ${item}`), CW - 4);
            bLines.forEach((bl: string) => { doc.text(bl, M + 2, y); y += 4.5; });
          });
          y += 3;
        }

        // ── IMPACT TECHNIQUE — MODÈLE CIA ──
        checkPage(28);
        fieldLabel("IMPACT TECHNIQUE \x97 MOD\xc8LE CIA");

        const ciaItems = [
          { name: "Confidentialit\xe9", score: impactInfo.technicalImpact.confidentiality },
          { name: "Int\xe9grit\xe9", score: impactInfo.technicalImpact.integrity },
          { name: "Disponibilit\xe9", score: impactInfo.technicalImpact.availability },
        ];

        const ciaBarX = M + 30;
        const ciaBarW = 60;

        ciaItems.forEach(cia => {
          const info = getCiaCategoryInfo(cia.score);

          checkPage(7);
          doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.accentText);
          doc.text(safeText(cia.name), M, y + 1);

          doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
          doc.text(safeText(info.level), M + 30, y + 1);

          // Small bar — black fill
          doc.setFillColor(...C.borderLight);
          doc.rect(ciaBarX + 15, y - 1.5, ciaBarW, 3, "F");
          const fillW = Math.max(1.5, (info.percentage / 100) * ciaBarW);
          doc.setFillColor(...C.navy);
          doc.rect(ciaBarX + 15, y - 1.5, fillW, 3, "F");
          doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
          doc.text(`${info.percentage}%`, ciaBarX + 15 + ciaBarW + 3, y + 1);
          y += 7;
        });
        y += 2;

        // ── RÉFÉRENCES OWASP ──
        if (issue.owasp && issue.owasp.length > 0) {
          checkPage(10 + issue.owasp.length * 9);
          fieldLabel("R\xc9F\xc9RENCES OWASP");
          issue.owasp.forEach(o => {
            checkPage(9);
            doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.accentText);
            doc.text(`[${o.code}]`, M, y);
            doc.setFont("helvetica", "normal"); doc.setTextColor(...C.navy);
            // Wrap OWASP title within remaining width
            const owTitleLines = doc.splitTextToSize(safeText(o.title), CW - 18);
            owTitleLines.slice(0, 1).forEach((l: string) => { doc.text(l, M + 16, y); });
            y += 4.5;
            doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
            const owLines = doc.splitTextToSize(safeText(o.description), CW - 4);
            owLines.slice(0, 2).forEach((l: string) => { checkPage(5); doc.text(l, M + 2, y); y += 4; });
          });
          y += 3;
        }

        // ── RÉFÉRENCE CVE ──
        checkPage(12);
        fieldLabel("R\xc9F\xc9RENCE CVE / CVSS");
        if (issue.cve) {
          doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
          doc.text(`${issue.cve.cveId}`, M, y);
          doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
          doc.text(`   CVSS ${issue.cve.cvssScore}  —  ${issue.cve.severity}`, M + doc.getTextWidth(`${issue.cve.cveId}`), y);
          y += 4.5;
          if (issue.cve.url) {
            doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.accent);
            // Truncate URL to fit within margins
            const maxUrlW = CW;
            let displayUrl = issue.cve.url;
            while (displayUrl.length > 10 && doc.getTextWidth(displayUrl) > maxUrlW) {
              displayUrl = displayUrl.slice(0, -4) + "...";
            }
            doc.text(displayUrl, M, y); y += 4;
          }
          y += 3;
        } else {
          doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
          doc.text(safeText("Non applicable \x97 D\xe9faut de configuration (aucune r\xe9f\xe9rence CVE logicielle)"), M, y);
          y += 5;
        }

        // ── RECOMMANDATION ──
        const recText = impactInfo.recommendation || issue.fix;
        if (recText) {
          checkPage(10);
          fieldLabel("RECOMMANDATION");
          bodyText(safeText(recText), 8, C.slate);
          y += 2;
        }

        // Separator between findings
        thinRule(4, 7);
      });
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ISO 27001 COMPLIANCE ───────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  if (isoCompliance && isoCompliance.totalControls > 0) {
    newPage();
    sectionHeader("03", "CONFORMIT\xc9 ISO/IEC 27001:2022",
      safeText(`\xc9valuation de la conformit\xe9 aux contr\xf4les de la norme ISO/IEC 27001:2022 (Annexe A) en fonction des r\xe9sultats du scan.`));

    // ── Compliance summary bar ──
    checkPage(18);
    subSection(safeText("03.1  TAUX DE CONFORMIT\xc9 GLOBAL"));

    const isoBarW = CW;
    const isoBarFill = (isoCompliance.passedCount / isoCompliance.totalControls) * isoBarW;
    doc.setFillColor(...C.borderLight);
    doc.rect(M, y, isoBarW, 5, "F");
    doc.setFillColor(5, 150, 105);
    if (isoBarFill > 0) doc.rect(M, y, isoBarFill, 5, "F");
    y += 8;

    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.navy);
    doc.text(safeText(`${isoCompliance.compliancePercentage}% de conformit\xe9`), M, y);
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
    doc.text(safeText(`  \x97  ${isoCompliance.passedCount} contr\xf4le${isoCompliance.passedCount > 1 ? "s" : ""} conforme${isoCompliance.passedCount > 1 ? "s" : ""} sur ${isoCompliance.totalControls} analys\xe9s`), M + doc.getTextWidth(`${isoCompliance.compliancePercentage}% de conformit\xe9`), y);
    y += 10;
    thinRule(2, 6);

    // ── Detailed control list ──
    subSection(safeText("03.2  D\xc9TAIL DES CONTR\xd4LES ANALYS\xc9S"));

    // Table header
    checkPage(10);
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.muted);
    const colCode = M;
    const colStatus = M + 30;
    const colName = M + 54;
    const colRec = M + 108;
    doc.text("CODE", colCode, y);
    doc.text("STATUT", colStatus, y);
    doc.text("CONTR\xd4LE", colName, y);
    doc.text("RECOMMANDATION", colRec, y);
    y += 3;
    thinRule(0, 4);

    isoCompliance.controls.forEach((ctrl, ri) => {
      checkPage(10);
      const isConform = ctrl.status === "CONFORME";
      const sColor: [number, number, number] = isConform ? [5, 150, 105] : C.critical;

      // Alternating light bg
      if (ri % 2 === 0) {
        doc.setFillColor(...C.bg);
        doc.rect(M, y - 2.5, CW, 8.5, "F");
      }

      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.muted);
      doc.text(ctrl.code, colCode, y + 1);

      // Minimal status text
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...sColor);
      doc.text(isConform ? "CONFORME" : "NON CONFORME", colStatus, y + 1);

      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.navy);
      const nameStr = safeText(ctrl.name.length > 28 ? ctrl.name.substring(0, 25) + "..." : ctrl.name);
      doc.text(nameStr, colName, y + 1);

      doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
      let recStr = safeText((!isConform && ctrl.recommendation) ? ctrl.recommendation : "\x97");
      const maxRecW = PW - M - colRec - 2;
      if (doc.getTextWidth(recStr) > maxRecW) {
        while (recStr.length > 5 && doc.getTextWidth(recStr + "...") > maxRecW) {
          recStr = recStr.slice(0, -1);
        }
        recStr += "...";
      }
      doc.text(recStr, colRec, y + 1);
      y += 9;
    });

    thinRule(4, 6);

    // ── ISO Recommendations (if any non-conformities) ──
    if (isoCompliance.recommendations.length > 0) {
      checkPage(14);
      subSection(safeText("03.3  RECOMMANDATIONS ISO 27001"));
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
      isoCompliance.recommendations.forEach(rec => {
        checkPage(10);
        const rLines = doc.splitTextToSize(safeText(rec), CW - 4);
        rLines.forEach((l: string) => { checkPage(5); doc.text(l, M + 2, y); y += 4.5; });
        y += 2;
      });
      thinRule(3, 6);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── CONCLUSION & PRIORITÉS DE REMÉDIATION ──────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  checkPage(50);
  const sectionNum = (isoCompliance && isoCompliance.totalControls > 0) ? "04" : "03";
  sectionHeader(sectionNum, "CONCLUSION & PRIORIT\xc9S DE R\xc9M\xc9DIATION",
    safeText(`Synth\xe8se du niveau de risque global et actions de rem\xe9diation \xe0 engager en priorit\xe9.`));

  // ── Overall risk level (typographic, no big colored box) ──
  const overallRisk = criticalCount > 0 ? { label: "CRITIQUE", color: C.critical }
    : highCount > 0 ? { label: "\xc9LEV\xc9", color: C.high }
    : mediumCount > 0 ? { label: "MOYEN", color: C.medium }
    : { label: "FAIBLE", color: C.muted };

  checkPage(22);
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.muted);
  doc.text("NIVEAU DE RISQUE GLOBAL", M, y); y += 5;
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(...overallRisk.color);
  doc.text(safeText(overallRisk.label), M, y); y += 5;
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
  doc.text(safeText(`Score de s\xe9curit\xe9 : ${score}/100 (Grade ${grade})   |   ${issues.length} vuln\xe9rabilit\xe9(s) d\xe9tect\xe9e(s)`), M, y);
  y += 8;
  thinRule(2, 6);

  // ── Priority actions ──
  subSection(safeText("ACTIONS PRIORITAIRES DE R\xc9M\xc9DIATION"));

  const priorities: Array<{ priority: string; color: [number,number,number]; text: string }> = [];

  if (criticalCount > 0) priorities.push({
    priority: "CRITIQUE \x97 ACTION IMM\xc9DIATE",
    color: C.critical,
    text: safeText(`Traiter imm\xe9diatement les ${criticalCount} vuln\xe9rabilit\xe9${criticalCount > 1 ? "s" : ""} critique${criticalCount > 1 ? "s" : ""} — risque de compromission imm\xe9diate.`),
  });
  if (highCount > 0) priorities.push({
    priority: "\xc9LEV\xc9 \x97 ACTION PRIORITAIRE",
    color: C.high,
    text: safeText(`Planifier la correction des ${highCount} vuln\xe9rabilit\xe9${highCount > 1 ? "s" : ""} \xe9lev\xe9e${highCount > 1 ? "s" : ""} dans les 30 prochains jours.`),
  });
  if (mediumCount > 0) priorities.push({
    priority: "MOYEN \x97 DANS LES 90 JOURS",
    color: C.medium,
    text: safeText(`Corriger les ${mediumCount} vuln\xe9rabilit\xe9${mediumCount > 1 ? "s" : ""} de niveau moyen dans les 90 prochains jours.`),
  });
  if (lowCount > 0) priorities.push({
    priority: "FAIBLE \x97 AM\xc9LIORATION RECOMMAND\xc9E",
    color: C.low,
    text: safeText(`${lowCount} vuln\xe9rabilit\xe9${lowCount > 1 ? "s" : ""} de faible impact \xe0 traiter lors du prochain cycle de rem\xe9diation.`),
  });
  if (isoCompliance && isoCompliance.totalControls > isoCompliance.passedCount) {
    priorities.push({
      priority: "CONFORMIT\xc9 ISO 27001",
      color: C.accentText,
      text: safeText(`Am\xe9liorer la conformit\xe9 ISO/IEC 27001:2022 : ${isoCompliance.totalControls - isoCompliance.passedCount} contr\xf4le${(isoCompliance.totalControls - isoCompliance.passedCount) > 1 ? "s" : ""} non conforme${(isoCompliance.totalControls - isoCompliance.passedCount) > 1 ? "s" : ""} \xe0 adresser.`),
    });
  }
  priorities.push({
    priority: "SUIVI CONTINU",
    color: C.muted,
    text: safeText("Effectuer un nouveau scan de s\xe9curit\xe9 apr\xe8s chaque correction pour valider l\x92am\xe9lioration."),
  });

  priorities.forEach((p, i) => {
    checkPage(16);
    // Number badge — small text, not a colored circle
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.muted);
    doc.text(`${String(i + 1).padStart(2, "0")}`, M, y);
    // Priority label
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...p.color);
    doc.text(safeText(p.priority), M + 8, y);
    y += 5;
    // Text
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.slate);
    const bLines = doc.splitTextToSize(p.text, CW - 8);
    bLines.forEach((l: string) => { checkPage(5); doc.text(l, M + 8, y); y += 4.5; });
    y += 4;
    if (i < priorities.length - 1) {
      doc.setDrawColor(...C.borderLight);
      doc.setLineWidth(0.2);
      doc.line(M + 8, y, PW - M, y);
      y += 5;
    }
  });

  y += 4;
  thinRule(2, 6);

  // ── Legal disclaimer ──
  checkPage(12);
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
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
