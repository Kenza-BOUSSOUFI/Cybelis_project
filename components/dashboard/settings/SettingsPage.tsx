"use client";

import React, { useState } from "react";
import { User, Lock, Key, Plus, Copy, Trash2, Check, ShieldAlert } from "lucide-react";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "api">("profile");

  // Profile form state
  const [profileName, setProfileName] = useState("Kenza Boussoufi");
  const [profileEmail, setProfileEmail] = useState("kenza@clarveon.ma");
  const [profileCompany, setProfileCompany] = useState("Clarveon Tech");
  const [profileRole, setProfileRole] = useState("Lead Security Analyst");
  const [profileSaved, setProfileSaved] = useState(false);

  // Security form state
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [securitySaved, setSecuritySaved] = useState(false);

  // API keys state
  const [apiKeys, setApiKeys] = useState([
    { id: "key_1", name: "Production Pipeline (CI/CD)", key: "cyb_live_8f3a...92b1", created: "12/05/2026" },
    { id: "key_2", name: "Staging Auto-Scan", key: "cyb_test_1e9c...44a0", created: "01/06/2026" }
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKeyText, setGeneratedKeyText] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const saveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSecuritySaved(true);
    setCurrPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setSecuritySaved(false), 3000);
  };

  const generateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const rawToken = `cyb_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const maskedKey = `${rawToken.substring(0, 12)}...${rawToken.substring(rawToken.length - 4)}`;

    const newEntry = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      key: maskedKey,
      created: new Date().toLocaleDateString("fr-FR")
    };

    setApiKeys(prev => [newEntry, ...prev]);
    setGeneratedKeyText(rawToken);
    setNewKeyName("");
  };

  const revokeApiKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  const copyToClipboardSimulated = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const inputCls = "w-full px-3 py-2 rounded-md bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900";

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Paramètres du Compte</h1>
          <p className="text-xs text-slate-500">Configurez votre profil d'utilisateur, sécurisez vos accès, ou gérez vos tokens d'API.</p>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex gap-1 p-1 rounded-md bg-slate-50 border border-slate-200 text-xs self-start max-w-md">
        <button
          onClick={() => { setActiveTab("profile"); setGeneratedKeyText(null); }}
          className={`px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1.5 justify-center ${activeTab === "profile" ? "bg-white text-slate-900 shadow-sm border border-slate-200/60" : "text-slate-600 hover:text-slate-900"}`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profil</span>
        </button>
        <button
          onClick={() => { setActiveTab("security"); setGeneratedKeyText(null); }}
          className={`px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1.5 justify-center ${activeTab === "security" ? "bg-white text-slate-900 shadow-sm border border-slate-200/60" : "text-slate-600 hover:text-slate-900"}`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Sécurité</span>
        </button>
        <button
          onClick={() => { setActiveTab("api"); setGeneratedKeyText(null); }}
          className={`px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1.5 justify-center ${activeTab === "api" ? "bg-white text-slate-900 shadow-sm border border-slate-200/60" : "text-slate-600 hover:text-slate-900"}`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>API Keys</span>
        </button>
      </div>

      {/* TAB CONTENT PANEL */}
      <div className="p-5 rounded-lg bg-white border border-slate-200/80 min-h-[400px] shadow-sm">

        {/* PROFILE CONFIG */}
        {activeTab === "profile" && (
          <form onSubmit={saveProfile} className="space-y-4 max-w-xl">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Informations du Profil</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Mettez à jour vos coordonnées professionnelles.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-slate-400 uppercase font-mono">Nom Complet</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-slate-400 uppercase font-mono">Adresse Email</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-slate-400 uppercase font-mono">Entreprise</label>
                <input
                  type="text"
                  value={profileCompany}
                  onChange={(e) => setProfileCompany(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-slate-400 uppercase font-mono">Rôle / Fonction</label>
                <input
                  type="text"
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <button
                type="submit"
                className="h-9 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Enregistrer les modifications
              </button>
              {profileSaved && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-500" /> Modifications enregistrées !
                </span>
              )}
            </div>
          </form>
        )}

        {/* SECURITY CONFIG */}
        {activeTab === "security" && (
          <form onSubmit={saveSecurity} className="space-y-4 max-w-xl">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mot de passe & Authentification</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Sécurisez l'accès à votre espace d'administration.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-slate-400 uppercase font-mono">Mot de passe actuel</label>
                <input
                  type="password"
                  required
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-400 uppercase font-mono">Nouveau mot de passe</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-400 uppercase font-mono">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-6">
              <div className="space-y-0.5 max-w-sm">
                <span className="block text-xs font-bold text-slate-900">Double Authentification (2FA)</span>
                <p className="text-[10.5px] text-slate-500 leading-normal">Ajoute un jeton OTP requis lors de vos connexions.</p>
              </div>
              <button
                type="button"
                onClick={() => setTfaEnabled(!tfaEnabled)}
                className={`w-10 h-5 rounded-full p-0.5 flex items-center transition-colors focus:outline-none ${
                  tfaEnabled ? "bg-slate-900" : "bg-slate-200"
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${tfaEnabled ? "translate-x-5" : ""}`} />
              </button>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <button
                type="submit"
                className="h-9 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Mettre à jour la sécurité
              </button>
              {securitySaved && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-500" /> Sécurité mise à jour !
                </span>
              )}
            </div>
          </form>
        )}

        {/* DEVELOPER API KEYS CONSOLE */}
        {activeTab === "api" && (
          <div className="space-y-5">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Clés d'API Développeur</h3>
                <p className="text-[10px] text-slate-450 mt-0.5">Générez des tokens d'API pour interroger le Clarveon Scan Engine depuis vos scripts.</p>
              </div>

              {/* Generate Key Input form */}
              <form onSubmit={generateApiKey} className="flex items-center gap-2 max-w-md w-full">
                <input
                  type="text"
                  placeholder="Nom de la clé (ex: Jenkins API)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className={inputCls}
                />
                <button
                  type="submit"
                  className="h-9 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Générer</span>
                </button>
              </form>
            </div>

            {/* Generated display banner */}
            {generatedKeyText && (
              <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-100 space-y-2 animate-slide-in">
                <div className="flex items-center gap-2 text-blue-900 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-blue-600" />
                  <span>Note Importante : Clé générée avec succès !</span>
                </div>
                <p className="text-[10px] text-slate-600">
                  Copiez cette clé maintenant. Pour des raisons de sécurité, nous ne l'afficherons plus par la suite.
                </p>
                <div className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-white justify-between select-all">
                  <span className="break-all">{generatedKeyText}</span>
                  <button
                    onClick={() => copyToClipboardSimulated("gen", generatedKeyText)}
                    className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
                  >
                    {copiedKeyId === "gen" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* API Keys Table */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase font-mono">Vos clés actives :</h4>

              <div className="rounded-lg border border-slate-200/80 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-bold">Nom</th>
                        <th className="px-4 py-3 font-bold">Clé d'API</th>
                        <th className="px-4 py-3 font-bold">Date de création</th>
                        <th className="px-4 py-3 font-bold">Statut</th>
                        <th className="px-4 py-3 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {apiKeys.map((k) => (
                        <tr key={k.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">{k.name}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{k.key}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{k.created}</td>
                          <td className="px-4 py-3">
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-mono font-bold">
                              ACTIF
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => revokeApiKey(k.id)}
                              className="p-1.5 rounded border border-slate-200/80 bg-white hover:bg-red-50 hover:text-red-600 text-slate-500 transition-colors shadow-sm"
                              title="Révoquer le jeton"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
