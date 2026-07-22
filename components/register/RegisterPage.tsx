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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      phone: phone || undefined,
      options: {
        data: {
          full_name: name,
          company: company,
          phone: phone || undefined,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    setSuccessMessage("Account created successfully! Redirecting to login...");
    setIsLoading(false);
    setTimeout(() => {
      router.push("/login");
    }, 2500);
  };

  return (
    <AuthPageShell staggerDelay={0.08}>
      <AuthLogoHeader title="Create your account" subtitle="Scan your Websites and get reports for free" />

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

        <form onSubmit={handleRegister} className="relative space-y-4">
          <Field label="Full name" icon={<User className="h-4 w-4" />}>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className={authInputCx}
            />
          </Field>

          <Field label="Company" icon={<Building2 className="h-4 w-4" />}>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company"
              className={authInputCx}
            />
          </Field>

          <Field label="Phone number" icon={<Phone className="h-4 w-4" />}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+212 600-000000"
              className={authInputCx}
            />
          </Field>

          <Field label="Email address" icon={<Mail className="h-4 w-4" />}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={authInputCx}
            />
          </Field>

          <Field label="Password" icon={<Lock className="h-4 w-4" />}>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
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
              I agree to the{" "}
              <a href="#" className="text-sky-600 transition-colors hover:text-sky-500">
                Terms of Use
              </a>{" "}
              and the{" "}
              <a href="#" className="text-sky-600 transition-colors hover:text-sky-500">
                Privacy Policy
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
                Creating account...
              </>
            ) : (
              <>
                Create my account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>

        <p className="relative mt-6 text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-sky-600 transition-colors hover:text-sky-500">
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthPageShell>
  );
}
