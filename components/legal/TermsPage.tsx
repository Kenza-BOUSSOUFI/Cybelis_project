"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, ExternalLink } from "lucide-react";
import { TERMS_SECTIONS } from "./legalData";

export function TermsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = TERMS_SECTIONS.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;inscription
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Clarveon · Document légal
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="border-b border-slate-200 pb-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Conditions d&apos;utilisation
          </h1>
          <p className="text-sm text-slate-500">
            Dernière mise à jour : 15 août 2026 &bull; Version 1.0 &bull; Droit français applicable
          </p>
        </div>

        {/* Introduction */}
        <div className="text-slate-700 text-sm leading-relaxed mb-8">
          Veuillez lire attentivement les présentes Conditions Générales d&apos;Utilisation (CGU) avant d&apos;utiliser les services de la plateforme Clarveon. En créant un compte, vous acceptez l&apos;intégralité de ces conditions.
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un point des conditions..."
            className="w-full rounded-lg bg-slate-50 border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
          />
        </div>

        {/* Terms Sections */}
        <div className="space-y-8 divide-y divide-slate-100">
          {filteredSections.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Aucune section ne correspond à votre recherche &quot;{searchQuery}&quot;.
            </p>
          ) : (
            filteredSections.map((section, idx) => (
              <div key={section.id} className={idx > 0 ? "pt-8" : ""}>
                <h2 className="text-lg font-bold text-slate-900 mb-3">
                  {section.title}
                </h2>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Section */}
        <div className="mt-14 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            Pour toute question :{" "}
            <a href="mailto:legal@clarveon.io" className="text-slate-900 font-semibold underline">
              legal@clarveon.io
            </a>
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/legal/politique-confidentialite"
              className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900 underline"
            >
              Politique de confidentialité
              <ExternalLink className="w-3 h-3" />
            </Link>
            <span>&bull;</span>
            <Link href="/register" className="font-semibold text-sky-600 hover:text-sky-700">
              Créer mon compte
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-6 text-center text-xs text-slate-500">
        &copy; 2026 Clarveon &bull; Tous droits réservés
      </footer>
    </div>
  );
}
