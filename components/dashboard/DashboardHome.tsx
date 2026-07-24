"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle, 
  Globe, 
  Eye, 
  Trash2, 
  Plus
} from "lucide-react";

export function DashboardHome() {
  const [scanDomain, setScanDomain] = useState("");
  
  // Mock Data for Dashboard
  const [recentScans, setRecentScans] = useState([
    { id: "1", domain: "cybelis.ma", score: 72, date: "08/07/2026 14:22", critical: 1, high: 3, medium: 2, low: 1 },
    { id: "2", domain: "hbsmanagement.com", score: 91, date: "07/07/2026 09:15", critical: 0, high: 0, medium: 1, low: 3 },
    { id: "3", domain: "ecommerce-demo.ma", score: 48, date: "05/07/2026 18:40", critical: 3, high: 2, medium: 4, low: 2 },
    { id: "4", domain: "stage-test.net", score: 85, date: "29/06/2026 11:05", critical: 0, high: 1, medium: 2, low: 0 }
  ]);

  const deleteScan = (id: string) => {
    setRecentScans(prev => prev.filter(item => item.id !== id));
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "bg-emerald-50 text-emerald-600 border border-emerald-200";
    if (score >= 70) return "bg-amber-50 text-amber-600 border border-amber-200";
    return "bg-red-50 text-red-600 border border-red-200";
  };

  // Calculate global dashboard values
  const totalScans = recentScans.length;
  const avgScore = totalScans > 0 
    ? Math.round(recentScans.reduce((acc, curr) => acc + curr.score, 0) / totalScans)
    : 0;

  const totalCritical = recentScans.reduce((acc, curr) => acc + curr.critical, 0);
  const totalHigh = recentScans.reduce((acc, curr) => acc + curr.high, 0);
  const totalMedium = recentScans.reduce((acc, curr) => acc + curr.medium, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* 1. WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tableau de Bord</h1>
          <p className="text-xs text-slate-500">Suivez la posture de sécurité de vos sites web et gérez vos audits.</p>
        </div>
        
        {/* Quick Launch scan bar */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-slate-200 shadow-sm w-full md:max-w-md">
          <Globe className="w-4 h-4 text-slate-400 ml-2.5 shrink-0" />
          <input 
            type="text" 
            placeholder="Nouveau domaine (ex: mycompany.ma)"
            value={scanDomain}
            onChange={(e) => setScanDomain(e.target.value)}
            className="bg-transparent border-0 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 w-full px-2"
          />
          <Link
            href={`/dashboard/scan?domain=${encodeURIComponent(scanDomain || "cybelis.ma")}`}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-opacity shadow-md shadow-blue-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Scanner</span>
          </Link>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Scans</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">{totalScans}</span>
            <span className="text-xs text-slate-500">analyses</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Historique complet des scans enregistrés
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Score Moyen</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">{avgScore}/100</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${avgScore >= 80 ? "bg-emerald-500" : "bg-yellow-500"}`} />
            {avgScore >= 80 ? "Indice de sécurité robuste" : "Exposition modérée"}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Failles Critiques</span>
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-600 font-mono">{totalCritical}</span>
            <span className="text-xs text-slate-500">actives</span>
          </div>
          <div className="text-[10px] text-red-500 font-mono font-medium">
            À corriger en priorité absolue !
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Niveau Moyen</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">74%</span>
            <span className="text-xs text-slate-500">conformité</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Mise en conformité générale RFC/DNS
          </div>
        </div>

      </div>

      {/* 3. SCORE GAUGE & DETAILED CATEGORY GRAPH GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Circular Gauge */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-6">
          <h3 className="text-sm font-bold text-slate-900 self-start">Santé Globale</h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="60"
                strokeWidth="10"
                stroke="rgba(15,23,42,0.05)"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="60"
                strokeWidth="10"
                stroke="#2563eb"
                strokeDasharray={377}
                strokeDashoffset={377 - (377 * avgScore) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-slate-900 font-mono">{avgScore}</span>
              <span className="text-[10px] text-slate-500 uppercase font-mono">sur 100</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 leading-normal px-4">
            Votre score de sécurité global est calculé d'après les {totalScans} derniers sites analysés.
          </div>
        </div>

        {/* Right Vulnerability breakdown bar list */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Gravité des Vulnérabilités Détectées</h3>
            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">CONSOLIDE</span>
          </div>

          <div className="space-y-4">
            
            {/* Critical */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-red-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Critique
                </span>
                <span className="text-slate-500 font-mono">{totalCritical} failles</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="bg-red-500 h-full rounded-full transition-all" 
                  style={{ width: `${Math.min(100, (totalCritical / 10) * 100)}%` }} 
                />
              </div>
            </div>

            {/* High */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-orange-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" /> Élevé
                </span>
                <span className="text-slate-500 font-mono">{totalHigh} failles</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="bg-orange-500 h-full rounded-full transition-all" 
                  style={{ width: `${Math.min(100, (totalHigh / 10) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Moyen
                </span>
                <span className="text-slate-500 font-mono">{totalMedium} failles</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all" 
                  style={{ width: `${Math.min(100, (totalMedium / 15) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Low */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-sky-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" /> Faible
                </span>
                <span className="text-slate-500 font-mono">6 failles</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="bg-sky-400 h-full rounded-full transition-all" 
                  style={{ width: "40%" }} 
                />
              </div>
            </div>

          </div>

          <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-4 flex items-center justify-between">
            <span>Données consolidées d'après votre historique de scans</span>
            <Link href="/dashboard/history" className="text-blue-600 hover:underline font-semibold">Consulter l'historique →</Link>
          </div>
        </div>

      </div>

      {/* 4. RECENT SCANS TABLE */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Analyses Récentes</h3>
            <p className="text-[10px] text-slate-500">Liste des derniers scans et scores associés.</p>
          </div>
          <Link
            href="/dashboard/scan"
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-sm"
          >
            Lancer un scan complet
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentScans.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-mono text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="pb-3.5 font-semibold">Domaine</th>
                  <th className="pb-3.5 font-semibold">Date de scan</th>
                  <th className="pb-3.5 font-semibold">Score</th>
                  <th className="pb-3.5 font-semibold">Catégories de failles</th>
                  <th className="pb-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="group hover:bg-slate-50">
                    <td className="py-4 font-semibold text-slate-900 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span>{scan.domain}</span>
                    </td>
                    <td className="py-4 text-slate-500 font-mono">{scan.date}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${getScoreBadge(scan.score)}`}>
                        {scan.score}%
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                        {scan.critical > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
                            {scan.critical} Crit.
                          </span>
                        )}
                        {scan.high > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-100">
                            {scan.high} Élev.
                          </span>
                        )}
                        {scan.medium > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">
                            {scan.medium} Moy.
                          </span>
                        )}
                        {scan.critical === 0 && scan.high === 0 && scan.medium === 0 && (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Sécurisé
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/dashboard/reports/${scan.domain}`}
                          className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-600 border border-slate-200 transition-colors shadow-sm"
                          title="Consulter le rapport"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => deleteScan(scan.id)}
                          className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 transition-colors shadow-sm"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              Aucun scan récent. Utilisez la barre ci-dessus pour auditer un site web.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
