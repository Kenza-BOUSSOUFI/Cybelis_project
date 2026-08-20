"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, ExternalLink } from "lucide-react";
import { TERMS_SECTIONS, PRIVACY_SECTIONS } from "./legalData";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "terms" | "privacy";
}

export function LegalModal({ isOpen, onClose, initialTab = "terms" }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery("");
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const sections = activeTab === "terms" ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  const filteredSections = sections.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q);
  });

  const fullPageRoute =
    activeTab === "terms"
      ? "/legal/conditions-utilisation"
      : "/legal/politique-confidentialite";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-white border border-slate-200 shadow-2xl text-slate-900 overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="flex flex-col border-b border-slate-200 bg-white p-5 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {activeTab === "terms"
                      ? "Conditions d'utilisation"
                      : "Politique de confidentialité"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Clarveon &bull; Plateforme SaaS d&apos;audit de sécurité
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                  title="Fermer (Échap)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tabs & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                {/* Tabs */}
                <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                  <button
                    onClick={() => {
                      setActiveTab("terms");
                      setSearchQuery("");
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      activeTab === "terms"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Conditions d&apos;utilisation
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("privacy");
                      setSearchQuery("");
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      activeTab === "privacy"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Confidentialité (RGPD)
                  </button>
                </div>

                {/* Search */}
                <div className="relative shrink-0 sm:w-48">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrer..."
                    className="w-full rounded-md bg-slate-50 border border-slate-200 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Scrollable Document Text */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {filteredSections.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Aucun résultat pour &quot;{searchQuery}&quot;.
                </div>
              ) : (
                filteredSections.map((sec) => (
                  <div key={sec.id} className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {sec.title}
                    </h3>
                    <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {sec.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-4">
              <Link
                href={fullPageRoute}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 underline"
              >
                Ouvrir la page complète
                <ExternalLink className="h-3 w-3" />
              </Link>

              <button
                onClick={onClose}
                className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 transition-all shadow-sm"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
