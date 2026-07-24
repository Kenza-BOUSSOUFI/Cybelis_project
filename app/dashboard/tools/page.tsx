"use client";

import React from "react";
import { Sliders, Lock, Globe, Shield, ArrowRight, Network, GitBranch, Search } from "lucide-react";
import { MOCK_TOOLS } from "@/lib/mock-data";
import type { Tool } from "@/lib/types";

// Map tool icon strings to Lucide components
const IconMap: Record<string, React.ElementType> = {
  Lock,
  Globe,
  Shield,
  ArrowRight,
  Network,
  GitBranch,
  Search,
  Cookie: Lock, // fallback — replace when lucide adds Cookie
};

const statusConfig = {
  active: { label: "Actif", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  beta: { label: "Bêta", className: "bg-amber-50 text-amber-600 border border-amber-200" },
  coming_soon: { label: "Bientôt", className: "bg-slate-100 text-slate-500 border border-slate-200" },
};

const categories = [...new Set(MOCK_TOOLS.map((t) => t.category))];

export default function ToolsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Outils d'Analyse</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suite d'outils de sécurité web disponibles dans Cybelis.
          </p>
        </div>
      </div>

      {/* Tools by category */}
      {categories.map((category) => {
        const tools = MOCK_TOOLS.filter((t) => t.category === category);
        return (
          <div key={category} className="space-y-3">
            <h2 className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest px-1">
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tools.map((tool: Tool) => {
                const Icon = IconMap[tool.icon] ?? Shield;
                const status = statusConfig[tool.status];
                const isActive = tool.status === "active";
                return (
                  <div
                    key={tool.id}
                    className={`p-5 rounded-2xl bg-white border shadow-sm flex flex-col gap-4 transition-all hover:shadow-md ${
                      isActive ? "border-slate-200 hover:border-blue-200" : "border-slate-100 opacity-70"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                          isActive
                            ? "bg-slate-50 border-slate-200 text-slate-700 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600"
                            : "bg-slate-50 border-slate-100 text-slate-400"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${status.className}`}>
                        {status.label.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xs font-bold text-slate-900">{tool.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{tool.description}</p>
                    </div>

                    {isActive && (
                      <a
                        href={`/dashboard/scan`}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                      >
                        Utiliser cet outil <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                    {!isActive && (
                      <div className="flex items-center justify-center py-2 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-[11px] text-slate-400 font-mono">
                        Disponible prochainement
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
