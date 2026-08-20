"use client";

import React, { useState } from "react";
import { CreditCard, Check, Download, CheckCircle, X } from "lucide-react";

export function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [activePlan, setActivePlan] = useState("Free");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<any>(null);

  // Checkout form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  // Invoices mock
  const [invoices, setInvoices] = useState([
    { id: "INV-2026-001", date: "01/07/2026", amount: "0 DH", status: "Payé", plan: "Plan Free" },
    { id: "INV-2026-002", date: "01/06/2026", amount: "0 DH", status: "Payé", plan: "Plan Free" }
  ]);

  const pricingTiers = [
    {
      name: "Free",
      price: 0,
      desc: "Idéal pour les PME et audits ponctuels",
      features: [
        "Audit ponctuel gratuit",
        "14 outils d'analyse MVP",
        "Calcul du score de sécurité",
        "Export PDF standard"
      ],
      cta: "Plan Actuel"
    },
    {
      name: "Pro",
      price: billingCycle === "monthly" ? 490 : 390,
      desc: "Sécurité continue pour vos applications en ligne",
      features: [
        "Tout le plan Free inclus",
        "Scans planifiés hebdomadaires",
        "Alertes de sécurité instantanées",
        "Historique des analyses illimité",
        "Jusqu'à 5 sites web monitorés",
        "Support par email prioritaire"
      ],
      cta: "Passer à l'offre Pro"
    },
    {
      name: "Business",
      price: billingCycle === "monthly" ? 1490 : 1190,
      desc: "La formule ultime pour les agences et développeurs",
      features: [
        "Tout le plan Pro inclus",
        "Sites web monitorés illimités",
        "Rapports PDF personnalisables (Marque Blanche)",
        "Accès à l'API publique Clarveon",
        "Intégrations Slack & Teams",
        "Support téléphonique dédié"
      ],
      cta: "Contacter le support"
    }
  ];

  const handleCheckout = (tier: any) => {
    if (tier.name === "Free" || tier.name === "Business") return;
    setCheckoutPlan(tier);
    setShowCheckoutModal(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setPaySuccess(true);
      setActivePlan("Pro");

      // Add invoice
      const newInvoice = {
        id: `INV-2026-00${invoices.length + 1}`,
        date: new Date().toLocaleDateString("fr-FR"),
        amount: billingCycle === "monthly" ? "490 DH" : "4 680 DH",
        status: "Payé",
        plan: "Plan Pro"
      };
      setInvoices(prev => [newInvoice, ...prev]);

      setTimeout(() => {
        setPaySuccess(false);
        setShowCheckoutModal(false);
        // Reset card details
        setCardNumber("");
        setCardExpiry("");
        setCardCvv("");
        setCardName("");
      }, 2000);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Facturation & Abonnements</h1>
        <p className="text-xs text-neutral-400">Gérez votre offre actuelle, examinez vos factures, ou optez pour une offre supérieure.</p>
      </div>

      {/* ACTIVE PLAN INFOBAR */}
      <div className="p-6 rounded-3xl bg-neutral-900/40 border border-neutral-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase font-mono font-semibold">Abonnement actif</span>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Plan {activePlan}
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[9px] font-mono font-semibold">
                ACTIF
              </span>
            </h3>
          </div>
        </div>

        <div className="text-xs text-neutral-400">
          Prochaine facturation : <span className="text-white font-mono font-semibold">01/08/2026</span> (Renouvellement automatique)
        </div>
      </div>

      {/* INTERVAL TOGGLER */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-xs ${billingCycle === "monthly" ? "text-white font-semibold" : "text-neutral-500"}`}>Facturation mensuelle</span>
        <button
          onClick={() => setBillingCycle(prev => prev === "monthly" ? "yearly" : "monthly")}
          className="w-11 h-6 rounded-full bg-neutral-800 p-1 flex items-center transition-colors focus:outline-none"
        >
          <div className={`w-4 h-4 rounded-full bg-indigo-500 transition-transform ${billingCycle === "yearly" ? "translate-x-5" : ""}`} />
        </button>
        <span className={`text-xs ${billingCycle === "yearly" ? "text-white font-semibold" : "text-neutral-500"} flex items-center gap-1.5`}>
          Facturation annuelle
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[9px] font-bold font-mono">
            -20%
          </span>
        </span>
      </div>

      {/* PRICING GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {pricingTiers.map((tier) => {
          const isCurrentPlan = activePlan === tier.name;
          return (
            <div
              key={tier.name}
              className={`p-6 rounded-3xl bg-neutral-900/40 border flex flex-col justify-between gap-6 relative transition-all ${isCurrentPlan
                  ? "border-indigo-500 shadow-xl shadow-indigo-500/5 bg-gradient-to-b from-indigo-950/20 to-neutral-900/40"
                  : "border-neutral-900 hover:border-neutral-800"
                }`}
            >
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-white uppercase tracking-wider">{tier.name}</h4>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-normal">{tier.desc}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white font-mono">{tier.price} DH</span>
                  <span className="text-xs text-neutral-500">/{billingCycle === "monthly" ? "mois" : "an"}</span>
                </div>

                <div className="border-t border-neutral-850 pt-4 space-y-3.5 text-xs">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-neutral-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {isCurrentPlan ? (
                <div className="w-full py-3 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-400 text-xs font-semibold text-center select-none">
                  Abonnement Actuel
                </div>
              ) : (
                <button
                  onClick={() => handleCheckout(tier)}
                  className={`w-full py-3 rounded-xl text-xs font-semibold text-center transition-colors ${tier.name === "Business"
                      ? "bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-white"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                >
                  {tier.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* BILLING HISTORY */}
      <div className="p-6 rounded-3xl bg-neutral-900/40 border border-neutral-900 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-white">Historique de Facturation</h3>
          <p className="text-[10px] text-neutral-500">Visualisez et téléchargez vos factures passées.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] font-mono text-neutral-500 uppercase border-b border-neutral-800/80">
              <tr>
                <th className="pb-3.5 font-semibold">Identifiant facture</th>
                <th className="pb-3.5 font-semibold">Date d'émission</th>
                <th className="pb-3.5 font-semibold">Offre facturée</th>
                <th className="pb-3.5 font-semibold">Montant TTC</th>
                <th className="pb-3.5 font-semibold">Statut</th>
                <th className="pb-3.5 font-semibold text-right">Pièce jointe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900 text-neutral-300">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-4 font-mono font-semibold text-white">{inv.id}</td>
                  <td className="py-4 text-neutral-400 font-mono">{inv.date}</td>
                  <td className="py-4">{inv.plan}</td>
                  <td className="py-4 font-mono">{inv.amount}</td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/15">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:underline">
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHECKOUT MODAL OVERLAY */}
      {showCheckoutModal && checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl relative space-y-6">

            {/* Close button */}
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded bg-neutral-950 border border-neutral-850 text-neutral-400"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center mx-auto text-indigo-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Souscription à l'Offre {checkoutPlan.name}</h3>
              <p className="text-[10px] text-neutral-500">Renseignez vos coordonnées de paiement.</p>
            </div>

            {paySuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h5 className="font-bold text-white text-sm">Paiement Réussi !</h5>
                <p className="text-xs text-neutral-400">Votre compte a été surclassé à l'offre Pro.</p>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">

                {/* Total due badge */}
                <div className="flex justify-between items-center p-3 rounded-xl bg-neutral-950 border border-neutral-850 font-mono text-xs">
                  <span className="text-neutral-500">Montant dû :</span>
                  <span className="font-bold text-white">{checkoutPlan.price} DH / {billingCycle === "monthly" ? "mois" : "an"}</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">Titulaire de la carte</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-850 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">Numéro de carte</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4000 1234 5678 9010"
                    maxLength={19}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-850 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase">Expiration</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/AA"
                      maxLength={5}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-850 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase">Cryptogramme (CVV)</label>
                    <input
                      type="password"
                      required
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                      maxLength={3}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-850 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPaying}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {isPaying ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Autorisation bancaire...</span>
                    </>
                  ) : (
                    <>
                      <span>Payer et s'abonner</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
