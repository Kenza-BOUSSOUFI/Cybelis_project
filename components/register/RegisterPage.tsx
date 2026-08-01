"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Building2, Phone, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  AuthCardReflection,
  AuthLogoHeader,
  AuthPageShell,
  authButtonCx,
  authCardCx,
  authFadeUp,
  authInputCx,
} from "@/components/auth/AuthPageShell";
import { createClient } from "@/lib/supabase/client";

interface FieldProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Field({ label, icon, children }: FieldProps) {
  return (
    <motion.div variants={authFadeUp} className="space-y-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        {children}
      </div>
    </motion.div>
  );
}

export function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) return;

    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        data: {
          full_name: name,
          company: company,
          phone: phone || undefined,
        },
      },
    });

    if (authError) {
      console.error("Supabase SignUp error:", authError);
      setError(authError.message || (typeof authError === "string" ? authError : JSON.stringify(authError)));
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setIsSuccess(true);
  };

  return (
    <AuthPageShell staggerDelay={0.08}>
      {isSuccess ? (
        <>
          <AuthLogoHeader title="Vérifiez votre boîte e-mail" subtitle={`Un lien de confirmation a été envoyé à ${email}`} />

          <motion.div variants={authFadeUp} className={`${authCardCx} text-center space-y-6`}>
            <AuthCardReflection />

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shadow-inner">
              <Mail className="h-8 w-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-200">Confirmation requise</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Pour des raisons de sécurité, vous devez valider votre adresse e-mail avant de pouvoir accéder à votre espace Cybelis.
              </p>
            </div>

            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3.5 text-[11px] text-slate-400 flex items-center gap-2.5 text-left">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Cliquez sur le lien dans l&apos;e-mail reçu pour activer votre compte.</span>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className={`${authButtonCx} w-full inline-flex items-center justify-center gap-2`}
              >
                Se connecter
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </>
      ) : (
        <>
          <AuthLogoHeader title="Créer votre compte" subtitle="Analysez vos sites web et obtenez des rapports gratuitement" />

          <motion.div variants={authFadeUp} className={authCardCx}>
            <AuthCardReflection />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleRegister} className="relative space-y-4">
              <Field label="Nom complet" icon={<User className="h-4 w-4" />}>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom complet"
                  className={authInputCx}
                />
              </Field>

              <Field label="Entreprise" icon={<Building2 className="h-4 w-4" />}>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Entreprise"
                  className={authInputCx}
                />
              </Field>

              <Field label="Numéro de téléphone" icon={<Phone className="h-4 w-4" />}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212 600-000000"
                  className={authInputCx}
                />
              </Field>

              <Field label="Adresse e-mail" icon={<Mail className="h-4 w-4" />}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@entreprise.com"
                  className={authInputCx}
                />
              </Field>

              <Field label="Mot de passe" icon={<Lock className="h-4 w-4" />}>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className={authInputCx}
                />
              </Field>

              <motion.div variants={authFadeUp} className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="agree"
                  required
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-sky-200 bg-white text-sky-500 focus:ring-sky-300"
                />
                <label htmlFor="agree" className="cursor-pointer select-none text-[11px] leading-normal text-slate-500">
                  J'accepte les{" "}
                  <a href="#" className="text-sky-600 transition-colors hover:text-sky-500">
                    Conditions d'utilisation
                  </a>{" "}
                  et la{" "}
                  <a href="#" className="text-sky-600 transition-colors hover:text-sky-500">
                    Politique de confidentialité
                  </a>
                  .
                </label>
              </motion.div>

              <motion.button
                variants={authFadeUp}
                type="submit"
                disabled={isLoading || !agree}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`${authButtonCx} mt-1 disabled:opacity-50`}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Création du compte...
                  </>
                ) : (
                  <>
                    Créer mon compte
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>

            <p className="relative mt-6 text-center text-xs text-slate-500">
              Déjà inscrit ?{" "}
              <Link href="/login" className="font-medium text-sky-600 transition-colors hover:text-sky-500">
                Se connecter
              </Link>
            </p>
          </motion.div>
        </>
      )}
    </AuthPageShell>
  );
}
