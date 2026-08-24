"use client";

import React, { useEffect, useState } from "react";
import { User, Calendar, Shield, Mail, Building, Phone, Check, AlertCircle, Edit2, Loader2, Save, X } from "lucide-react";

interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  phone: string;
  createdAt: string;
  plan: string;
  initials: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        const json = await res.json();
        if (json.success && json.data?.profile) {
          const p = json.data.profile;
          setProfile(p);
          setFullName(p.fullName);
          setCompanyName(p.companyName);
          setPhone(p.phone);
        } else {
          setError(json.error || "Impossible de charger les informations du profil.");
        }
      } catch {
        setError("Erreur de connexion avec le serveur.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, companyName, phone }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setProfile((prev) =>
          prev
            ? {
              ...prev,
              fullName: json.data.fullName,
              companyName: json.data.companyName,
              phone: json.data.phone || "",
              initials: json.data.fullName
                ? json.data.fullName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                : "U",
            }
            : null
        );
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(json.error || "Erreur lors de la mise à jour du profil.");
      }
    } catch {
      alert("Erreur de réseau lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-xs font-medium text-slate-500">Chargement de votre profil…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto py-12 p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center gap-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900">Une erreur est survenue</h3>
          <p className="text-xs text-slate-500 max-w-xs">{error || "Impossible d'accéder au profil."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mon Profil</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gérez vos informations personnelles et votre compte.</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> Vos informations ont été mises à jour avec succès !
        </div>
      )}

      {/* Main Profile Card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">

        {/* Top Banner & Avatar Header */}
        <div className="p-6 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0 ring-4 ring-white">
            <User className="w-10 h-10 text-white stroke-[1.75]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">{profile.fullName}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{profile.companyName || "Entreprise non spécifiée"}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              Plan {profile.plan}
            </div>
          </div>
          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setFullName(profile.fullName);
              setCompanyName(profile.companyName);
              setPhone(profile.phone);
            }}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
          >
            {isEditing ? (
              <><X className="w-3.5 h-3.5 text-slate-500" /> Annuler</>
            ) : (
              <><Edit2 className="w-3.5 h-3.5 text-slate-500" /> Modifier mes infos</>
            )}
          </button>
        </div>

        {/* Profile Form / Info Body */}
        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nom complet</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 shadow-sm">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Votre nom complet"
                    className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nom de l'entreprise</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 shadow-sm">
                  <Building className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nom de votre entreprise"
                    className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Numéro de téléphone</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 shadow-sm">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ex: +33 6 12 34 56 78"
                    className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-blue-600/15 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer les modifications
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Mail className="w-4 h-4 text-slate-400" /> Adresse e-mail
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">{profile.email}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Building className="w-4 h-4 text-slate-400" /> Entreprise
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">{profile.companyName || "Non renseignée"}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Phone className="w-4 h-4 text-slate-400" /> Téléphone
                </div>
                <p className="text-sm font-bold text-slate-900">{profile.phone || "Non renseigné"}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Calendar className="w-4 h-4 text-slate-400" /> Date d'inscription
                </div>
                <p className="text-sm font-bold text-slate-900">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
