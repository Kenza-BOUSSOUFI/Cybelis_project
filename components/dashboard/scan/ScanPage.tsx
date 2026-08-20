"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Terminal, Shield, Cpu, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";

function ScanEngineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawDomain = searchParams.get("domain") || "clarveon.ma";

  // Sanitize domain
  const domain = rawDomain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0] || "clarveon.ma";

  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const steps = [
    { log: "[sys] Initialisation du Clarveon Scan Engine (v2.0.4-beta)...", delay: 200, progress: 5 },
    { log: `[sys] Résolution DNS pour ${domain}...`, delay: 400, progress: 15 },
    { log: `[dns] Enregistrement A résolu : 185.190.140.15`, delay: 300, progress: 20 },
    { log: `[dns] Enregistrement MX résolu : mail.${domain} (priorité 10)`, delay: 300, progress: 25 },
    { log: `[dns] Enregistrement TXT trouvé : v=spf1 include:_spf.google.com ~all`, delay: 200, progress: 30 },
    { log: `[dns] Enregistrement TXT DMARC : Aucun enregistrement _dmarc trouvé !`, delay: 400, progress: 35 },
    { log: `[ssl] Connexion TLS sur le port 443...`, delay: 500, progress: 45 },
    { log: `[ssl] Certificat X.509 récupéré. Émis par Let's Encrypt Authority.`, delay: 300, progress: 50 },
    { log: `[ssl] Date d'expiration détectée : dans 12 jours. (Alerte générée)`, delay: 450, progress: 55 },
    { log: `[tls] Test de compatibilité TLS : TLS 1.0 (Activé), TLS 1.1 (Activé), TLS 1.2 (Activé), TLS 1.3 (Activé)`, delay: 500, progress: 65 },
    { log: `[tls] Alerte : Protocoles obsolètes TLS 1.0/1.1 supportés.`, delay: 300, progress: 70 },
    { log: `[http] Requête GET vers https://${domain}... HTTP/2 200 OK`, delay: 400, progress: 75 },
    { log: `[http] Analyse des en-têtes : Strict-Transport-Security (Absent), Content-Security-Policy (Absent)`, delay: 450, progress: 85 },
    { log: `[http] Analyse des cookies : Set-Cookie trouvé. Flags Secure=false HttpOnly=true`, delay: 300, progress: 90 },
    { log: `[whois] Interrogation des serveurs WHOIS pour ${domain}...`, delay: 400, progress: 95 },
    { log: `[sys] Consolidation des rapports et calcul du score de sécurité...`, delay: 300, progress: 98 },
    { log: `[sys] Rapport généré ! Redirection...`, delay: 500, progress: 100 }
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const runNextStep = (stepIdx: number) => {
      if (stepIdx >= steps.length) {
        // Redirection to reports page
        router.push(`/dashboard/reports/${domain}`);
        return;
      }

      const step = steps[stepIdx];
      timer = setTimeout(() => {
        setLogs(prev => [...prev, step.log]);
        setProgress(step.progress);
        setCurrentStep(stepIdx + 1);
        runNextStep(stepIdx + 1);
      }, step.delay);
    };

    runNextStep(0);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Auto scroll terminal logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">

      {/* HEADER CARD */}
      <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Analyse en cours : <span className="font-mono text-indigo-400">{domain}</span></h2>
            <p className="text-xs text-neutral-400">Le moteur Clarveon inspecte activement la sécurité de votre domaine.</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-mono text-indigo-400 font-bold">{progress}%</span>
          <div className="w-36 h-2 rounded-full bg-neutral-950 overflow-hidden border border-neutral-900">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* CORE TERMINAL SIMULATOR */}
      <div className="rounded-3xl border border-neutral-900 bg-neutral-950 shadow-2xl overflow-hidden">

        {/* Terminal Header Bar */}
        <div className="px-4 py-3 bg-neutral-900 flex items-center justify-between border-b border-neutral-900/40">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-[10px] font-mono text-neutral-500 ml-3 flex items-center gap-1">
              <Terminal className="w-3 h-3 text-indigo-400" /> clarveon-scan-engine.bin
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-500 uppercase">
            <Cpu className="w-3 h-3 text-purple-400" /> PID 4821
          </div>
        </div>

        {/* Terminal Console Output */}
        <div
          ref={logContainerRef}
          className="p-6 h-[400px] overflow-y-auto font-mono text-xs text-neutral-300 space-y-2 scroll-smooth bg-neutral-950"
        >
          {logs.map((log, index) => {
            let logColor = "text-neutral-400";
            if (log.startsWith("[sys]")) logColor = "text-indigo-400 font-bold";
            else if (log.startsWith("[dns]")) logColor = "text-sky-400";
            else if (log.startsWith("[ssl]")) logColor = "text-purple-400";
            else if (log.includes("[ok]")) logColor = "text-emerald-400";
            else if (log.includes("[warning]")) logColor = "text-yellow-400 font-semibold";
            else if (log.includes("[critical]")) logColor = "text-red-500 font-bold";

            return (
              <div key={index} className={`leading-relaxed border-b border-neutral-900/10 pb-1.5 ${logColor}`}>
                {log}
              </div>
            );
          })}

          {progress < 100 && (
            <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
              <span className="w-1.5 h-3 bg-indigo-500 inline-block animate-ping" />
              <span>Attente des paquets distants...</span>
            </div>
          )}
        </div>

      </div>

      {/* FOOTER RECOMMENDATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-900 flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white mb-1">Scan Passif</h4>
            <p className="text-[10px] text-neutral-500 leading-normal">
              Aucune injection SQL ni attaque par force brute n'est tentée. Le scan respecte scrupuleusement la législation marocaine sur la cybersécurité.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-900 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white mb-1">Algorithme V2</h4>
            <p className="text-[10px] text-neutral-500 leading-normal">
              Le calcul de note tient compte des spécifications techniques de l'ANRT et des standards d'encodage de certificats SSL modernes.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white mb-1">Historisation</h4>
            <p className="text-[10px] text-neutral-500 leading-normal">
              En tant qu'utilisateur authentifié, le rapport sera enregistré dans votre historique pour pouvoir comparer vos scores au cours du temps.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

export function ScanEnginePage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ScanEngineContent />
    </Suspense>
  );
}
