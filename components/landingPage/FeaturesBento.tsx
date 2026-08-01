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
    tag: "Vulnérabilités",
    title: "Détection de vulnérabilités",
    body: "Identification automatisée des failles du Top 10 OWASP : injection SQL, cross-site scripting (XSS) et falsification de requêtes intersites (CSRF). Chaque vecteur est classé par gravité CVSS et accompagné d'une voie de remédiation concrète.",
    accent: "from-blue-600/10 to-cyan-500/5",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
    size: "lg:col-span-2",
  },
  {
    icon: Lock,
    tag: "Cryptographie",
    title: "Analyse TLS/SSL",
    body: "Validation de la chaîne de certificats X.509, détection des protocoles obsolètes (SSLv3, TLS 1.0/1.1), vérification des suites de chiffrement faibles et vérification de la transparence des certificats (CT Logs) via OpenSSL.",
    accent: "from-cyan-600/10 to-blue-500/5",
    border: "border-cyan-500/20",
    iconColor: "text-cyan-400",
    size: "lg:col-span-1",
  },
  {
    icon: Globe2,
    tag: "HTTP",
    title: "Audit des en-têtes HTTP",
    body: "Examen complet des stratégies d'en-tête de sécurité : HSTS, Content-Security-Policy, X-Frame-Options, Referrer-Policy, Permissions-Policy. Chaque paramètre manquant ou mal configuré déclenche un avertissement avec un exemple de correction.",
    accent: "from-indigo-600/10 to-blue-500/5",
    border: "border-indigo-500/20",
    iconColor: "text-indigo-400",
    size: "lg:col-span-1",
  },
  {
    icon: FileSearch,
    tag: "DNS",
    title: "Authentification des e-mails",
    body: "Vérification des enregistrements SPF, DKIM et DMARC pour prévenir l'usurpation de domaine et les attaques de phishing ciblées.",
    accent: "from-sky-600/10 to-cyan-500/5",
    border: "border-sky-500/20",
    iconColor: "text-sky-400",
    size: "lg:col-span-1",
  },
  {
    icon: Zap,
    tag: "Notation",
    title: "Score de sécurité global",
    body: "Un indice de risque synthétique calculé à partir des résultats pondérés de 14 modules d'analyse. Suivez l'évolution de votre posture de sécurité au fil du temps.",
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
            Modules d'analyse
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Couverture technique complète.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400 max-w-xl mx-auto">
            Chaque scan active 14 modules spécialisés simultanément pour évaluer l'ensemble de votre surface d'attaque exposée.
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
