"use client";

import React, { useState } from "react";
import { Settings, Bell, Lock, Trash2, CheckCircle } from "lucide-react";
import { MOCK_USER } from "@/lib/mock-data";

type SettingsTab = "account" | "notifications" | "security";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [saved, setSaved] = useState(false);

  // Account form state
  const [name, setName] = useState(MOCK_USER.name);
  const [email, setEmail] = useState(MOCK_USER.email);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    scanComplete: true,
    criticalAlert: true,
    weeklyReport: false,
    marketing: false,
  });

  const toggleNotif = (key: keyof typeof notifPrefs) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // TODO: persist via API
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "account", label: "Compte", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Sécurité", icon: Lock },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Paramètres</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gérez votre compte et vos préférences.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === id
                ? "bg-white text-blue-700 shadow-sm border border-blue-100"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Account */}
      {activeTab === "account" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-900">Informations du compte</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Rôle</label>
              <input type="text" value={MOCK_USER.role} readOnly className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-500 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Plan actuel</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-sm font-bold text-blue-700">{MOCK_USER.plan}</span>
                <span className="text-[10px] text-blue-500 font-mono">• Actif</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-blue-600/15"
            >
              Enregistrer les modifications
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle className="w-4 h-4" /> Modifications sauvegardées
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tab: Notifications */}
      {activeTab === "notifications" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-900">Préférences de notification</h2>

          <div className="space-y-3">
            {[
              { key: "scanComplete" as const, label: "Scan terminé", description: "Recevoir une alerte lorsqu'un scan est complété." },
              { key: "criticalAlert" as const, label: "Alerte critique", description: "Notification immédiate en cas de faille critique détectée." },
              { key: "weeklyReport" as const, label: "Rapport hebdomadaire", description: "Résumé des analyses de la semaine chaque lundi." },
              { key: "marketing" as const, label: "Actualités Cybelis", description: "Nouveautés, conseils et mises à jour de la plateforme." },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-semibold text-slate-900">{label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{description}</div>
                </div>
                <button
                  onClick={() => toggleNotif(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${notifPrefs[key] ? "bg-blue-600" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${notifPrefs[key] ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-blue-600/15"
          >
            Sauvegarder les préférences
          </button>
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Changer le mot de passe</h2>
            {["Mot de passe actuel", "Nouveau mot de passe", "Confirmer le nouveau mot de passe"].map((label) => (
              <div key={label} className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            ))}
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-blue-600/15"
            >
              Mettre à jour le mot de passe
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-red-700 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Zone de danger
            </h2>
            <p className="text-xs text-red-600">La suppression du compte est irréversible et entraîne la perte de toutes vos données.</p>
            <button className="px-4 py-2 rounded-lg bg-white border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white transition-colors">
              Supprimer mon compte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
