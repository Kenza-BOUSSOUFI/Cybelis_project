"use client";

import React, { useState } from "react";
import { Globe, Shield, Check, X, ArrowRight } from "lucide-react";

export function CompareDomainsPage() {
  const [domain1, setDomain1] = useState("cybelis.ma");
  const [domain2, setDomain2] = useState("confrere-concurrent.ma");
  const [isComparing, setIsComparing] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);

  const triggerCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain1 || !domain2) return;

    setIsComparing(true);
    setCompareData(null);

    // Simulate analysis delay
    setTimeout(() => {
      setIsComparing(false);
      setCompareData({
        d1: {
          name: domain1,
          score: 72,
          sslDays: 12,
          critical: 1,
          high: 3,
          medium: 2,
          low: 1,
          hsts: false,
          csp: false,
          dmarc: false,
          secureCookies: false,
          httpsRedirect: true
        },
        d2: {
          name: domain2,
          score: 88,
          sslDays: 140,
          critical: 0,
          high: 1,
          medium: 2,
          low: 1,
          hsts: true,
          csp: false,
          dmarc: true,
          secureCookies: true,
          httpsRedirect: true
        }
      });
    }, 1200);
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (score >= 70) return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
    return "bg-red-500/10 text-red-400 border border-red-500/20";
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Comparateur de Domaines</h1>
        <p className="text-xs text-neutral-400">Comparez la posture de sécurité de deux sites web côte à côte pour identifier les faiblesses.</p>
      </div>

      {/* INPUT FORM CARD */}
      <form onSubmit={triggerCompare} className="p-6 rounded-3xl bg-neutral-900/40 border border-neutral-900 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-5 space-y-1.5">
          <label className="text-[10px] font-mono text-neutral-400 uppercase">Domaine Référence</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500 text-xs">A</span>
            <input
              type="text"
              required
              placeholder="votre-site.ma"
              value={domain1}
              onChange={(e) => setDomain1(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="md:col-span-1 flex items-center justify-center pb-3 text-neutral-500 font-mono text-xs">
          VS
        </div>

        <div className="md:col-span-4 space-y-1.5">
          <label className="text-[10px] font-mono text-neutral-400 uppercase">Domaine Comparé</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500 text-xs">B</span>
            <input
              type="text"
              required
              placeholder="concurrent-site.ma"
              value={domain2}
              onChange={(e) => setDomain2(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isComparing}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            {isComparing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyse...</span>
              </>
            ) : (
              <>
                <span>Comparer</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* COMPARATIVE DATAGRID */}
      {compareData ? (
        <div className="p-6 rounded-3xl bg-neutral-900/40 border border-neutral-900 space-y-6">

          <div className="grid grid-cols-3 gap-4 border-b border-neutral-800 pb-4 text-center">
            <div className="text-xs text-neutral-500 font-mono uppercase tracking-wider text-left self-center">Critère</div>
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850 font-bold text-xs text-white truncate">
              {compareData.d1.name}
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850 font-bold text-xs text-indigo-400 truncate">
              {compareData.d2.name}
            </div>
          </div>

          <div className="divide-y divide-neutral-800/60 space-y-4">

            {/* ROW 1: SCORE */}
            <div className="grid grid-cols-3 gap-4 pt-4 text-xs">
              <span className="font-semibold text-white self-center">Score Global</span>
              <div className="text-center">
                <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${getScoreBadge(compareData.d1.score)}`}>
                  {compareData.d1.score}%
                </span>
              </div>
              <div className="text-center">
                <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${getScoreBadge(compareData.d2.score)}`}>
                  {compareData.d2.score}%
                </span>
              </div>
            </div>

            {/* ROW 2: SSL DAYS */}
            <div className="grid grid-cols-3 gap-4 pt-4 text-xs">
              <span className="font-semibold text-white self-center">Validité SSL</span>
              <div className="text-center font-mono text-neutral-300">
                {compareData.d1.sslDays <= 15 ? (
                  <span className="text-red-500 font-bold">{compareData.d1.sslDays} jours (Alerte !)</span>
                ) : (
                  <span>{compareData.d1.sslDays} jours</span>
                )}
              </div>
              <div className="text-center font-mono text-neutral-300">
                <span>{compareData.d2.sslDays} jours</span>
              </div>
            </div>

            {/* ROW 3: FAILLES CRITIQUES */}
            <div className="grid grid-cols-3 gap-4 pt-4 text-xs">
              <span className="font-semibold text-white self-center">Failles Critiques</span>
              <div className="text-center font-mono font-bold text-red-500">{compareData.d1.critical}</div>
              <div className="text-center font-mono font-bold text-neutral-400">{compareData.d2.critical}</div>
            </div>

            {/* ROW 4: HSTS EN-TETE */}
            <div className="grid grid-cols-3 gap-4 pt-4 text-xs">
              <span className="font-semibold text-white self-center">En-tête HSTS</span>
              <div className="flex justify-center text-red-500">
                {compareData.d1.hsts ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-red-500" />}
              </div>
              <div className="flex justify-center text-emerald-400">
                {compareData.d2.hsts ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-red-500" />}
              </div>
            </div>

            {/* ROW 5: DMARC EMAIL */}
            <div className="grid grid-cols-3 gap-4 pt-4 text-xs">
              <span className="font-semibold text-white self-center">Sécurité DMARC (E-mail)</span>
              <div className="flex justify-center text-red-500">
                {compareData.d1.dmarc ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-red-500" />}
              </div>
              <div className="flex justify-center text-emerald-400">
                {compareData.d2.dmarc ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-red-500" />}
              </div>
            </div>

            {/* ROW 6: SECURE COOKIES */}
            <div className="grid grid-cols-3 gap-4 pt-4 text-xs">
              <span className="font-semibold text-white self-center">Cookies avec attribut "Secure"</span>
              <div className="flex justify-center text-red-500">
                {compareData.d1.secureCookies ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-red-500" />}
              </div>
              <div className="flex justify-center text-emerald-400">
                {compareData.d2.secureCookies ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-red-500" />}
              </div>
            </div>

            {/* ROW 7: HTTPS FORCE */}
            <div className="grid grid-cols-3 gap-4 pt-4 text-xs">
              <span className="font-semibold text-white self-center">Redirection HTTPS forcée</span>
              <div className="flex justify-center text-emerald-400">
                {compareData.d1.httpsRedirect ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-red-500" />}
              </div>
              <div className="flex justify-center text-emerald-400">
                {compareData.d2.httpsRedirect ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-red-500" />}
              </div>
            </div>

          </div>

          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-400 flex items-start gap-3 mt-6">
            <Shield className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="leading-normal">
              <strong>Bilan :</strong> Le domaine <span className="font-bold">{compareData.d2.name}</span> dispose d'une configuration globale plus mature, notamment sur la protection des communications HTTP (HSTS) et la protection e-mail (DMARC). Nous vous conseillons de corriger ces deux points en priorité sur votre domaine.
            </p>
          </div>

        </div>
      ) : (
        <div className="py-16 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-3xl">
          Saisissez deux domaines et cliquez sur "Comparer" pour visualiser l'analyse comparative.
        </div>
      )}

    </div>
  );
}
