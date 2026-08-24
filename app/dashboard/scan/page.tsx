"use client";

import React, { useState } from "react";
import { Shield, AlertCircle, RefreshCw } from "lucide-react";
import { ScanForm } from "@/components/dashboard/scan/ScanForm";
import { ProgressCard } from "@/components/dashboard/scan/ProgressCard";
import { ResultsCard } from "@/components/dashboard/scan/ResultsCard";

type ScanStep = "form" | "running" | "done" | "error";

export default function ScanPage() {
  const [step, setStep]       = useState<ScanStep>("form");
  const [scanId, setScanId]   = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleScanStarted  = (id: string) => { setScanId(id); setStep("running"); };
  const handleScanFinished = ()            => setStep("done");
  const handleScanFailed   = (msg: string) => { setErrorMsg(msg); setStep("error"); };
  const handleReset        = ()            => { setStep("form"); setScanId(""); setErrorMsg(""); };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 px-4">
      {/* Header for Form Step */}
      {step === "form" && (
        <div className="border-b border-slate-200 pb-4 text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Nouveau Scan de Sécurité
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
            Exécutez un audit complet sur les faiblesses SSL/TLS, DNS, en-têtes de sécurité et cookies.
          </p>
        </div>
      )}

      {/* States */}
      {step === "form"    && <ScanForm onScanStarted={handleScanStarted} />}
      {step === "running" && <ProgressCard scanId={scanId} onScanFinished={handleScanFinished} onScanFailed={handleScanFailed} />}
      {step === "done"    && <ResultsCard scanId={scanId} onReset={handleReset} />}

      {step === "error" && (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-4 text-center min-h-[300px]">
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600">
            <AlertCircle className="w-6 h-6 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">L'analyse a échoué</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {errorMsg || "Une erreur inconnue s'est produite lors de l'exécution du scan."}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="mt-2 py-2 px-5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réessayer à nouveau
          </button>
        </div>
      )}
    </div>
  );
}
