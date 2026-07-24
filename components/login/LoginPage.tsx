"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccessMessage("Votre adresse e-mail a été vérifiée avec succès ! Vous pouvez maintenant vous connecter.");
    }
    const err = searchParams.get("error");
    if (err) {
      setError(decodeURIComponent(err));
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setError("Votre adresse e-mail n'a pas encore été vérifiée. Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation.");
      } else if (authError.message.toLowerCase().includes("invalid login credentials")) {
        setError("Adresse e-mail ou mot de passe incorrect.");
      } else {
        setError(authError.message);
      }
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <motion.div variants={authFadeUp} className={authCardCx}>
      <AuthCardReflection />

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </motion.div>
      )}

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

      <form onSubmit={handleLogin} className="relative space-y-4">
        <motion.div variants={authFadeUp} className="space-y-1.5">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={authInputCx}
            />
          </div>
        </motion.div>

        <motion.div variants={authFadeUp} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Password
            </label>
            <a href="#" className="text-[11px] text-slate-400 transition-colors hover:text-sky-600">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className={authInputCx}
            />
          </div>
        </motion.div>

        <motion.button
          variants={authFadeUp}
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`${authButtonCx} mt-2`}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Verifying...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>
      </form>

      <p className="relative mt-6 text-center text-xs text-slate-500">
        New to the platform?{" "}
        <Link href="/register" className="font-medium text-sky-600 transition-colors hover:text-sky-500">
          Create an account
        </Link>
      </p>
    </motion.div>
  );
}

export function LoginPage() {
  return (
    <AuthPageShell>
      <AuthLogoHeader title="Welcome back" subtitle="Sign in to your Cybelis workspace" />
      <Suspense fallback={<div className="h-48 bg-slate-900/50 rounded-2xl animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </AuthPageShell>
  );
}
