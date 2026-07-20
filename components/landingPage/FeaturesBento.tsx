"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Lock, Globe2, Zap, FileSearch, Network } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const cells = [
  {
    icon: ShieldAlert,
    tag: "Vulnerabilities",
    title: "Vulnerability Detection",
    body: "Automated identification of OWASP Top 10 flaws: SQL injection, cross-site scripting (XSS), and cross-site request forgery (CSRF). Each vector is ranked by CVSS severity and paired with an actionable remediation path.",
    accent: "from-blue-600/10 to-cyan-500/5",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
    size: "lg:col-span-2",
  },
  {
    icon: Lock,
    tag: "Cryptography",
    title: "TLS/SSL Analysis",
    body: "X.509 certificate chain validation, detection of obsolete protocols (SSLv3, TLS 1.0/1.1), weak cipher suite checks, and certificate transparency (CT Logs) verification via OpenSSL.",
    accent: "from-cyan-600/10 to-blue-500/5",
    border: "border-cyan-500/20",
    iconColor: "text-cyan-400",
    size: "lg:col-span-1",
  },
  {
    icon: Globe2,
    tag: "HTTP",
    title: "HTTP Headers Audit",
    body: "Full review of security header policies: HSTS, Content-Security-Policy, X-Frame-Options, Referrer-Policy, Permissions-Policy. Each missing or misconfigured setting triggers a warning with a fix example.",
    accent: "from-indigo-600/10 to-blue-500/5",
    border: "border-indigo-500/20",
    iconColor: "text-indigo-400",
    size: "lg:col-span-1",
  },
  {
    icon: FileSearch,
    tag: "DNS",
    title: "Email Authentication",
    body: "Verification of SPF, DKIM, and DMARC records to prevent domain spoofing and targeted phishing attacks.",
    accent: "from-sky-600/10 to-cyan-500/5",
    border: "border-sky-500/20",
    iconColor: "text-sky-400",
    size: "lg:col-span-1",
  },
  {
    icon: Zap,
    tag: "Scoring",
    title: "Overall Security Score",
    body: "A synthetic risk index calculated from the weighted results of 14 analysis modules. Track how your security posture evolves over time.",
    accent: "from-blue-600/10 to-indigo-500/5",
    border: "border-blue-500/20",
    iconColor: "text-blue-300",
    size: "lg:col-span-2",
  },
];

export function FeaturesBento() {
  return (
    <section className="bg-[#09112a] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={fadeUp}
          className="mb-12 text-center"
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400">
            Analysis modules
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Complete technical coverage.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400 max-w-xl mx-auto">
            Each scan activates 14 specialized modules simultaneously to assess your entire exposed attack surface.
          </p>
        </motion.div>

        {/* Bento grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={stagger}
          className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
        >
          {cells.map(({ icon: Icon, tag, title, body, accent, border, iconColor, size }) => (
            <motion.article
              key={title}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 200, damping: 22 } }}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${accent} ${border} p-6 cursor-default ${size}`}
            >
              {/* Corner glow */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/[0.03] blur-2xl" />

              {/* Icon + tag row */}
              <div className="flex items-center justify-between mb-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/8 ${iconColor}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {tag}
                </span>
              </div>

              <h3 className="text-base font-semibold text-white tracking-tight mb-2">
                {title}
              </h3>
              <p className="text-sm leading-6 text-slate-400">
                {body}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
