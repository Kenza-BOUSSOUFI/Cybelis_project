"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
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

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthPageShell>
      <AuthLogoHeader title="Welcome back" subtitle="Sign in to your Cybelis workspace" />

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
    </AuthPageShell>
  );
}
