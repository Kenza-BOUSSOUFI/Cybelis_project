"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  History,
  Globe,
  Eye,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  Loader2,
  Plus,
  AlertCircle,
  MoreHorizontal,
  TrendingUp,
  Download
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";

interface HistoryScanItem {
  id: string;
  domain: string;
  url: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  type: "FULL" | "CUSTOM";
  date: string;
  finishedAt: string | null;
  duration: number;
  score: number;
  grade: string;
  riskLevel: string;
  critical: number;
  high: number;
  medium: number;
}

type SortField = "domain" | "score" | "date" | "status";
type SortDir = "asc" | "desc";

const getScoreStyle = (score: number, status: string) => {
  if (status !== "COMPLETED") return "text-slate-400 font-mono text-xs";
  if (score >= 90) return "text-emerald-600 font-mono font-semibold text-xs";
  if (score >= 70) return "text-amber-600 font-mono font-semibold text-xs";
  return "text-red-600 font-mono font-semibold text-xs";
};

const renderStatusIndicator = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return <span className="text-xs font-medium text-emerald-700">Terminé</span>;
    case "RUNNING":
      return <span className="text-xs font-medium text-amber-700 animate-pulse">En cours</span>;
    case "PENDING":
      return <span className="text-xs font-medium text-slate-600">En attente</span>;
    case "FAILED":
      return <span className="text-xs font-medium text-red-700">Échoué</span>;
    default:
      return <span className="text-xs font-medium text-slate-600">{status}</span>;
  }
};

export default function HistoryPage() {
  const router = useRouter();
  const [scans, setScans] = useState<HistoryScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterScore, setFilterScore] = useState<"all" | "good" | "medium" | "bad">("all");
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: "date", dir: "desc" });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/scans");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setScans(json.data);
        } else {
          setError(json.error || "Impossible de charger l'historique.");
        }
      } catch {
        setError("Erreur de connexion lors du chargement de l'historique.");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

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
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  const handleDelete = async (id: string) => {
    setOpenMenuId(null);
    if (!confirm("Voulez-vous vraiment supprimer cet enregistrement de scan ?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/scans/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        setScans((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert(json.error || "Échec de la suppression.");
      }
    } catch {
      alert("Erreur de réseau lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportPDF = async (scanId: string) => {
    setOpenMenuId(null);
    try {
      const res = await fetch(`/api/scans/${scanId}`);
      if (!res.ok) {
        alert("Impossible de récupérer les données du rapport.");
        return;
      }
      const json = await res.json();
      if (!json.success || !json.data) {
        alert("Données de rapport invalides.");
        return;
      }
      const scanData = json.data;
      const [
        { getOwaspMapping },
        { fetchCveForFinding },
        { calculateIso27001Compliance },
        { generateClarveonPDF },
      ] = await Promise.all([
        import("@/lib/enrichment/owasp"),
        import("@/lib/enrichment/cve"),
        import("@/lib/enrichment/iso27001"),
        import("@/lib/pdf/generateReport"),
      ]);

      const isoCompliance = calculateIso27001Compliance(scanData.results || []);
      const issues: any[] = [];
      for (const result of scanData.results || []) {
        const toolSlug = result.tool.slug;
        let category: "website" | "email" | "dns" = "website";
        if (result.tool.category === "EMAIL_SECURITY") category = "email";
        else if (result.tool.category === "DNS_DOMAIN_SECURITY") category = "dns";

        const recs = result.recommendations && result.recommendations.length > 0
          ? result.recommendations
          : (result.status === "FAIL" || result.status === "WARNING") ? [null] : [];

        for (const rec of recs) {
          let severity: "critical" | "high" | "medium" | "low" = "low";
          const sev = ((rec?.priority || result.severity) ?? "").toLowerCase();
          if (sev === "critical") severity = "critical";
          else if (sev === "high") severity = "high";
          else if (sev === "medium") severity = "medium";

          const owasp = getOwaspMapping(result.result);
          const cve = await fetchCveForFinding(result.result);

          issues.push({
            id: rec?.id ?? result.id,
            category,
            tool: result.tool.name,
            toolSlug,
            title: rec?.title ?? `Alerte de sécurité : ${result.tool.name}`,
            severity,
            description: rec?.description ?? `Le module ${result.tool.name} a détecté une anomalie.`,
            impact: "Risque d'exposition des données.",
            fix: "Vérifiez la configuration du module.",
            resolved: false,
            owasp,
            cve,
          });
        }
      }

      await generateClarveonPDF(
        {
          website: { domain: scanData.website.domain },
          createdAt: scanData.createdAt,
          securityScore: scanData.securityScore,
        },
        issues,
        isoCompliance
      );
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Erreur lors de la génération du PDF.");
    }
  };

  const filtered = useMemo(() => {
    return scans
      .filter((s) => s.domain.toLowerCase().includes(search.toLowerCase().trim()))
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
        else if (sort.field === "status") diff = a.status.localeCompare(b.status);
        return sort.dir === "asc" ? diff : -diff;
      });
  }, [scans, search, filterScore, sort]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderFindings = (scan: HistoryScanItem) => {
    if (scan.status !== "COMPLETED") {
      return <span className="text-slate-400 font-mono text-xs">—</span>;
    }

    const findings: React.ReactNode[] = [];
    if (scan.critical > 0) {
      findings.push(
        <span key="crit" className="text-red-700 font-semibold">
          {scan.critical} critique{scan.critical > 1 ? "s" : ""}
        </span>
      );
    }
    if (scan.high > 0) {
      findings.push(
        <span key="high" className="text-amber-700 font-semibold">
          {scan.high} élevée{scan.high > 1 ? "s" : ""}
        </span>
      );
    }
    if (scan.medium > 0) {
      findings.push(
        <span key="med" className="text-amber-600 font-medium">
          {scan.medium} moyenne{scan.medium > 1 ? "s" : ""}
        </span>
      );
    }

    if (findings.length === 0) {
      return <span className="text-emerald-600 font-medium text-xs">✓ Sécurisé</span>;
    }

    return (
      <div className="flex items-center gap-1.5 text-xs">
        {findings.map((f, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-slate-300">•</span>}
            {f}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
      {/* Click overlay to close menu */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setOpenMenuId(null)}
        />
      )}

      {/* 1. PAGE HEADER */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400 shrink-0" />
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Historique des scans</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {scans.length} analyse{scans.length > 1 ? "s" : ""} enregistrée{scans.length > 1 ? "s" : ""} au total.
          </p>
        </div>

        <Link
          href="/dashboard/scan"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau scan</span>
        </Link>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 h-10.5 px-3.5 rounded-lg bg-white border border-slate-200 focus-within:border-blue-500 transition-colors">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un domaine..."
            className="bg-transparent border-0 text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2 h-10.5 px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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

      {/* 3. MAIN TABLE CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs font-medium text-slate-500">Chargement de l'historique...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-900">Erreur de chargement</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="Aucun scan trouvé"
            description={scans.length === 0 ? "Vous n'avez pas encore effectué de scan." : "Aucun résultat ne correspond à vos filtres."}
            actionLabel="Lancer un scan"
            actionHref="/dashboard/scan"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">
                    <button className="flex items-center gap-1 font-semibold hover:text-slate-900 transition-colors" onClick={() => toggleSort("domain")}>
                      Domaine <SortIcon field="domain" />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button className="flex items-center gap-1 font-semibold hover:text-slate-900 transition-colors" onClick={() => toggleSort("status")}>
                      Statut <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button className="flex items-center gap-1 font-semibold hover:text-slate-900 transition-colors" onClick={() => toggleSort("date")}>
                      Date <SortIcon field="date" />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button className="flex items-center gap-1 font-semibold hover:text-slate-900 transition-colors" onClick={() => toggleSort("score")}>
                      Score <SortIcon field="score" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">Failles</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                {filtered.map((scan) => {
                  const isMenuOpen = openMenuId === scan.id;

                  return (
                    <tr key={scan.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{scan.domain}</div>
                            <div className="text-xs text-slate-500">
                              {scan.type === "FULL" ? "Audit complet" : "Audit personnalisé"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusIndicator(scan.status)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                        {formatDate(scan.date)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {scan.status === "COMPLETED" ? (
                          <span className={getScoreStyle(scan.score, scan.status)}>
                            {scan.score}% {scan.grade}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderFindings(scan)}
                      </td>

                      <td className="py-3.5 px-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/reports/${scan.id}`}
                            className="p-1.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Consulter le rapport"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleDelete(scan.id)}
                            disabled={deletingId === scan.id}
                            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Supprimer l'enregistrement"
                          >
                            {deletingId === scan.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
