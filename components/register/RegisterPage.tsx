"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Building2, ArrowRight } from "lucide-react";
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
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <AuthPageShell staggerDelay={0.08}>
      <AuthLogoHeader title="Create your account" subtitle="Scan your Websites and get reports for free" />

      <motion.div variants={authFadeUp} className={authCardCx}>
        <AuthCardReflection />

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
