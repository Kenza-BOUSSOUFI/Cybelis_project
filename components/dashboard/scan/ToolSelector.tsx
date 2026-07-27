"use client";

import React, { useEffect, useState } from "react";
import { Loader2, ShieldCheck, MailWarning, Server, CheckSquare, Square } from "lucide-react";

interface SecurityTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: "WEBSITE_SECURITY" | "EMAIL_SECURITY" | "DNS_DOMAIN_SECURITY";
  displayOrder: number;
}

interface ToolSelectorProps {
  selectedSlugs: string[];
  onChange: (slugs: string[]) => void;
}

const CATEGORY_META = {
  WEBSITE_SECURITY: {
    label: "Sécurité du Site Web",
    Icon: ShieldCheck,
    activeItem: "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20",
    badge: "bg-blue-50 text-blue-600 border border-blue-200",
    iconColor: "text-blue-600 bg-blue-50 border border-blue-100",
  },
  EMAIL_SECURITY: {
    label: "Sécurité Email",
    Icon: MailWarning,
    activeItem: "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20",
    badge: "bg-blue-50 text-blue-600 border border-blue-200",
    iconColor: "text-blue-600 bg-blue-50 border border-blue-100",
  },
  DNS_DOMAIN_SECURITY: {
    label: "DNS & Domaine",
    Icon: Server,
    activeItem: "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20",
    badge: "bg-blue-50 text-blue-600 border border-blue-200",
    iconColor: "text-blue-600 bg-blue-50 border border-blue-100",
  },
} as const;

export function ToolSelector({ selectedSlugs, onChange }: ToolSelectorProps) {
  const [tools, setTools] = useState<SecurityTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTools() {
      try {
        const res = await fetch("/api/security-tools");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) setTools(json.data);
        else setError(json.error || "Impossible de charger les outils.");
      } catch {
        setError("Erreur de communication avec l'API.");
      } finally {
        setLoading(false);
      }
    }
    fetchTools();
  }, []);

  const toggle = (slug: string) =>
    onChange(selectedSlugs.includes(slug)
      ? selectedSlugs.filter(s => s !== slug)
      : [...selectedSlugs, slug]);

  const toggleCategory = (cat: SecurityTool["category"]) => {
    const slugs = tools.filter(t => t.category === cat).map(t => t.slug);
    const allOn = slugs.every(s => selectedSlugs.includes(s));
    if (allOn) onChange(selectedSlugs.filter(s => !slugs.includes(s)));
    else onChange([...selectedSlugs.filter(s => !slugs.includes(s)), ...slugs]);
  };

  if (loading) {
    return (
      <div className="py-6 flex flex-col items-center gap-2">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        <span className="text-xs text-slate-500">Chargement des modules…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-600 text-center">
        {error}
      </div>
    );
  }

  const grouped = tools.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<SecurityTool["category"], SecurityTool[]>);

  const categories = Object.keys(CATEGORY_META) as SecurityTool["category"][];

  return (
    <div className="space-y-5">
      {selectedSlugs.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          <span><span className="font-bold text-slate-900">{selectedSlugs.length}</span> module(s) sélectionné(s)</span>
        </div>
      )}

      {categories.map(cat => {
        const catTools = grouped[cat] ?? [];
        if (catTools.length === 0) return null;

        const meta = CATEGORY_META[cat];
        const CatIcon = meta.Icon;
        const selectedCount = catTools.filter(t => selectedSlugs.includes(t.slug)).length;
        const allSelected = selectedCount === catTools.length;

        return (
          <div key={cat} className="space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-lg ${meta.iconColor}`}>
                  <CatIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">{meta.label}</span>
                {selectedCount > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>
                    {selectedCount}/{catTools.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {catTools.map(tool => {
                const active = selectedSlugs.includes(tool.slug);
                return (
                  <button
                    key={tool.slug}
                    type="button"
                    onClick={() => toggle(tool.slug)}
                    className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all ${
                      active
                        ? meta.activeItem
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {active ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </div>

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className={`text-xs font-bold transition-colors ${active ? "text-blue-900" : "text-slate-900"}`}>
                        {tool.name}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
