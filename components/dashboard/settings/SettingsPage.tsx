"use client";

import React, { useState } from "react";
import { User, Lock, Key, Check, Plus, Trash2, ShieldAlert, Copy } from "lucide-react";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "api">("profile");

  // Profile Form States
  const [profileName, setProfileName] = useState("Amina Marzak");
  const [profileEmail, setProfileEmail] = useState("amina.marzak@cybelis.ma");
  const [profileCompany, setProfileCompany] = useState("HBS Management");
  const [profileRole, setProfileRole] = useState("Administrateur Sécurité");
  const [profileSaved, setProfileSaved] = useState(false);

  // Security Form States
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [securitySaved, setSecuritySaved] = useState(false);

  // API Keys Console States
  const [apiKeys, setApiKeys] = useState([
    { id: "1", name: "Production Server", key: "cy_live_9a7d2b8c...4f1e", created: "01/07/2026", active: true },
    { id: "2", name: "Staging Pipeline", key: "cy_live_1d4e6f9a...8b2c", created: "28/06/2026", active: true }
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
    if (newPassword && newPassword === confirmPassword) {
      setSecuritySaved(true);
      setCurrPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSecuritySaved(false), 3000);
    }
  };

  const generateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    const randomHex = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const keyString = `cy_live_${randomHex}`;
    
    const newKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `${keyString.slice(0, 12)}...${keyString.slice(-4)}`,
      created: new Date().toLocaleDateString("fr-FR"),
      active: true
    };

    setApiKeys(prev => [newKey, ...prev]);
    setGeneratedKeyText(keyString);
    setNewKeyName("");
  };

  const revokeApiKey = (id: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== id));
  };

  const copyToClipboardSimulated = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Paramètres du Compte</h1>
        <p className="text-xs text-neutral-400">Configurez votre profil d'utilisateur, sécurisez vos accès, ou gérez vos tokens d'API.</p>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex gap-2 p-1 rounded-xl bg-neutral-900 border border-neutral-800/80 text-xs self-start max-w-md">
        <button
          onClick={() => { setActiveTab("profile"); setGeneratedKeyText(null); }}
          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors flex-items-center gap-2 justify-center ${activeTab === "profile" ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profil</span>
        </button>
        <button
          onClick={() => { setActiveTab("security"); setGeneratedKeyText(null); }}
          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 justify-center ${activeTab === "security" ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Sécurité</span>
        </button>
        <button
          onClick={() => { setActiveTab("api"); setGeneratedKeyText(null); }}
          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 justify-center ${activeTab === "api" ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>API Keys</span>
        </button>
      </div>

      {/* TAB CONTENT PANEL */}
      <div className="p-6 rounded-3xl bg-neutral-900/40 border border-neutral-900 min-h-[400px]">
        
        {/* PROFILE CONFIG */}
        {activeTab === "profile" && (
          <form onSubmit={saveProfile} className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Informations du Profil</h3>
              <p className="text-[10px] text-neutral-500">Mettez à jour vos coordonnées professionnelles.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">Nom Complet</label>
                <input 
                  type="text" 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">Adresse Email</label>
                <input 
                  type="email" 
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">Entreprise</label>
                <input 
                  type="text" 
                  value={profileCompany}
                  onChange={(e) => setProfileCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">Rôle / Fonction</label>
                <input 
                  type="text" 
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <button 
                type="submit" 
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                Enregistrer les modifications
              </button>
              {profileSaved && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-4 h-4" /> Modifications enregistrées !
                </span>
              )}
            </div>
          </form>
        )}

        {/* SECURITY CONFIG */}
        {activeTab === "security" && (
          <form onSubmit={saveSecurity} className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Mot de passe & Authentification</h3>
              <p className="text-[10px] text-neutral-500">Sécurisez l'accès à votre espace d'administration.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">Mot de passe actuel</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••••••"
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">Nouveau mot de passe</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Min. 8 caractères"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">Confirmer le mot de passe</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-6">
              <div className="space-y-0.5 max-w-sm">
                <span className="block text-xs font-bold text-white">Double Authentification (2FA)</span>
                <p className="text-[10px] text-neutral-500">Ajoute un jeton OTP requis lors de vos connexions.</p>
              </div>
              <button
                type="button"
                onClick={() => setTfaEnabled(!tfaEnabled)}
                className={`w-11 h-6 rounded-full p-1 flex items-center transition-colors focus:outline-none ${
                  tfaEnabled ? "bg-indigo-600" : "bg-neutral-800"
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${tfaEnabled ? "translate-x-5" : ""}`} />
              </button>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <button 
                type="submit" 
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                Mettre à jour la sécurité
              </button>
              {securitySaved && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-4 h-4" /> Sécurité mise à jour !
                </span>
              )}
            </div>
          </form>
        )}

        {/* DEVELOPER API KEYS CONSOLE */}
        {activeTab === "api" && (
          <div className="space-y-8">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-850">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Clés d'API Développeur</h3>
                <p className="text-[10px] text-neutral-500">Générez des tokens d'API pour interroger le Cybelis Scan Engine depuis vos scripts.</p>
              </div>

              {/* Generate Key Input form */}
              <form onSubmit={generateApiKey} className="flex gap-2 w-full md:max-w-md">
                <input 
                  type="text" 
                  required
                  placeholder="Nom de la clé (ex: Jenkins API)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500" 
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Générer</span>
                </button>
              </form>
            </div>

            {/* Generated display banner */}
            {generatedKeyText && (
              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2 animate-slide-in">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Note Importante : Clé générée avec succès !</span>
                </div>
                <p className="text-[10px] text-neutral-400">
                  Copiez cette clé maintenant. Pour des raisons de sécurité, nous ne l'afficherons plus par la suite.
                </p>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-white justify-between select-all">
                  <span className="break-all">{generatedKeyText}</span>
                  <button 
                    onClick={() => copyToClipboardSimulated("gen", generatedKeyText)}
                    className="p-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
                  >
                    {copiedKeyId === "gen" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* API Keys Table */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-neutral-400">Vos clés actives :</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] font-mono text-neutral-500 uppercase border-b border-neutral-850">
                    <tr>
                      <th className="pb-3.5 font-semibold">Nom</th>
                      <th className="pb-3.5 font-semibold">Clé d'API</th>
                      <th className="pb-3.5 font-semibold">Date de création</th>
                      <th className="pb-3.5 font-semibold">Statut</th>
                      <th className="pb-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 text-neutral-300">
                    {apiKeys.map((k) => (
                      <tr key={k.id}>
                        <td className="py-4 font-semibold text-white">{k.name}</td>
                        <td className="py-4 font-mono font-semibold text-neutral-400">{k.key}</td>
                        <td className="py-4 font-mono text-neutral-400">{k.created}</td>
                        <td className="py-4">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-mono border border-indigo-500/20 font-bold">
                            ACTIF
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => revokeApiKey(k.id)}
                            className="p-1.5 rounded bg-neutral-950 border border-neutral-850 hover:bg-red-500/10 text-neutral-400 hover:text-red-500 transition-colors"
                            title="Révoquer le jeton"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
