"use client";

import React from "react";
import Link from "next/link";
import { User, Globe, Calendar, Shield, Mail, ArrowRight, Activity } from "lucide-react";
import { MOCK_USER, MOCK_SCANS } from "@/lib/mock-data";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

const scoreBadge = (score: number) => {
  if (score >= 90) return "bg-emerald-50 text-emerald-600 border border-emerald-200";
  if (score >= 70) return "bg-amber-50 text-amber-600 border border-amber-200";
  return "bg-red-50 text-red-600 border border-red-200";
};

export default function ProfilePage() {
  const recentScans = MOCK_SCANS.slice(0, 4);
  const totalScans = MOCK_SCANS.length;
  const avgScore = Math.round(MOCK_SCANS.reduce((a, s) => a + s.score, 0) / MOCK_SCANS.length);
  const criticalTotal = MOCK_SCANS.reduce((a, s) => a + s.critical, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mon Profil</h1>
          <p className="text-xs text-slate-500 mt-0.5">Vos informations personnelles et votre activité.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Profile card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-2xl font-extrabold text-white shadow-lg shadow-blue-500/20">
            {MOCK_USER.initials}
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">{MOCK_USER.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{MOCK_USER.role}</p>
          </div>

          <div className="w-full space-y-2.5">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-600 truncate">{MOCK_USER.email}</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-600">Membre depuis {formatDate(MOCK_USER.joinedAt)}</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-left">
              <Shield className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-xs font-bold text-blue-700">Plan {MOCK_USER.plan}</span>
            </div>
          </div>

          <Link
            href="/dashboard/settings"
            className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            Modifier le profil <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Activity panel */}
        <div className="lg:col-span-2 space-y-5">

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Scans effectués", value: totalScans, icon: Activity, color: "text-blue-600" },
              { label: "Score moyen", value: `${avgScore}/100`, icon: Shield, color: "text-purple-600" },
              { label: "Failles critiques", value: criticalTotal, icon: Globe, color: "text-red-500" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</span>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">{value}</div>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Activité récente</h3>
              <Link href="/dashboard/history" className="text-[11px] text-blue-600 hover:underline font-medium">
                Voir tout →
              </Link>
            </div>

            <div className="space-y-2">
              {recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">{scan.domain}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(scan.date).toLocaleDateString("fr-FR")} · {scan.duration}s
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${scoreBadge(scan.score)}`}>
                    {scan.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
