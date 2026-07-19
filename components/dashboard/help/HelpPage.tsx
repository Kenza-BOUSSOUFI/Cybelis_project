"use client";

import React, { useState } from "react";
import { BookOpen, MessageSquare, CheckCircle, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";

export function HelpCenterPage() {
  const [openDocIdx, setOpenDocIdx] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("technical");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [activeTickets, setActiveTickets] = useState([
    { id: "CY-8291", subject: "Question sur le renouvellement SSL Let's Encrypt", category: "Technical", date: "02/07/2026", status: "Répondu" }
  ]);

  const toggleDoc = (idx: number) => {
    setOpenDocIdx(openDocIdx === idx ? null : idx);
  };

  const submitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;

    const newTicketId = `CY-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket = {
      id: newTicketId,
      subject: ticketSubject,
      category: ticketCategory.charAt(0).toUpperCase() + ticketCategory.slice(1),
      date: new Date().toLocaleDateString("fr-FR"),
      status: "En attente"
    };

    setActiveTickets(prev => [newTicket, ...prev]);
    setTicketSubmitted(true);
    setTicketSubject("");
    setTicketMessage("");

    setTimeout(() => {
      setTicketSubmitted(false);
    }, 4000);
  };

  const kbArticles = [
    {
      title: "Comment renouveler automatiquement un certificat SSL ?",
      content: "Pour automatiser le renouvellement de vos certificats SSL gratuits Let's Encrypt, nous recommandons d'utiliser Certbot avec une tâche Cron. Sur votre serveur Debian/Ubuntu, exécutez 'sudo certbot renew --dry-run' pour tester le démon de renouvellement. Certbot planifie par défaut un cronjob dans '/etc/cron.d/certbot' qui s'exécute deux fois par jour pour renouveler tout certificat arrivant à moins de 30 jours de son expiration."
    },
    {
      title: "Comment configurer Strict-Transport-Security (HSTS) ?",
      content: "HSTS force les navigateurs à interagir avec votre site uniquement via HTTPS. Pour l'activer, vous devez ajouter l'en-tête HSTS dans les fichiers de configuration de votre serveur. Sur Nginx: add_header Strict-Transport-Security 'max-age=31536000; includeSubDomains; preload' always; Sur Apache: Header always set Strict-Transport-Security 'max-age=31536000; includeSubDomains; preload'. Notez qu'une fois activé, les navigateurs refuseront les connexions HTTP non chiffrées."
    },
    {
      title: "Comment publier une politique DNS DMARC sécurisée ?",
      content: "DMARC s'appuie sur SPF et DKIM pour authentifier les e-mails. Vous devez créer un enregistrement TXT DNS sous l'hôte '_dmarc.votre-domaine.ma' avec la valeur : 'v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@votre-domaine.ma;'. La directive 'p=quarantine' demande aux serveurs de placer en spam les messages frauduleux, tandis que 'p=reject' les bloque définitivement. Nous vous recommandons de commencer avec 'p=none' pour observer les rapports avant d'activer le blocage."
    },
    {
      title: "Qu'est-ce que l'attribut SameSite sur les cookies ?",
      content: "L'attribut SameSite contrôle si les cookies sont envoyés avec des requêtes transverses, protégeant ainsi vos cookies contre les attaques CSRF (Cross-Site Request Forgery). Les trois valeurs possibles sont Strict (cookie uniquement envoyé vers le site d'origine), Lax (valeur recommandée par défaut, le cookie est envoyé lors des navigations normales) et None (nécessite le flag Secure pour fonctionner en HTTPS)."
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Centre d'Aide & Documentation</h1>
        <p className="text-xs text-neutral-400">Trouvez des tutoriels techniques pour corriger vos vulnérabilités ou contactez le support.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Knowledge Base Accordions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Guides de Remédiation</h3>
          </div>

          <div className="space-y-4">
            {kbArticles.map((article, idx) => {
              const isOpen = openDocIdx === idx;
              return (
                <div 
                  key={idx} 
                  className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-900 transition-colors"
                >
                  <button
                    onClick={() => toggleDoc(idx)}
                    className="w-full flex items-center justify-between text-left font-bold text-xs text-white hover:text-indigo-400 transition-colors"
                  >
                    <span>{article.title}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                  </button>
                  
                  {isOpen && (
                    <p className="mt-3 text-xs text-neutral-400 leading-relaxed border-t border-neutral-850 pt-3">
                      {article.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Support Ticket Form */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Ticket Submission Form */}
          <div className="p-6 rounded-3xl bg-neutral-900/40 border border-neutral-900 space-y-6">
            
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ouvrir un Ticket de Support</h3>
            </div>

            {ticketSubmitted ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <h5 className="font-bold text-white text-xs">Ticket Enregistré !</h5>
                <p className="text-[10px] text-neutral-400 leading-normal">
                  Votre demande a été attribuée à notre équipe technique. Un e-mail de confirmation vous a été envoyé.
                </p>
              </div>
            ) : (
              <form onSubmit={submitTicket} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase">Catégorie</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="technical">Problème Technique</option>
                      <option value="billing">Facturation / Offre</option>
                      <option value="api">Questions API</option>
                      <option value="other">Autre demande</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase font-semibold">Priorité</label>
                    <span className="block px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-indigo-400 font-bold font-mono">
                      STANDARD
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">Sujet de votre demande</label>
                  <input 
                    type="text" 
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="ex: Problème d'analyse de mon sitemap"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-850 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">Message détaillé</label>
                  <textarea 
                    rows={4}
                    required
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Expliquez votre problème ici..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-850 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500" 
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Envoyer la demande</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </form>
            )}

          </div>

          {/* Active tickets tracking list */}
          <div className="p-6 rounded-3xl bg-neutral-900/40 border border-neutral-900 space-y-4">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Suivi de vos demandes :</h4>
            
            <div className="space-y-2">
              {activeTickets.map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-850 flex items-center justify-between text-xs gap-3">
                  <div className="overflow-hidden">
                    <span className="font-mono text-[9px] text-neutral-500 font-bold block">{t.id} • {t.category}</span>
                    <span className="font-semibold text-white block truncate">{t.subject}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                    t.status === "Répondu" 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
