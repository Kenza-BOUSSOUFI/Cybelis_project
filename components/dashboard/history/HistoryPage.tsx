"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Globe, Search, RefreshCw, Eye, Trash2, Calendar, CheckCircle } from "lucide-react";

export function ScanHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [scans, setScans] = useState([
    { id: "1", domain: "cybelis.ma", score: 72, date: "08/07/2026 14:22", critical: 1, high: 3, medium: 2, low: 1 },
    { id: "2", domain: "hbsmanagement.com", score: 91, date: "07/07/2026 09:15", critical: 0, high: 0, medium: 1, low: 3 },
    { id: "3", domain: "ecommerce-demo.ma", score: 48, date: "05/07/2026 18:40", critical: 3, high: 2, medium: 4, low: 2 },
    { id: "4", domain: "stage-test.net", score: 85, date: "29/06/2026 11:05", critical: 0, high: 1, medium: 2, low: 0 },
    { id: "5", domain: "client-portfolio.com", score: 95, date: "25/06/2026 16:30", critical: 0, high: 0, medium: 0, low: 2 }
  ]);

  const deleteScan = (id: string) => {
    setScans(prev => prev.filter(item => item.id !== id));
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (score >= 70) return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
    return "bg-red-500/10 text-red-400 border border-red-500/20";
  };

  const filteredScans = scans.filter(scan => 
    scan.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Historique des Analyses</h1>
          <p className="text-xs text-neutral-400">Consultez l'ensemble des scans réalisés et suivez l'évolution de vos scores.</p>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 w-full md:max-w-xs">
          <Search className="w-4 h-4 text-neutral-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Rechercher un domaine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-0 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-0 w-full px-2"
          />
        </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="p-6 rounded-3xl bg-neutral-900/40 border border-neutral-900">
        
        <div className="overflow-x-auto">
          {filteredScans.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-mono text-neutral-500 uppercase border-b border-neutral-800/80">
                <tr>
                  <th className="pb-3.5 font-semibold">Domaine</th>
                  <th className="pb-3.5 font-semibold">Date d'audit</th>
                  <th className="pb-3.5 font-semibold">Score obtenu</th>
                  <th className="pb-3.5 font-semibold">Synthèse des failles</th>
                  <th className="pb-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-neutral-300">
                {filteredScans.map((scan) => (
                  <tr key={scan.id} className="group hover:bg-neutral-900/10">
                    <td className="py-4 font-semibold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-neutral-500" />
                      <span>{scan.domain}</span>
                    </td>
                    <td className="py-4 text-neutral-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{scan.date}</span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${getScoreBadge(scan.score)}`}>
                        {scan.score}%
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                        {scan.critical > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/10">
                            {scan.critical} Crit.
                          </span>
                        )}
                        {scan.high > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/10">
                            {scan.high} Élev.
                          </span>
                        )}
                        {scan.medium > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/10">
                            {scan.medium} Moy.
                          </span>
                        )}
                        {scan.critical === 0 && scan.high === 0 && scan.medium === 0 && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Sécurisé
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/dashboard/reports/${scan.domain}`}
                          className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-850 transition-colors"
                          title="Voir le rapport"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link 
                          href={`/dashboard/scan?domain=${scan.domain}`}
                          className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-850 transition-colors"
                          title="Re-scanner"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => deleteScan(scan.id)}
                          className="p-1.5 rounded-lg bg-neutral-950 hover:bg-red-500/10 text-neutral-400 hover:text-red-500 border border-neutral-850 transition-colors"
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
            <div className="text-center py-12 text-neutral-500 text-xs">
              Aucune analyse enregistrée ne correspond à votre recherche "{searchTerm}".
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
