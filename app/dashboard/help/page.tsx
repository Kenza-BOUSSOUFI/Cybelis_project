"use client";

import React, { useState, useMemo } from "react";
import {
  HelpCircle, ChevronDown, ChevronUp, Mail, BookOpen, Search,
  Send, CheckCircle2, ShieldAlert, Zap, Globe, FileText, Loader2, Sparkles, MessageSquare
} from "lucide-react";

interface FAQ {
  q: string;
  a: string;
  category: "Général" | "Scans & Moteur" | "Score & Rapports" | "Sécurité & Données";
}

const FAQS: FAQ[] = [
  {
    category: "Général",
    q: "Qu'est-ce que Cybelis ?",
    a: "Cybelis est une plateforme SaaS d'audit automatisé de sécurité web. Elle effectue une série d'analyses non invasives sur vos sites web afin d'identifier les vulnérabilités de configuration (SSL/TLS, en-têtes HTTP, DNS, cookies, etc.) et de vous fournir des recommandations concrètes.",
  },
  {
    category: "Général",
    q: "Quels domaines puis-je auditer ?",
    a: "Vous pouvez analyser tout domaine ou sous-domaine accessible publiquement sur Internet (ex: mycompany.com). Les analyses sont passives et conformes aux bonnes pratiques de détection.",
  },
  {
    category: "Scans & Moteur",
    q: "Quelle est la différence entre Audit Complet et Audit Personnalisé ?",
    a: "L'Audit Complet exécute simultanément les 16 modules de sécurité disponibles (SSL, DNS, Headers, Cookies, SPF, DMARC, CORS, CSP, etc.). L'Audit Personnalisé vous permet de sélectionner uniquement les modules ciblés que vous souhaitez tester.",
  },
  {
    category: "Scans & Moteur",
    q: "Combien de temps dure une analyse ?",
    a: "Un scan prend généralement entre 15 et 45 secondes grâce à l'exécution en parallèle des collecteurs réseau de notre moteur.",
  },
  {
    category: "Scans & Moteur",
    q: "Puis-je fermer la page pendant un scan ?",
    a: "Oui. Les scans s'exécutent de manière asynchrone en arrière-plan. L'état d'avancement est sauvegardé en base de données et le rapport sera disponible dans votre historique.",
  },
  {
    category: "Score & Rapports",
    q: "Comment est calculé le score de sécurité et la note ?",
    a: "Le score global (sur 100 points) et la note (de A à F) sont calculés en pondérant les résultats de chaque module. Les vulnérabilités critiques pénalisent le score plus lourdement que les simples avertissements.",
  },
  {
    category: "Score & Rapports",
    q: "Où retrouver mes anciens rapports de scan ?",
    a: "Tous vos audits sont conservés dans la section Historique. Cliquez sur l'icône 'Rapport' à côté d'un scan pour consulter l'analyse détaillée et les recommandations.",
  },
  {
    category: "Sécurité & Données",
    q: "Mes données d'analyse sont-elles sécurisées ?",
    a: "Oui. Toutes les données sont chiffrées et stockées de façon isolée. Aucun utilisateur n'a accès aux audits ou aux domaines d'un autre utilisateur.",
  },
];

const CATEGORIES = ["Tous", "Général", "Scans & Moteur", "Score & Rapports", "Sécurité & Données"];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>("Tous");
  const [search, setSearch] = useState("");

  // Contact form state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      if (activeCategory !== "Tous" && faq.category !== activeCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeCategory, search]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSending(true);
    setSendError(null);
    setSentSuccess(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setSentSuccess(true);
        setSubject("");
        setMessage("");
      } else {
        setSendError(json.error || "Impossible d'envoyer le message.");
      }
    } catch {
      setSendError("Erreur de connexion lors de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6 px-4">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Centre d'Aide & Documentation</h1>
          <p className="text-xs text-slate-500 mt-0.5">Guides, foire aux questions et assistance technique Cybelis.</p>
        </div>
      </div>

      {/* ── Quickstart Steps ───────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600" />
          Comment lancer votre premier audit en 3 étapes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">1</div>
            <h3 className="text-xs font-bold text-slate-900">Saisir le domaine</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Entrez l'URL ou le domaine (ex: mysite.com) dans la page Nouveau Scan.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">2</div>
            <h3 className="text-xs font-bold text-slate-900">Choisir les modules</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Optez pour un audit complet (16 outils) ou sélectionnez les modules souhaités.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">3</div>
            <h3 className="text-xs font-bold text-slate-900">Consulter le rapport</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Découvrez la note globale et appliquez les recommandations de sécurité.
            </p>
          </div>
        </div>
      </div>

      {/* ── Severity Glossary ──────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-600" />
          Comprendre les niveaux de vulnérabilité
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-1">
            <div className="text-xs font-bold text-red-700 uppercase tracking-wider">Critique</div>
            <p className="text-[11px] text-red-600 leading-relaxed">Faille majeure à corriger d'urgence. Risque direct d'exploitation.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 space-y-1">
            <div className="text-xs font-bold text-orange-700 uppercase tracking-wider">Élevé</div>
            <p className="text-[11px] text-orange-600 leading-relaxed">Absence de protection essentielle (ex: pas d'HSTS ou SPF absent).</p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Moyen</div>
            <p className="text-[11px] text-amber-600 leading-relaxed">Mauvaise configuration ou recommandation de durcissement.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Faible / Conforme</div>
            <p className="text-[11px] text-emerald-600 leading-relaxed">Le contrôle est validé avec succès sans risque détecté.</p>
          </div>
        </div>
      </div>

      {/* ── FAQ Section ────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Questions fréquemment posées (FAQ)</h2>

          {/* Search Input */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-xs focus-within:border-blue-500 w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une question…"
              className="bg-transparent border-0 text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-2.5">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
              Aucune question ne correspond à votre recherche "{search}".
            </div>
          ) : (
            filteredFaqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className={`rounded-2xl bg-white border transition-all ${
                    isOpen ? "border-blue-200 shadow-sm" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-xs font-bold text-slate-900 flex-1 leading-snug">{faq.q}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider hidden sm:inline-block">
                      {faq.category}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Contact Support Form ───────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Envoyer un message au support</h3>
            <p className="text-xs text-slate-500">Une question technique ou un besoin spécifique ? Écrivez-nous directement.</p>
          </div>
        </div>

        {sentSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Votre message a été envoyé à notre équipe de support. Nous vous répondrons dans les plus brefs délais !
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="space-y-4">
            {sendError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-600">
                {sendError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Sujet de votre demande</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="ex: Problème d'analyse sur mon domaine"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre question ou le problème rencontré..."
                rows={4}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-blue-600/15 flex items-center gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer le message
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
