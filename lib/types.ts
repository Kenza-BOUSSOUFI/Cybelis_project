// lib/types.ts
// Central TypeScript interfaces — ready to be replaced by Prisma-generated types

export type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";

export type ScanStatus = "pending" | "running" | "completed" | "failed";

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  category: string;
  remediation: string;
}

export interface ScanRecord {
  id: string;
  domain: string;
  score: number;
  status: ScanStatus;
  date: string; // ISO string — will come from Prisma DateTime
  duration: number; // seconds
  critical: number;
  high: number;
  medium: number;
  low: number;
  vulnerabilities: Vulnerability[];
  modules: string[];
}

export type ReportStatus = "ready" | "generating" | "failed";

export interface Report {
  id: string;
  scanId: string;
  domain: string;
  score: number;
  status: ReportStatus;
  createdAt: string;
  summary: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface Notification {
  id: number;
  title: string;
  text: string;
  time: string;
  read: boolean;
  type: "alert" | "info" | "success";
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "active" | "beta" | "coming_soon";
  icon: string; // lucide icon name — resolved at render time
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  plan: string;
  joinedAt: string;
}
