"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Mail, BookOpen, Video, ExternalLink } from "lucide-react";

interface FAQ {
  q: string;
  a: string;
  category: string;
}

const FAQS: FAQ[] = [
  {
    category: "Général",
    q: "Qu'est-ce que Cybelis ?",
    a: "Cybelis est une plateforme SaaS d'audit de sécurité web conçue pour les PME. Elle analyse automatiquement vos sites et détecte les vulnérabilités (TLS, DNS, headers, cookies, etc.), les synthétise en un score et génère des rapports actionnables.",
  },
  {
    category: "Général",
    q: "Quels sites puis-je analyser ?",
    a: "Vous pouvez analyser tout domaine accessible publiquement sur Internet. Il vous suffit de saisir le nom de domaine (ex : mycompany.ma) dans la page Nouveau Scan.",
  },
  {
    category: "Scans",
    q: "Combien de temps dure un scan ?",
    a: "En moyenne, un scan complet prend entre 1 et 3 minutes selon le nombre de modules sélectionnés et la complexité du site analysé.",
  },
  {
    category: "Scans",
    q: "Puis-je sélectionner des modules spécifiques ?",
    a: "Oui. Depuis la page Nouveau Scan, vous pouvez cocher ou décocher les modules d'analyse (TLS, DNS, Headers, Cookies, Redirections, Ports) pour personnaliser votre audit.",
  },
  {
    category: "Scans",
    q: "Comment est calculé le score de sécurité ?",
    a: "Le score est calculé sur 100 points en fonction de la gravité et du nombre de vulnérabilités détectées. Une faille critique pénalise davantage qu'une faille faible.",
  },
  {
    category: "Rapports",
    q: "Comment accéder à mes rapports ?",
    a: "Chaque scan génère automatiquement un rapport. Rendez-vous dans la section Rapports pour les consulter. Vous pouvez aussi accéder directement à un rapport depuis l'Historique des scans.",
  },
  {
    category: "Rapports",
    q: "Puis-je exporter mes rapports en PDF ?",
    a: "L'export PDF est en cours de développement et sera disponible dans une prochaine mise à jour. Vous serez notifié dès que cette fonctionnalité sera active.",
  },
  {
    category: "Compte",
    q: "Comment modifier mes informations de compte ?",
    a: "Allez dans Paramètres > Compte. Vous pouvez y modifier votre nom, votre email et votre mot de passe.",
  },
  {
    category: "Compte",
    q: "Comment contacter le support Cybelis ?",
    a: "Vous pouvez nous contacter à l'adresse contact@cybelis.ma. Notre équipe répond généralement sous 24h ouvrées.",
  },
];

const categories = [...new Set(FAQS.map((f) => f.category))];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Tous");

  const filtered =
    activeCategory === "Tous" ? FAQS : FAQS.filter((f) => f.category === activeCategory);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Centre d'Aide</h1>
          <p className="text-xs text-slate-500 mt-0.5">Trouvez des réponses ou contactez notre équipe.</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: "Documentation", description: "Guides complets et références API", href: "#", color: "text-blue-600 bg-blue-50 border-blue-200" },
          { icon: Video, label: "Tutoriels vidéo", description: "Apprenez Cybelis en quelques minutes", href: "#", color: "text-purple-600 bg-purple-50 border-purple-200" },
          { icon: Mail, label: "Contacter le support", description: "contact@cybelis.ma", href: "mailto:contact@cybelis.ma", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
        ].map(({ icon: Icon, label, description, href, color }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("mailto") ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="flex items-start gap-3.5 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                {label}
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>
            </div>
          </a>
        ))}
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Questions fréquentes</h2>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {["Tous", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/15"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {filtered.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className={`rounded-2xl bg-white border transition-all ${isOpen ? "border-blue-200 shadow-sm" : "border-slate-200"}`}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-xs font-semibold text-slate-900 flex-1 leading-relaxed">{faq.q}</span>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5">
                    <div className="w-full h-px bg-slate-100 mb-4" />
                    <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Vous n'avez pas trouvé votre réponse ?</h3>
          <p className="text-xs text-slate-500 mt-0.5">Notre équipe est disponible pour vous aider.</p>
        </div>
        <a
          href="mailto:contact@cybelis.ma"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-blue-600/15 whitespace-nowrap flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Contacter le support
        </a>
      </div>
    </div>
  );
}
