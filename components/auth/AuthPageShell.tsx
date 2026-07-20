"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

export const authStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

export const authFadeUp = fadeUp;

export const authInputCx =
  "w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 border border-sky-100 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200/60 transition-all";

export const authCardCx =
  "relative overflow-hidden rounded-2xl border border-white/80 bg-white/75 p-7 shadow-[0_20px_50px_-24px_rgba(56,189,248,0.22)] backdrop-blur-md ring-1 ring-sky-100/60";

export const authButtonCx =
  "w-full py-3 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-sky-200/60 hover:from-sky-500 hover:to-cyan-500 disabled:opacity-60 transition-all";

interface AuthPageShellProps {
  children: React.ReactNode;
  staggerDelay?: number;
}

export function AuthPageShell({ children, staggerDelay = 0.09 }: AuthPageShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f8fbff] font-sans text-slate-900 selection:bg-sky-400 selection:text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-sky-50/40 to-cyan-50/30" />
      <div className="pointer-events-none absolute -right-20 -top-28 h-96 w-96 rounded-full bg-sky-200/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-cyan-100/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-[32rem] -translate-x-1/2 translate-y-1/3 rounded-full bg-sky-100/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/40 to-transparent" />

      <header className="relative z-10 px-6 pb-2 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition-colors hover:text-sky-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to site
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: staggerDelay, delayChildren: 0.1 } },
          }}
          className="w-full max-w-sm"
        >
          {children}
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-sky-100/80 py-5 text-center text-[10px] text-slate-400">
        2026 Cybelis - Web Security Audits for SMEs
      </footer>
    </div>
  );
}

export function AuthCardReflection() {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-2xl bg-gradient-to-b from-sky-50/50 to-transparent" />
      <div className="pointer-events-none absolute -right-8 top-6 h-24 w-24 rounded-full bg-cyan-100/30 blur-2xl" />
    </>
  );
}

function LogoHexAccent({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 28" aria-hidden="true" className={className} fill="none">
      <path
        d="M12 1.5 21.5 6.75v10.5L12 22.5 2.5 17.25V6.75L12 1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function AuthLogoHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div variants={fadeUp} className="mb-8 text-center">
      <div className="mb-5 flex justify-center">
        <div className="relative">
          <LogoHexAccent className="pointer-events-none absolute -left-5 top-1/2 h-14 w-12 -translate-y-1/2 text-cyan-400/20" />
          <LogoHexAccent className="pointer-events-none absolute -right-5 top-1/2 h-14 w-12 -translate-y-1/2 text-cyan-400/20" />

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f2d4f] via-[#0a2340] to-[#061528] px-7 py-4 shadow-[0_16px_44px_-14px_rgba(6,21,40,0.65)] ring-1 ring-cyan-300/20">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-transparent" />
            <div className="pointer-events-none absolute -left-4 top-0 h-16 w-16 rounded-full bg-cyan-400/10 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-12 w-12 rounded-full bg-sky-500/10 blur-xl" />
            <LogoHexAccent className="pointer-events-none absolute left-3 top-1/2 h-10 w-9 -translate-y-1/2 text-cyan-300/10" />

            <img
              src="/logo.png"
              alt="Cybelis"
              className="relative z-10 mx-auto block h-9 w-auto origin-center scale-[2.15]"
            />
          </div>
        </div>
      </div>
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
    </motion.div>
  );
}
