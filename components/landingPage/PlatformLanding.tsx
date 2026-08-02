// @ts-nocheck
"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fadeUp,
  staggerContainer,
  staggerSlow,
  cardVariant,
  slideFromLeft,
  slideFromRight,
} from "./animations";
import {
  Activity, ArrowRight, BarChart3, Blocks, BookOpen, Bot, Check, ChevronDown,
  CircleAlert, Code2, Code2 as Github, Cookie, FileDown, FileText, Globe2, LockKeyhole,
  History, Mail, MapPin, Network, Network as Linkedin, Radar, Search, Send, Server, ShieldCheck,
  Sparkles,
} from "lucide-react";

const reveal = fadeUp;

function SectionHeading({ eyebrow, title, body, align = "center" }: { eyebrow: string; title: string; body?: string; align?: "center" | "left" }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={staggerContainer}
      className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-xl"}
    >
      <motion.p variants={fadeUp} className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</motion.p>
      <motion.h2 variants={fadeUp} className="text-4xl font-semibold tracking-[-0.045em] text-slate-950 md:text-6xl md:leading-[1.02]">{title}</motion.h2>
      {body && <motion.p variants={fadeUp} className="mt-5 text-base leading-7 text-slate-600 md:text-lg">{body}</motion.p>}
    </motion.div>
  );
}

const features = [
  [ShieldCheck, "Analyse de sécurité", "Exécutez des évaluations de sécurité complètes sur vos sites web en combinant plusieurs outils d'analyse automatisés."],
  [BarChart3, "Score de sécurité", "Obtenez un score de sécurité global avec des risques catégorisés et des recommandations concrètes."],
  [FileText, "Rapports détaillés", "Générez des rapports professionnels listant les vulnérabilités, leur gravité et les correctifs prioritaires."],
  [Blocks, "Analyse multi-outils", "SSL, DNS, en-têtes HTTP, cookies, CSP, CORS, SPF, DKIM, DMARC et bien d'autres configurations de sécurité."],
  [History, "Historique des scans", "Suivez les scans précédents, comparez les progrès et surveillez l'évolution de votre posture de sécurité."],
  [FileDown, "Export PDF", "Exportez des rapports PDF professionnels facilement partageables avec vos clients ou vos équipes techniques."],
] as const;

const tools = [
  [LockKeyhole, "Vérificateur SSL", "Santé du certificat et chaîne de confiance.", "TLS"], [ShieldCheck, "Analyseur TLS", "Protocoles et suites de chiffrement.", "TLS"],
  [Server, "En-têtes HTTP", "Protections essentielles du navigateur.", "HTTP"], [Cookie, "Analyseur de Cookies", "Attributs et portée des cookies.", "Confidentialité"],
  [Code2, "Méthodes HTTP", "Méthodes serveur non autorisées.", "HTTP"], [Network, "Analyseur CORS", "Vérifications de la politique cross-origin.", "HTTP"],
  [ShieldCheck, "Validateur CSP", "Examen de la politique de sécurité du contenu.", "En-têtes"], [Search, "Recherche DNS", "Enregistrements, résolution et risques.", "DNS"],
  [Globe2, "Recherche WHOIS", "Informations sur l'enregistrement du domaine.", "Domaine"], [Mail, "SPF / DKIM / DMARC", "Authentification du domaine de messagerie.", "E-mail"],
  [Bot, "Détecteur de Technologie", "Sachez ce qui propulse votre stack.", "Découverte"], [FileText, "Robots.txt", "Configuration de l'accès des robots.", "SEO"],
  [BookOpen, "Vérificateur de Sitemap", "Surface du site indexable.", "SEO"], [ArrowRight, "Analyseur de Redirection", "Visibilité de la chaîne de redirection.", "HTTP"],
] as const;

const faqs = [
  ["Que peut analyser Cybelis ?", "Cybelis évalue la posture de sécurité visible de l'extérieur d'un site web, y compris le TLS, les en-têtes, le DNS, les cookies et les signaux clés de configuration de l'application."],
  ["Cybelis est-il uniquement destiné aux équipes techniques ?", "Non. Les résultats sont expliqués en langage clair et hiérarchisés afin que les dirigeants de PME, les développeurs et les équipes de sécurité puissent agir ensemble."],
  ["À quelle fréquence dois-je lancer un scan ?", "Commencez à chaque déploiement en production ou changement d'infrastructure majeur. La surveillance Pro automatise cette routine en surveillant continuellement vos sites."],
];

const pricingPlans = [
  { name: "Gratuit", description: "Idéal pour les particuliers et les petites entreprises.", price: "Gratuit", features: ["Accès à tous les outils d'analyse de sécurité", "Tableau de bord de sécurité", "Historique des scans", "Génération de rapport PDF", "Score de sécurité global", "Recommandations de sécurité"], cta: "Commencer gratuitement" },
  { name: "Pro", description: "Conçu pour les organisations qui ont besoin d'une surveillance continue de leur site web.", price: "499 DH", features: ["Surveillance continue", "Alertes par e-mail", "Gestion multi-sites", "Historique de scan illimité", "Analyses avancées", "Comparaison du score de sécurité", "Rapports PDF avancés"], cta: "Commencer", highlighted: true },
  { name: "Business", description: "Pour les entreprises gérant plusieurs sites et équipes.", price: "Sur mesure", features: ["Sites illimités", "Collaboration en équipe", "API publique", "Notifications Slack / Teams / Webhook", "Rapports PDF en marque blanche", "Support prioritaire"], cta: "Contacter l'équipe" },
] as const;

function LightSection({ id, children, className = "", pattern = "mesh" }: { id?: string; children: React.ReactNode; className?: string; pattern?: "mesh" | "grid" | "dots" }) {
  return (
    <section id={id} className={`relative isolate overflow-hidden px-6 py-24 md:py-32 ${className}`}>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-sky-50/25 to-white" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_45%_at_50%_-5%,rgba(186,230,253,0.4),transparent)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_0%_60%,rgba(125,211,252,0.12),transparent_32%),radial-gradient(circle_at_100%_40%,rgba(59,130,246,0.08),transparent_28%)]" />
      {pattern === "grid" && <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.45] [background-image:linear-gradient(rgba(37,99,235,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,.035)_1px,transparent_1px)] [background-size:48px_48px]" />}
      {pattern === "dots" && <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(rgba(59,130,246,0.07)_1px,transparent_1px)] [background-size:22px_22px]" />}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/70 to-transparent" />
      <div className="relative">{children}</div>
    </section>
  );
}

const lightCardCx = "rounded-2xl border border-sky-100/80 bg-white/85 shadow-[0_12px_40px_-20px_rgba(59,130,246,0.14)] backdrop-blur-sm ring-1 ring-white/60 transition-all duration-300";

export function PlatformLanding() {
  const [openFaq, setOpenFaq] = useState(0);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: contactName,
          email: contactEmail,
          subject: contactSubject || contactCompany || "Message depuis la landing page",
          message: contactMessage,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSent(true);
        setContactName("");
        setContactEmail("");
        setContactCompany("");
        setContactSubject("");
        setContactMessage("");
      } else {
        setSendError(json.error || "Une erreur est survenue.");
      }
    } catch {
      setSendError("Erreur de connexion avec le serveur.");
    } finally {
      setSending(false);
    }
  };

  return <main className="overflow-hidden bg-white text-slate-900">

    <section id="platform" className="relative isolate overflow-hidden bg-[#f8fbff] px-6 py-24 md:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_50%,rgba(59,130,246,.12),transparent_26%),radial-gradient(circle_at_84%_25%,rgba(125,211,252,.18),transparent_24%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[.92fr_1.08fr]">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={slideFromLeft} className="lg:col-start-1">
          <motion.div variants={staggerContainer}>
          <motion.p variants={fadeUp} className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-blue-600">Conçu pour les équipes confiantes</motion.p>
          <motion.h2 variants={fadeUp} className="max-w-xl text-4xl font-semibold tracking-[-.055em] text-slate-950 md:text-6xl md:leading-[1.02]">Une sécurité claire pour toute entreprise en croissance.</motion.h2>
          <motion.p variants={fadeUp} className="mt-6 max-w-lg text-lg leading-8 text-slate-600">Cybelis est l'espace de travail de cybersécurité tout-en-un pour les PME : évaluez en continu l'exposition, découvrez les vulnérabilités, surveillez l'infrastructure et transformez les résultats en actions.</motion.p>
          <motion.div variants={staggerSlow} className="mt-8 grid gap-3 sm:grid-cols-2">
            {[[Radar,"Analyse de sécurité automatisée"],[BarChart3,"Évaluation des risques"],[ShieldCheck,"Surveillance de la conformité"],[Server,"Visibilité de l'infrastructure"],[Sparkles,"Recommandations actionnables"]].map(([Icon, label], i) => (
              <motion.div key={label as string} variants={fadeUp} className={i === 4 ? "sm:col-span-2" : ""}>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <span className="grid size-8 place-items-center rounded-lg bg-blue-100 text-blue-600"><Icon className="size-4" /></span>
                  {label as string}
                </div>
              </motion.div>
            ))}
          </motion.div>
          <motion.div variants={fadeUp} className="mt-9">
            <motion.a href="#features" whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20">
              Explorer la plateforme <ArrowRight className="size-4" />
            </motion.a>
          </motion.div>
          </motion.div>
        </motion.div>
        <motion.div aria-hidden="true" initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .7 }} className="relative mx-auto hidden w-full max-w-2xl">
          <div className="absolute -right-8 -top-10 size-48 rounded-full bg-blue-300/30 blur-3xl" /><div className="relative rounded-[2rem] border border-slate-200 bg-slate-950 p-3 shadow-[0_30px_80px_-28px_rgba(15,23,42,.55)]">
            <div className="overflow-hidden rounded-[1.45rem] bg-[#101b37] p-5 text-white md:p-7"><div className="flex items-center justify-between border-b border-white/10 pb-5"><div className="flex items-center gap-3"><span className="size-2.5 rounded-full bg-emerald-400" /><div><p className="text-sm font-medium">Aperçu de la sécurité</p><p className="text-xs text-slate-400">cybelis.ma · Mis à jour à l'instant</p></div></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">Protégé</span></div><div className="mt-7 grid gap-4 sm:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><p className="text-xs text-slate-400">Score de sécurité</p><div className="mt-3 flex items-end gap-3"><span className="text-5xl font-semibold tracking-tight">92</span><span className="mb-2 text-sm text-emerald-300">+8 ce mois</span></div><div className="mt-5 h-2 rounded-full bg-white/10"><div className="h-full w-[92%] rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" /></div></div><div className="space-y-3">{[["Configuration TLS","Sain"],["En-têtes de sécurité","2 actions"],["Protection DNS","Sain"]].map(([n,s]) => <div key={n} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-xs"><span className="text-slate-300">{n}</span><span className={s === "2 actions" ? "text-amber-300" : "text-emerald-300"}>{s}</span></div>)}</div></div><div className="mt-4 grid grid-cols-7 items-end gap-2 rounded-2xl border border-white/10 bg-white/[.04] p-5">{[34,48,40,72,58,85,70].map((v,i) => <div key={i} className="rounded-t bg-gradient-to-t from-blue-600 to-cyan-300" style={{ height: `${v}px` }} />)}</div></div>
          </div><motion.div animate={{ y: [0,-7,0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute -bottom-7 -left-7 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:block"><div className="flex gap-3"><span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><CircleAlert className="size-4" /></span><div><p className="text-xs font-semibold text-slate-900">2 éléments à vérifier</p><p className="mt-1 text-xs text-slate-500">Priorisé par impact</p></div></div></motion.div>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={slideFromRight} transition={{ duration: 0.7 }} className="relative mx-auto w-full max-w-xl">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="absolute -right-8 -top-10 size-48 rounded-full bg-blue-300/30 blur-3xl" />
          <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 200, damping: 22 }} className="relative rounded-[2rem] border border-blue-100 bg-white p-8 shadow-[0_30px_80px_-28px_rgba(15,23,42,.24)] md:p-10">
            <motion.span initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2, type: "spring" }} className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-lg shadow-blue-500/20"><ShieldCheck className="size-6" /></motion.span>
            <p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-blue-600">Une plateforme, des actions claires</p>
            <p className="mt-4 text-lg leading-8 text-slate-600">Cybelis est une plateforme de cybersécurité SaaS qui aide les petites et moyennes entreprises à évaluer et à améliorer la sécurité de leurs sites web. En combinant plusieurs outils d'analyse de sécurité en une seule plateforme, elle automatise l'analyse de sites web, détecte les vulnérabilités, génère un score de sécurité et fournit des rapports détaillés avec des recommandations concrètes.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>

    <LightSection id="features" pattern="dots" className="py-28 md:py-40">
      <div className="mx-auto max-w-6xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={reveal} className="mx-auto max-w-3xl text-center">
          <p className="inline-flex rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700">Fonctionnalités</p>
          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.045em] text-slate-950 md:text-6xl md:leading-[1.02]">Tout ce dont vous avez besoin pour sécuriser votre site web.</h2>
          <p className="mt-5 text-base leading-8 text-slate-600 md:text-lg">Cybelis fournit des outils de cybersécurité puissants qui analysent en continu les sites web, détectent les faiblesses de sécurité, calculent les scores de sécurité et génèrent des rapports professionnels pour les PME.</p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map(([Icon, title, body]) => (
            <motion.article
              key={title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={reveal}
              whileHover={{ y: -4, scale: 1.01 }}
              className={`group relative overflow-hidden p-7 hover:border-blue-200 hover:shadow-[0_20px_50px_-24px_rgba(37,99,235,0.22)] ${lightCardCx}`}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-sky-50/60 to-transparent" />
              <div className="relative flex items-center gap-4">
                <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 text-blue-600 ring-1 ring-sky-100 transition duration-300 group-hover:-translate-y-0.5 group-hover:text-blue-700">
                  <Icon className="size-5" strokeWidth={1.9} />
                </span>
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-900 transition duration-300 group-hover:text-blue-700">{title}</h3>
              </div>
              <p className="relative mt-4 text-sm leading-7 text-slate-500">{body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </LightSection>

    <section id="tools" className="relative overflow-hidden bg-[#f8fbff] px-6 py-24 md:py-32"><div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(37,99,235,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,.055)_1px,transparent_1px)] [background-size:42px_42px]" /><div className="relative"><SectionHeading eyebrow="Suite d'outils de sécurité" title="Vérifications spécialisées, un seul espace de travail cohérent." body="Allez au-delà de l'analyse superficielle. Cybelis réunit les contrôles de sécurité web essentiels dans une boîte à outils ciblée." /><div className="mx-auto mt-14 grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-4">{tools.map(([Icon,name,description,tag]) => <motion.div key={name} whileHover={{ y: -4 }} className="group rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-blue-600 group-hover:text-white"><Icon className="size-4" /></span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700">{tag}</span></div><h3 className="mt-7 text-sm font-semibold text-slate-900">{name}</h3><p className="mt-1.5 text-xs leading-5 text-slate-500">{description}</p></motion.div>)}</div></div></section>

    <LightSection id="team" pattern="mesh">
      <SectionHeading eyebrow="L'équipe derrière Cybelis" title="Créé par des ingénieurs soucieux d'une sécurité pratique." body="Deux ingénieurs en informatique et cybersécurité apportant une expertise complémentaire en développement, sécurité et infrastructure à chaque étape de la plateforme." />
      <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
        {[["KB","Kenza Boussoufi","Co-fondatrice","Ingénieure en Informatique et Cybersécurité",["Développement Backend","Cybersécurité","Architecture Base de Données"]],["AM","Amina Marzak","Co-fondatrice","Ingénieure en Informatique et Cybersécurité",["Authentification","Développement Frontend","Interface Tableau de bord"]]].map(([initials,name,role,bio,skills]) => (
          <motion.article key={name as string} whileHover={{ y: -5 }} className={`relative overflow-hidden p-7 hover:shadow-[0_24px_50px_-24px_rgba(59,130,246,0.18)] ${lightCardCx}`}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-100/40 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-400 text-lg font-semibold text-white shadow-lg shadow-sky-200/60 ring-2 ring-white">{initials}</div>
            </div>
            <p className="relative mt-7 text-lg font-semibold tracking-tight text-slate-900">{name}</p>
            <p className="mt-1 text-sm font-medium text-blue-600">{role}</p>
            <p className="mt-4 text-sm leading-6 text-slate-600">{bio}</p>
            <div className="mt-6 flex flex-wrap gap-2">{(skills as string[]).map(skill => <span key={skill} className="rounded-full bg-sky-50/80 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-sky-100">{skill}</span>)}</div>
          </motion.article>
        ))}
      </div>
    </LightSection>

    <section id="pricing" className="bg-[#0b1632] px-6 py-24 md:py-32"><div className="mx-auto max-w-3xl text-center"><p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Tarification simple</p><h2 className="text-3xl font-semibold tracking-[-.045em] text-white md:text-5xl">Commencez à protéger votre présence web dès aujourd'hui.</h2><p className="mt-5 text-lg text-slate-300">Choisissez le niveau de visibilité qui convient à votre équipe. Évoluez au fur et à mesure que votre pratique de sécurité se développe.</p></div><div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-3">{pricingPlans.map((plan) => { const isHighlighted = Boolean(plan.highlighted); return <motion.div key={plan.name} whileHover={{ y: -6 }} className={`relative flex min-h-[435px] flex-col rounded-3xl border p-7 ${isHighlighted ? "border-blue-400 bg-gradient-to-b from-blue-600 to-[#183b92] text-white shadow-2xl shadow-blue-900/50" : "border-white/10 bg-white/[.055] text-white"}`}>{isHighlighted && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-300 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-950">Le plus populaire</span>}<p className="text-lg font-semibold">{plan.name}</p><p className={`mt-2 text-sm ${isHighlighted ? "text-blue-100" : "text-slate-300"}`}>{plan.description}</p><p className="mt-8 text-4xl font-semibold tracking-tight">{plan.price}</p><ul className="mt-8 space-y-4">{plan.features.map((item) => <li key={item} className="flex gap-3 text-sm text-slate-100"><Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />{item}</li>)}</ul><a href="#contact" className={`mt-auto rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${isHighlighted ? "bg-white text-blue-700 hover:bg-blue-50" : "bg-white/10 text-white hover:bg-white/15"}`}>{plan.cta}</a></motion.div>; })}</div></section>

    <LightSection id="resources" pattern="dots">
      <SectionHeading eyebrow="Recherche et analyses" title="Gardez une longueur d'avance en matière de sécurité web." />
      <div className="mx-auto mt-14 grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[["Renseignement sur les menaces","Avril 2025","Cyberattaque CNSS : Leçons de l'une des plus grandes failles au Maroc.","/cnsss.png"],["Gestion des risques","Mai 2026","Fuite de données Mokhalafa.ma : Comprendre les risques des services exposés.","/mokhalafa.jpg"],["Bases de la sécurité","Avril 2026","Les erreurs de sécurité web les plus courantes en 2026.","/exp3.png"],["TLS & confiance","Avril 2026","Pourquoi la configuration SSL compte toujours.","/ssl.png"]].map(([category,date,title,imageSrc]) => (
          <motion.article key={title} whileHover={{ y: -5 }} className={`group overflow-hidden hover:shadow-[0_20px_50px_-24px_rgba(59,130,246,0.18)] ${lightCardCx}`}>
            <div className="relative h-40 w-full overflow-hidden">
              <Image src={imageSrc} alt={title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                <span>{category}</span>
                <span className="text-slate-400">{date}</span>
              </div>
              <h3 className="mt-4 min-h-20 text-base font-semibold leading-6 tracking-tight text-slate-900">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">Une perspective pratique pour aider les équipes à prendre des décisions plus sûres.</p>
              <a href="#" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">Lire plus <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></a>
            </div>
          </motion.article>
        ))}
      </div>
    </LightSection>

    <LightSection id="contact" pattern="grid">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <SectionHeading align="left" eyebrow="Contacter Cybelis" title="Rendons votre prochaine décision de sécurité plus claire." body="Que vous souhaitiez évaluer un site web, explorer un plan d'équipe ou poser des questions sur Cybelis, notre équipe est prête à vous aider." />
          <div className="mt-9 space-y-5">{[[Mail,"contact@cybelis.ma"],[Globe2,"+212 5 22 45 98 05"],[MapPin,"Marrakech, Maroc"]].map(([Icon,text]) => <div key={text as string} className="flex items-center gap-3 text-sm text-slate-600"><span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 text-blue-600 ring-1 ring-sky-100"><Icon className="size-4" /></span>{text}</div>)}</div>
        </div>
        <div>
          <form onSubmit={submit} className={`relative overflow-hidden p-6 md:p-8 ${lightCardCx}`}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-50/50 to-transparent" />
            <div className="relative grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Nom complet
                <input required type="text" placeholder="Votre nom" value={contactName} onChange={e => setContactName(e.target.value)} className="mt-2 w-full rounded-xl border border-sky-100 bg-white/90 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">Email
                <input required type="email" placeholder="vous@entreprise.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-sky-100 bg-white/90 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">Entreprise
                <input type="text" placeholder="Votre entreprise" value={contactCompany} onChange={e => setContactCompany(e.target.value)} className="mt-2 w-full rounded-xl border border-sky-100 bg-white/90 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">Sujet
                <input type="text" placeholder="Comment pouvons-nous vous aider ?" value={contactSubject} onChange={e => setContactSubject(e.target.value)} className="mt-2 w-full rounded-xl border border-sky-100 bg-white/90 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100" />
              </label>
            </div>
            <label className="relative mt-5 block text-sm font-medium text-slate-700">Message
              <textarea required rows={5} placeholder="Parlez-nous un peu de vos besoins." value={contactMessage} onChange={e => setContactMessage(e.target.value)} className="mt-2 w-full resize-none rounded-xl border border-sky-100 bg-white/90 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100" />
            </label>
            {sendError && (
              <p className="mt-3 text-xs text-red-600 font-medium">{sendError}</p>
            )}
            {sent && (
              <p className="mt-3 text-xs text-emerald-600 font-semibold">✓ Message envoyé avec succès ! Nous vous répondrons très prochainement.</p>
            )}
            <button disabled={sending} className="relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-sky-200/60 transition hover:-translate-y-0.5 hover:from-sky-500 hover:to-cyan-500 disabled:opacity-70 disabled:cursor-not-allowed">
              <Send className="size-4" />{sending ? "Envoi en cours..." : sent ? "Message envoyé ✓" : "Envoyer le message"}
            </button>
          </form>
          <div className={`relative mt-10 overflow-hidden p-6 ${lightCardCx}`}>
            <p className="text-sm font-semibold text-slate-900">Questions fréquemment posées</p>
            <div className="mt-4 divide-y divide-sky-100">{faqs.map(([q,a],i) => <div key={q} className="py-4"><button type="button" onClick={() => setOpenFaq(openFaq===i ? -1 : i)} className="flex w-full items-center justify-between gap-4 text-left text-sm font-medium text-slate-800">{q}<ChevronDown className={`size-4 shrink-0 text-slate-400 transition ${openFaq===i ? "rotate-180" : ""}`} /></button>{openFaq===i && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{a}</p>}</div>)}</div>
          </div>
        </div>
      </div>
    </LightSection>

    <footer className="relative overflow-hidden bg-[#07101f] px-6 pb-8 pt-16 text-slate-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(56,189,248,0.08),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center overflow-visible">
            <img src="/logo.png" alt="Cybelis" className="block h-10 w-auto origin-left scale-[2.4]" />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
            Cybelis aide les PME à évaluer la sécurité de leurs sites web avec des analyses automatisées, une évaluation claire des risques et des rapports concrets, le tout depuis une seule plateforme.
          </p>
          <div className="mt-6 flex flex-col gap-2 text-sm text-slate-400">
            <a href="mailto:contact@cybelis.ma" className="transition-colors hover:text-cyan-300">contact@cybelis.ma</a>
            <span>Marrakech, Maroc</span>
          </div>
        
        </div>

        {[
          ["Produit", [
            ["Analyse de sécurité", "#features"],
            ["Suite d'outils", "#tools"],
            ["Tarifs", "#pricing"],
            ["Tableau de bord", "/dashboard"],
          ]],
          ["Entreprise", [
            ["À propos", "#platform"],
            ["Notre équipe", "#team"],
            ["Ressources", "#resources"],
            ["Contact", "#contact"],
          ]],
          ["Légal", [
            ["Politique de confidentialité", "#"],
            ["Conditions d'utilisation", "#"],
            ["Pratiques de sécurité", "#"],
            ["Support", "mailto:contact@cybelis.ma"],
          ]],
        ].map(([title, links]) => (
          <div key={title as string}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-200">{title}</p>
            <div className="mt-5 flex flex-col gap-3">
              {(links as [string, string][]).map(([label, href]) => (
                <a key={label} href={href} className="text-sm text-slate-400 transition-colors hover:text-cyan-300">
                  {label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="relative mx-auto mt-14 flex max-w-7xl flex-col justify-between gap-4 border-t border-white/10 pt-7 text-xs text-slate-500 md:flex-row md:items-center">
        <span>© 2026 Cybelis. Tous droits réservés.</span>
        <p className="text-slate-500">Conçu pour les équipes qui ont besoin de clarté, pas de complexité.</p>
      </div>
    </footer>
  </main>;
}
