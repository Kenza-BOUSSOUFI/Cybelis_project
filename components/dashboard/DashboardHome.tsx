"use client";

import React, { useState, useEffect } from "react";
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
  Plus,
  ArrowRight
} from "lucide-react";
import { LoadingState } from "@/components/dashboard/ui/LoadingState";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { toast } from "sonner";
import axios from "axios";

interface RecentScan {
  id: string;
  domain: string;
  score: number;
  date: string;
  status: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface DashboardData {
  totalScans: number;
  avgScore: number;
  totalCritical: number;
  totalHigh: number;
  totalMedium: number;
  totalLow: number;
  recentScans: RecentScan[];
  plan: string;
}

export function DashboardHome() {
  const [scanDomain, setScanDomain] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get<DashboardData>('/api/dashboard');
        setData(response.data);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        toast.error("Impossible de charger le tableau de bord");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const deleteScan = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce scan ?")) return;
    try {
      await axios.delete(`/api/scans/${id}`);
      if (data) {
        setData({
          ...data,
          recentScans: data.recentScans.filter(item => item.id !== id)
        });
      }
      toast.success("Scan supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingState message="Chargement des données du tableau de bord..." />;
  }

  if (!data) {
    return (
      <EmptyState
        icon={Activity}
        title="Erreur de chargement"
        description="Veuillez rafraîchir la page."
      />
    );
  }

  const { totalScans, avgScore, totalCritical, totalHigh, totalMedium, totalLow, recentScans } = data;
  const totalVulnerabilities = totalCritical + totalHigh + totalMedium + totalLow;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* 1. HEADER & QUICK ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-lg font-bold text-[#0f172a] tracking-tight">Tableau de Bord</h1>
          <p className="text-xs text-slate-500">Vue d'ensemble de la posture de sécurité et des audits récents.</p>
        </div>

        {/* Quick Launch scan bar */}
        <div className="flex items-center gap-2 p-1 rounded-md bg-white border border-slate-200 shadow-sm w-full md:max-w-md focus-within:border-slate-400 transition-colors">
          <Globe className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
          <input
            type="text"
            placeholder="Nouveau domaine (ex: entreprise.ma)"
            value={scanDomain}
            onChange={(e) => setScanDomain(e.target.value)}
            className="bg-transparent border-0 text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full px-1"
          />
          <Link
            href={`/dashboard/scan?domain=${encodeURIComponent(scanDomain || "clarveon.ma")}`}
            className="px-3.5 py-1.5 rounded bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lancer l'audit</span>
          </Link>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Scans Card */}
        <div className="p-4 rounded-md bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono font-medium uppercase tracking-wider">Total Scans</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0f172a] font-mono">{totalScans}</span>
            <span className="text-xs text-slate-500">analyses</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Audits passifs enregistrés
          </div>
        </div>

        {/* Score Moyen Card */}
        <div className="p-4 rounded-md bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono font-medium uppercase tracking-wider">Score Moyen</span>
            <Shield className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0f172a] font-mono">{avgScore}/100</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${avgScore >= 80 ? "bg-emerald-600" : "bg-amber-600"}`} />
            <span>{avgScore >= 80 ? "Niveau de sécurité satisfaisant" : "Niveau nécessitant attention"}</span>
          </div>
        </div>

        {/* Failles Critiques Card */}
        <div className="p-4 rounded-md bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono font-medium uppercase tracking-wider">Failles Critiques</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0f172a] font-mono">{totalCritical}</span>
            <span className="text-xs text-slate-500">actives</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Alertes haute priorité
          </div>
        </div>

        {/* Niveau Moyen Card */}
        <div className="p-4 rounded-md bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono font-medium uppercase tracking-wider">Évaluation Global</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0f172a] font-mono">
              {totalScans > 0 && avgScore >= 70 ? "Conforme" : totalScans === 0 ? "N/A" : "Attention"}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Posture globale RFC & DNS
          </div>
        </div>

      </div>

      {/* 3. SCORE GAUGE & DETAILED CATEGORY GRAPH GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left Circular Gauge */}
        <div className="lg:col-span-1 p-5 rounded-md bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-4">
          <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider font-mono self-start">Indice de Sécurité</h3>

          <div className="relative w-32 h-32 flex items-center justify-center my-1">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                strokeWidth="7"
                stroke="#e2e8f0"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                strokeWidth="7"
                stroke="#0f172a"
                strokeDasharray={326}
                strokeDashoffset={326 - (326 * avgScore) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-[#0f172a] font-mono">{avgScore}</span>
              <span className="text-[9px] text-slate-400 uppercase font-mono font-medium">sur 100</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 leading-normal px-2">
            Score consolidé calculé à partir de vos {totalScans} derniers audits.
          </div>
        </div>

        {/* Right Vulnerability breakdown bar list */}
        <div className="lg:col-span-2 p-5 rounded-md bg-white border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider font-mono">Répartition des Vulnérabilités</h3>
            <span className="text-[9px] font-mono font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
              ANALYSE PASSSIVE
            </span>
          </div>

          <div className="space-y-3">

            {/* Critical */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> Critique
                </span>
                <span className="text-slate-500 font-mono text-[11px]">{totalCritical}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="bg-slate-800 h-full rounded-full transition-all"
                  style={{ width: `${totalVulnerabilities > 0 ? (totalCritical / totalVulnerabilities) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* High */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> Élevé
                </span>
                <span className="text-slate-500 font-mono text-[11px]">{totalHigh}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="bg-slate-600 h-full rounded-full transition-all"
                  style={{ width: `${totalVulnerabilities > 0 ? (totalHigh / totalVulnerabilities) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Moyen
                </span>
                <span className="text-slate-500 font-mono text-[11px]">{totalMedium}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="bg-slate-400 h-full rounded-full transition-all"
                  style={{ width: `${totalVulnerabilities > 0 ? (totalMedium / totalVulnerabilities) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Low */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Faible
                </span>
                <span className="text-slate-500 font-mono text-[11px]">{totalLow}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="bg-slate-300 h-full rounded-full transition-all"
                  style={{ width: `${totalVulnerabilities > 0 ? (totalLow / totalVulnerabilities) * 100 : 0}%` }}
                />
              </div>
            </div>

          </div>

          <div className="text-[10.5px] text-slate-500 border-t border-slate-100 pt-3 flex items-center justify-between">
            <span>Données consolidées du système d'analyse Clarveon</span>
            <Link href="/dashboard/history" className="text-slate-900 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors">
              <span>Voir tout l'historique</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* 4. RECENT SCANS TABLE */}
      <div className="p-5 rounded-md bg-white border border-slate-200 shadow-sm space-y-4">

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider font-mono">Analyses Récentes</h3>
            <p className="text-[10.5px] text-slate-500 mt-0.5">Historique et rapports d'audit récents.</p>
          </div>
          <Link
            href="/dashboard/scan"
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
          >
            Lancer un nouveau scan
          </Link>
        </div>

        <div className="rounded-md border border-slate-200 overflow-hidden">
          {recentScans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="text-[10px] font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Domaine</th>
                    <th className="px-4 py-2.5 font-semibold">Date de scan</th>
                    <th className="px-4 py-2.5 font-semibold">Score</th>
                    <th className="px-4 py-2.5 font-semibold">Failles détectées</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#0f172a] flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>{scan.domain}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{formatDate(scan.date)}</td>
                      <td className="px-4 py-3">
                        {scan.status === "COMPLETED" ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-900 text-[10px] font-mono font-semibold">
                            {scan.score}%
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono font-semibold">
                            {scan.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {scan.status === "COMPLETED" ? (
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600">
                            {scan.critical > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> {scan.critical} Crit.
                              </span>
                            )}
                            {scan.high > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> {scan.high} Élev.
                              </span>
                            )}
                            {scan.medium > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> {scan.medium} Moy.
                              </span>
                            )}
                            {scan.critical === 0 && scan.high === 0 && scan.medium === 0 && (
                              <span className="text-slate-700 font-medium flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Conforme
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">En cours...</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {scan.status === "COMPLETED" && (
                            <Link
                              href={`/dashboard/reports/${scan.id}`}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Consulter le rapport"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          <button
                            onClick={() => deleteScan(scan.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
