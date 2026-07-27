"use client";

import React, { useState } from "react";
import { Globe, AlertTriangle, Zap, SlidersHorizontal, Loader2, Play, Lock, Search } from "lucide-react";
import { ToolSelector } from "./ToolSelector";

interface ScanFormProps {
  onScanStarted: (scanId: string) => void;
}

const isValidDomain = (d: string) => {
  const sanitized = d.trim().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  return /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(sanitized);
};

export function ScanForm({ onScanStarted }: ScanFormProps) {
  const [url, setUrl] = useState("");
  const [scanType, setScanType] = useState<"FULL" | "CUSTOM">("FULL");
  const [selectedToolSlugs, setSelectedToolSlugs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDomainInvalid = url.trim().length > 0 && !isValidDomain(url);
  const isSubmitDisabled =
    !url || isDomainInvalid || isLoading ||
    (scanType === "CUSTOM" && selectedToolSlugs.length === 0);

  const handleLaunchScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const initRes = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, scanType, toolSlugs: scanType === "CUSTOM" ? selectedToolSlugs : undefined }),
      });
      const initJson = await initRes.json();
      if (!initRes.ok || !initJson.success) throw new Error(initJson.error || "Erreur lors de l'initialisation du scan.");
      const scanId = initJson.data.scanId;

      const startRes = await fetch(`/api/scans/${scanId}/start`, { method: "POST" });
      const startJson = await startRes.json();
      if (!startRes.ok || !startJson.success) throw new Error(startJson.error || "Impossible de démarrer l'analyse.");

      onScanStarted(scanId);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLaunchScan} className="space-y-6">
      {/* ── URL Input ─────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <Globe className="w-4 h-4 text-blue-600" />
          Domaine ou URL à auditer
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-semibold">
            HTTPS supporté
          </span>
        </label>

        <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-colors ${
          isDomainInvalid
            ? "border-red-300 bg-red-50/50"
            : "border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 shadow-sm"
        }`}>
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="ex: mycompany.com ou https://mycompany.com"
            className="flex-1 bg-transparent border-0 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 font-mono"
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
          />
          {url && !isDomainInvalid && (
            <div className="shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </div>

        {isDomainInvalid && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Format invalide — exemples : example.com, sub.domaine.io
          </p>
        )}
      </div>

      {/* ── Scan Type ─────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" />
          Mode d'analyse de sécurité
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full scan */}
          <button
            type="button"
            onClick={() => setScanType("FULL")}
            disabled={isLoading}
            className={`flex items-start gap-4 p-5 rounded-xl border text-left transition-all ${
              scanType === "FULL"
                ? "bg-blue-50/60 border-blue-500 ring-1 ring-blue-500/20"
                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <div className={`shrink-0 p-2.5 rounded-lg border flex items-center justify-center ${
              scanType === "FULL" ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-100 border-slate-200 text-slate-500"
            }`}>
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Audit Complet</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-100 text-blue-700">Recommandé</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                16 modules de sécurité · SSL, DNS, Headers HTTP, Cookies, SPF, DMARC…
              </p>
            </div>
          </button>

          {/* Custom scan */}
          <button
            type="button"
            onClick={() => setScanType("CUSTOM")}
            disabled={isLoading}
            className={`flex items-start gap-4 p-5 rounded-xl border text-left transition-all ${
              scanType === "CUSTOM"
                ? "bg-blue-50/60 border-blue-500 ring-1 ring-blue-500/20"
                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <div className={`shrink-0 p-2.5 rounded-lg border flex items-center justify-center ${
              scanType === "CUSTOM" ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-100 border-slate-200 text-slate-500"
            }`}>
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Audit Personnalisé</span>
                {scanType === "CUSTOM" && selectedToolSlugs.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-100 text-blue-700">
                    {selectedToolSlugs.length} module(s)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Sélectionnez spécifiquement les modules de sécurité à exécuter.
              </p>
            </div>
          </button>
        </div>

        {/* Tool Selector */}
        {scanType === "CUSTOM" && (
          <div className="pt-4 border-t border-slate-100">
            <ToolSelector selectedSlugs={selectedToolSlugs} onChange={setSelectedToolSlugs} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-600">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-md shadow-blue-600/15 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Initialisation de l'audit…</>
        ) : (
          <><Play className="w-4 h-4 fill-white" /> Lancer le scan de sécurité</>
        )}
      </button>
    </form>
  );
}
