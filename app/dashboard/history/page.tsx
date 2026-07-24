"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { History, Globe, Eye, Trash2, Search, ChevronUp, ChevronDown, Filter } from "lucide-react";
import { MOCK_SCANS } from "@/lib/mock-data";
import type { ScanRecord } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";

type SortField = "domain" | "score" | "date" | "critical";
type SortDir = "asc" | "desc";

const scoreBadge = (score: number) => {
  if (score >= 90) return "bg-emerald-50 text-emerald-600 border border-emerald-200";
  if (score >= 70) return "bg-amber-50 text-amber-600 border border-amber-200";
  return "bg-red-50 text-red-600 border border-red-200";
};

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanRecord[]>(MOCK_SCANS);
  const [search, setSearch] = useState("");
  const [filterScore, setFilterScore] = useState<"all" | "good" | "medium" | "bad">("all");
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: "date", dir: "desc" });

  const toggleSort = (field: SortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "desc" }
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ChevronDown className="w-3 h-3 text-slate-300" />;
    return sort.dir === "asc"
      ? <ChevronUp className="w-3 h-3 text-blue-500" />
      : <ChevronDown className="w-3 h-3 text-blue-500" />;
  };

  const filtered = useMemo(() => {
    return scans
      .filter((s) => s.domain.toLowerCase().includes(search.toLowerCase()))
      .filter((s) => {
        if (filterScore === "good") return s.score >= 80;
        if (filterScore === "medium") return s.score >= 60 && s.score < 80;
        if (filterScore === "bad") return s.score < 60;
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sort.field === "domain") diff = a.domain.localeCompare(b.domain);
        else if (sort.field === "score") diff = a.score - b.score;
        else if (sort.field === "date") diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        else if (sort.field === "critical") diff = a.critical - b.critical;
        return sort.dir === "asc" ? diff : -diff;
      });
  }, [scans, search, filterScore, sort]);

  const deleteScan = (id: string) => setScans((prev) => prev.filter((s) => s.id !== id));

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Historique des Scans</h1>
          <p className="text-xs text-slate-500 mt-0.5">{scans.length} analyses enregistrées au total.</p>
        </div>
        <Link
          href="/dashboard/scan"
          className="ml-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-blue-600/15"
        >
          + Nouveau scan
        </Link>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un domaine…"
            className="bg-transparent border-0 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 w-full"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterScore}
            onChange={(e) => setFilterScore(e.target.value as typeof filterScore)}
            className="bg-transparent border-0 text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Tous les scores</option>
            <option value="good">Bon (≥ 80)</option>
            <option value="medium">Moyen (60–79)</option>
            <option value="bad">Faible (&lt; 60)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="Aucun scan trouvé"
            description="Aucun résultat ne correspond à vos filtres."
            actionLabel="Lancer un scan"
            actionHref="/dashboard/scan"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-mono text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="pb-3.5">
                    <button className="flex items-center gap-1 font-semibold hover:text-blue-600" onClick={() => toggleSort("domain")}>
                      Domaine <SortIcon field="domain" />
                    </button>
                  </th>
                  <th className="pb-3.5">
                    <button className="flex items-center gap-1 font-semibold hover:text-blue-600" onClick={() => toggleSort("date")}>
                      Date <SortIcon field="date" />
                    </button>
                  </th>
                  <th className="pb-3.5">
                    <button className="flex items-center gap-1 font-semibold hover:text-blue-600" onClick={() => toggleSort("score")}>
                      Score <SortIcon field="score" />
                    </button>
                  </th>
                  <th className="pb-3.5 font-semibold">Durée</th>
                  <th className="pb-3.5">
                    <button className="flex items-center gap-1 font-semibold hover:text-blue-600" onClick={() => toggleSort("critical")}>
                      Failles <SortIcon field="critical" />
                    </button>
                  </th>
                  <th className="pb-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filtered.map((scan) => (
                  <tr key={scan.id} className="group hover:bg-slate-50/60">
                    <td className="py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                        {scan.domain}
                      </div>
                    </td>
                    <td className="py-4 text-slate-500 font-mono whitespace-nowrap">{formatDate(scan.date)}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-lg font-mono font-bold ${scoreBadge(scan.score)}`}>
                        {scan.score}%
                      </span>
                    </td>
                    <td className="py-4 text-slate-500 font-mono">{scan.duration}s</td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold flex-wrap">
                        {scan.critical > 0 && <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">{scan.critical} Crit.</span>}
                        {scan.high > 0 && <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-100">{scan.high} Élev.</span>}
                        {scan.medium > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">{scan.medium} Moy.</span>}
                        {scan.critical === 0 && scan.high === 0 && scan.medium === 0 && (
                          <span className="text-emerald-500 font-semibold">✓ Sécurisé</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/reports?scan=${scan.id}`}
                          className="p-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 border border-slate-200 transition-colors shadow-sm"
                          title="Voir le rapport"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteScan(scan.id)}
                          className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 transition-colors shadow-sm"
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

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{filtered.length} résultat{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}</span>
              <span>Données mock — à connecter avec Prisma</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
