"use client";

import React, { useEffect, useState, useRef } from "react";
import { Activity, Clock, Wifi } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProgressCardProps {
  scanId: string;
  onScanFinished: (scanId: string) => void;
  onScanFailed: (errorMsg: string) => void;
}

export function ProgressCard({ scanId, onScanFinished, onScanFailed }: ProgressCardProps) {
  const [status, setStatus] = useState<"PENDING" | "RUNNING" | "COMPLETED" | "FAILED">("PENDING");
  const [completedTools, setCompletedTools] = useState(0);
  const [selectedTools, setSelectedTools] = useState(0);
  const [domain, setDomain] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const lastToolCount = useRef(-1);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function checkStatus() {
      try {
        const res = await fetch(`/api/scans/${scanId}/status`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Impossible de récupérer le statut.");

        const d = json.data;
        setStatus(d.status);
        setCompletedTools(d.completedTools ?? 0);
        setSelectedTools(d.selectedTools ?? 0);
        setDomain(d.domain ?? "");

        if (d.status === "RUNNING" && lastToolCount.current === -1) {
          lastToolCount.current = 0;
        }
        if (d.completedTools > lastToolCount.current) {
          lastToolCount.current = d.completedTools;
        }

        if (d.status === "COMPLETED") {
          clearInterval(intervalId);
          setTimeout(() => onScanFinished(scanId), 800);
        } else if (d.status === "FAILED") {
          clearInterval(intervalId);
          setTimeout(() => onScanFailed("L'analyse a échoué. Vérifiez l'URL et réessayez."), 800);
        }
      } catch (err: any) {
        clearInterval(intervalId);
        onScanFailed(err.message || "Erreur de connexion.");
      }
    }

    checkStatus();
    intervalId = setInterval(checkStatus, 3000);
    return () => clearInterval(intervalId);
  }, [scanId]);

  const pct = selectedTools > 0 ? Math.round((completedTools / selectedTools) * 100) : 0;
  const mm = Math.floor(elapsedSeconds / 60).toString().padStart(2, "0");
  const ss = (elapsedSeconds % 60).toString().padStart(2, "0");

  const statusLabel =
    status === "PENDING" ? "En attente"
      : status === "RUNNING" ? "Analyse en cours"
        : status === "COMPLETED" ? "Terminé"
          : "Échoué";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{statusLabel}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {domain ? (
                  <>Cible : <span className="font-mono font-semibold text-slate-800">{domain}</span></>
                ) : (
                  "Résolution en cours…"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {mm}:{ss}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-xs font-semibold text-slate-700">Progression</span>
            <span className="text-2xl font-black font-mono text-slate-900">{pct}<span className="text-base text-slate-400 font-semibold">%</span></span>
          </div>

          <div className="h-3 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-500 font-mono">
            <span>{completedTools} module(s) traité(s)</span>
            <span>sur {selectedTools || "—"}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Initialisation", done: status !== "PENDING" },
            { label: "Analyse réseau", done: completedTools > 0 },
            { label: "Rapport généré", done: status === "COMPLETED" },
          ].map(({ label, done }) => (
            <div key={label} className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${done
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-slate-50 text-slate-400"
              }`}>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${done ? "bg-blue-600" : "bg-slate-300"}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
        <Wifi className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          L'analyse s'exécute en arrière-plan. Vous pouvez naviguer librement — l'état sera sauvegardé et accessible depuis l'historique.
        </p>
      </div>
    </div>
  );
}
