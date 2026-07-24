"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Plus, CheckSquare, Square, Loader2, AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import { SCAN_MODULES } from "@/lib/mock-data";

type ScanStep = "form" | "running" | "done" | "error";

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [domain, setDomain] = useState(searchParams.get("domain") ?? "");
  const [selectedModules, setSelectedModules] = useState<string[]>(
    SCAN_MODULES.map((m) => m.id) // all selected by default
  );
  const [step, setStep] = useState<ScanStep>("form");
  const [progress, setProgress] = useState(0);
  const [currentModule, setCurrentModule] = useState("");

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const isValidDomain = (d: string) => {
    return /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(d.trim());
  };

  const handleScan = () => {
    if (!isValidDomain(domain)) return;
    setStep("running");
    setProgress(0);

    // Simulate scan progress through selected modules
    const modulesToRun = SCAN_MODULES.filter((m) => selectedModules.includes(m.id));
    let i = 0;

    const interval = setInterval(() => {
      if (i < modulesToRun.length) {
        setCurrentModule(modulesToRun[i].label);
        setProgress(Math.round(((i + 1) / modulesToRun.length) * 100));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setStep("done"), 500);
      }
    }, 900);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Nouveau Scan</h1>
        <p className="text-xs text-slate-500 mt-1">
          Lancez un audit de sécurité complet pour votre site web.
        </p>
      </div>

      {/* STEP: Form */}
      {step === "form" && (
        <div className="space-y-6">
          {/* Domain input */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Domaine à analyser</h2>
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <Globe className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="ex: mycompany.ma"
                className="bg-transparent border-0 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 w-full px-2 py-1"
              />
            </div>
            {domain && !isValidDomain(domain) && (
              <p className="text-[11px] text-red-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Format de domaine invalide
              </p>
            )}
          </div>

          {/* Module selection */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Modules d'analyse</h2>
              <button
                onClick={() =>
                  setSelectedModules(
                    selectedModules.length === SCAN_MODULES.length
                      ? []
                      : SCAN_MODULES.map((m) => m.id)
                  )
                }
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                {selectedModules.length === SCAN_MODULES.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SCAN_MODULES.map((module) => {
                const active = selectedModules.includes(module.id);
                return (
                  <button
                    key={module.id}
                    onClick={() => toggleModule(module.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      active
                        ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {active ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className={`text-xs font-semibold ${active ? "text-blue-800" : "text-slate-700"}`}>
                        {module.label}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{module.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Launch button */}
          <button
            disabled={!domain || !isValidDomain(domain) || selectedModules.length === 0}
            onClick={handleScan}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Lancer le scan ({selectedModules.length} module{selectedModules.length > 1 ? "s" : ""})
          </button>
        </div>
      )}

      {/* STEP: Running */}
      {step === "running" && (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Scan en cours…</h2>
            <p className="text-xs text-slate-500 mt-1">Analyse de <span className="font-semibold text-slate-700">{domain}</span></p>
          </div>
          <div className="w-full space-y-2">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>{currentModule}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">Ne fermez pas cette page durant l'analyse.</p>
        </div>
      )}

      {/* STEP: Done */}
      {step === "done" && (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Scan terminé !</h2>
            <p className="text-xs text-slate-500 mt-1">
              L'analyse de <span className="font-semibold text-slate-700">{domain}</span> est complète.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => router.push("/dashboard/history")}
              className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Voir l'historique
            </button>
            <button
              onClick={() => router.push("/dashboard/reports")}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
            >
              Consulter le rapport
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => { setStep("form"); setDomain(""); setProgress(0); }}
            className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
          >
            Lancer un autre scan
          </button>
        </div>
      )}

    </div>
  );
}
