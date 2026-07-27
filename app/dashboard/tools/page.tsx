"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Sliders, ShieldCheck, Mail, Server, Lock, Globe, ArrowRight,
  Search, CheckCircle2, Loader2, AlertCircle, FileText, Cpu, Zap
} from "lucide-react";

interface SecurityTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: "WEBSITE_SECURITY" | "EMAIL_SECURITY" | "DNS_DOMAIN_SECURITY";
  displayOrder: number;
  isActive: boolean;
}

const CATEGORY_META = {
  WEBSITE_SECURITY: {
    label: "Sécurité du Site Web",
    description: "Analyse du chiffrement SSL/TLS, en-têtes HTTP, cookies, CORS, CSP et méthodes réseau.",
    Icon: ShieldCheck,
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  EMAIL_SECURITY: {
    label: "Sécurité Messagerie & Email",
    description: "Audit des protocoles d'authentification e-mail (SPF, DKIM, DMARC) contre le spoofing.",
    Icon: Mail,
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  DNS_DOMAIN_SECURITY: {
    label: "DNS & Domaine",
    description: "Inspection de la résolution DNS globale et de la configuration de domaine.",
    Icon: Server,
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
} as const;

export default function ToolsPage() {
  const [tools, setTools] = useState<SecurityTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  useEffect(() => {
    async function fetchTools() {
      try {
        const res = await fetch("/api/security-tools");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTools(json.data);
        } else {
          setError(json.error || "Impossible de charger le catalogue d'outils.");
        }
      } catch {
        setError("Erreur de connexion lors du chargement des outils.");
      } finally {
        setLoading(false);
      }
    }

    fetchTools();
  }, []);

  const filteredTools = useMemo(() => {
    return tools
      .filter((t) => {
        if (activeCategory !== "ALL" && t.category !== activeCategory) return false;
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
        }
        return true;
      });
  }, [tools, search, activeCategory]);

  const categories = Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Catalogue des Outils de Sécurité</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Explorez les {tools.length || 16} modules d'analyse automatisée intégrés au moteur Cybelis.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/scan"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-blue-600/15"
        >
          <Zap className="w-4 h-4 fill-white" />
          Lancer un scan complet
        </Link>
      </div>

      {/* ── Filters & Search ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm focus-within:border-blue-500 transition-colors">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un outil par nom ou description…"
            className="bg-transparent border-0 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 w-full"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tous ({tools.length})
          </button>
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const count = tools.filter((t) => t.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content Grid ───────────────────────────────────── */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs font-medium text-slate-500">Chargement du catalogue d'outils…</p>
        </div>
      ) : error ? (
        <div className="py-12 p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-bold text-slate-900">Erreur de chargement</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-3">
          <Search className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-900">Aucun outil trouvé</p>
          <p className="text-xs text-slate-500">Aucun module de sécurité ne correspond à votre recherche "{search}".</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            const catTools = filteredTools.filter((t) => t.category === category);
            if (catTools.length === 0) return null;

            const meta = CATEGORY_META[category];
            const CategoryIcon = meta.Icon;

            return (
              <div key={category} className="space-y-4">
                {/* Category Title Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{meta.label}</h2>
                      <p className="text-[11px] text-slate-500">{meta.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {catTools.length} outil{catTools.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between gap-4 transition-all hover:shadow-md hover:border-slate-300 group"
                    >
                      {/* Tool Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-blue-600 flex items-center justify-center font-mono font-bold text-xs shrink-0 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Actif
                        </span>
                      </div>

                      {/* Tool Content */}
                      <div className="space-y-1 flex-1">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      {/* Footer Action */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-mono font-medium text-slate-400">
                          slug: {tool.slug}
                        </span>
                        <Link
                          href="/dashboard/scan"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Lancer <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
