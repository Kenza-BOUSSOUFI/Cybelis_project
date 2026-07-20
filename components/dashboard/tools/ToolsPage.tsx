"use client";

import React, { useState } from "react";
import { 
  Shield, 
  Lock, 
  Globe, 
  Database, 
  Terminal, 
  Cpu, 
  Key, 
  RefreshCw, 
  Sliders, 
  FileText, 
  Mail, 
  Search, 
  Server, 
  Activity,
  ArrowRight,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export function ToolsHubPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [targetDomain, setTargetDomain] = useState("cybelis.ma");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Tools catalog
  const tools = [
    { id: "ssl", name: "SSL Checker", category: "website", desc: "Vérifie la validité et l'autorité du certificat SSL.", icon: Shield },
    { id: "tls", name: "TLS Analyzer", category: "website", desc: "Évalue la robustesse des protocoles TLS supportés.", icon: Lock },
    { id: "headers", name: "Security Headers", category: "website", desc: "Détecte l'absence d'en-têtes HTTP de sécurité.", icon: Globe },
    { id: "cookies", name: "Cookie Analyzer", category: "website", desc: "Identifie les cookies vulnérables sans attributs de sécurité.", icon: Database },
    { id: "methods", name: "HTTP Methods", category: "website", desc: "Détecte les méthodes HTTP potentiellement dangereuses activées.", icon: Terminal },
    { id: "cors", name: "CORS Analyzer", category: "website", desc: "Analyse la politique CORS et signale le partage sauvage.", icon: Cpu },
    { id: "csp", name: "CSP Validator", category: "website", desc: "Valide les directives Content Security Policy.", icon: Key },
    { id: "redirects", name: "Redirect Analyzer", category: "website", desc: "Vérifie l'existence de redirection forcée HTTPS.", icon: RefreshCw },
    { id: "robots", name: "Robots.txt Analyzer", category: "website", desc: "Examine robots.txt à la recherche d'expositions sensibles.", icon: Sliders },
    { id: "sitemap", name: "Sitemap Checker", category: "website", desc: "Valide la structure du fichier sitemap.xml.", icon: FileText },
    { id: "email", name: "SPF/DKIM/DMARC", category: "email", desc: "Analyse les clés DNS de protection e-mail.", icon: Mail },
    { id: "dns", name: "DNS Lookup", category: "dns", desc: "Interroge les serveurs de noms et résout les enregistrements.", icon: Search },
    { id: "whois", name: "WHOIS Lookup", category: "dns", desc: "Récupère les informations d'enregistrement officielles du domaine.", icon: Server },
    { id: "domain_age", name: "Domain Age", category: "dns", desc: "Calcule l'ancienneté comme indicateur de légitimité.", icon: Activity }
  ];

  // Simulated results generator per tool
  const runDedicatedToolTest = (toolId: string) => {
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      switch (toolId) {
        case "ssl":
          setTestResult({
            success: true,
            status: "warning",
            summary: "Certificat SSL trouvé mais expire bientôt",
            details: [
              { label: "Nom Commun", value: targetDomain },
              { label: "Autorité d'Émission", value: "Let's Encrypt Authority" },
              { label: "Algorithme de Signature", value: "SHA-256 avec RSA" },
              { label: "Date d'Expiration", value: "20 juillet 2026 (dans 12 jours)" },
              { label: "Chaîne de Confiance", value: "Valide et reconnue par les navigateurs" }
            ]
          });
          break;
        case "dns":
          setTestResult({
            success: true,
            status: "success",
            summary: "Résolution DNS effectuée",
            details: [
              { label: "Enregistrement A", value: "185.190.140.15" },
              { label: "Enregistrement MX", value: `mail.${targetDomain} (Priorité: 10)` },
              { label: "Enregistrement TXT (SPF)", value: "v=spf1 include:_spf.google.com ~all" },
              { label: "Serveurs de Noms (NS)", value: "ns1.hosting-provider.ma, ns2.hosting-provider.ma" }
            ]
          });
          break;
        case "headers":
          setTestResult({
            success: true,
            status: "danger",
            summary: "En-têtes HTTP de sécurité manquants",
            details: [
              { label: "Strict-Transport-Security (HSTS)", value: "NON DÉTECTÉ" },
              { label: "Content-Security-Policy (CSP)", value: "NON DÉTECTÉ" },
              { label: "X-Frame-Options", value: "SAMEORIGIN (Sécurisé)" },
              { label: "X-Content-Type-Options", value: "nosniff (Sécurisé)" },
              { label: "Referrer-Policy", value: "no-referrer-when-downgrade" }
            ]
          });
          break;
        case "email":
          setTestResult({
            success: true,
            status: "danger",
            summary: "Configuration E-mail vulnérable au phishing",
            details: [
              { label: "SPF Record", value: "Trouvé : v=spf1 include:_spf.google.com ~all" },
              { label: "DMARC Record", value: "ABSENT (_dmarc.domain manquant)" },
              { label: "DKIM DNS Key", value: "Non vérifiable sans sélecteur public" }
            ]
          });
          break;
        default:
          setTestResult({
            success: true,
            status: "success",
            summary: "Analyse complétée",
            details: [
              { label: "Statut de réponse", value: "200 OK" },
              { label: "Technologie détectée", value: "Next.js / Node.js" },
              { label: "Recommandation", value: "Consultez l'audit complet du site pour voir tous les correctifs." }
            ]
          });
      }
    }, 1000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Outils d'Audit Individuels</h1>
        <p className="text-xs text-neutral-400">Lancez des analyses spécifiques sur un aspect précis de la sécurité de votre domaine.</p>
      </div>

      {/* CORE DISPLAY (GRID AND RUNNER PANEL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Tool grid selector */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = selectedTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setSelectedTool(tool.id);
                  setTestResult(null);
                }}
                className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all ${
                  isSelected 
                    ? "bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/5" 
                    : "bg-neutral-900/40 border-neutral-900 hover:border-neutral-800"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-indigo-600 text-white" : "bg-neutral-950 border border-neutral-800 text-indigo-400"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{tool.name}</h4>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-normal">{tool.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Tool running inspector panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-neutral-900/40 border border-neutral-900 flex flex-col gap-6 sticky top-28">
            
            <div>
              <h3 className="text-sm font-bold text-white">Inspecteur d'Outil</h3>
              <p className="text-[10px] text-neutral-500">Sélectionnez un outil à gauche pour exécuter le test.</p>
            </div>

            {selectedTool ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    {React.createElement(tools.find(t => t.id === selectedTool)?.icon || Shield, { className: "w-4 h-4" })}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white">{tools.find(t => t.id === selectedTool)?.name}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">Status: READY</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">Domaine cible</label>
                  <input 
                    type="text"
                    value={targetDomain}
                    onChange={(e) => setTargetDomain(e.target.value)}
                    placeholder="cybelis.ma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-850 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500" 
                  />
                </div>

                <button
                  onClick={() => runDedicatedToolTest(selectedTool)}
                  disabled={isTesting || !targetDomain}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {isTesting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyse en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Lancer l'inspecteur</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Simulated Result Box */}
                {testResult && (
                  <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-850 space-y-3 font-mono text-xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-neutral-900">
                      {testResult.status === "success" ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className={`w-4 h-4 ${testResult.status === "warning" ? "text-yellow-500" : "text-red-500"}`} />
                      )}
                      <span className="font-bold text-white text-[11px]">{testResult.summary}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {testResult.details.map((det: any, idx: number) => (
                        <div key={idx} className="flex flex-col gap-0.5 animate-fade-in">
                          <span className="text-[10px] text-neutral-500 font-sans uppercase font-semibold">{det.label}</span>
                          <span className={`text-[11px] font-mono leading-normal break-all ${
                            det.value === "NON DÉTECTÉ" || det.value === "ABSENT (_dmarc.domain manquant)" ? "text-red-400 font-bold" : 
                            det.value.includes("obsolètes") ? "text-yellow-400" : "text-neutral-300"
                          }`}>
                            {det.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-2xl">
                Veuillez sélectionner un outil de sécurité pour afficher ses options de test individuel.
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
