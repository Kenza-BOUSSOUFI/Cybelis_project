// ── Security Impact Enrichment Module ────────────────────────────────────────
// Provides structured security impact data for each supported tool.
// Architecture mirrors iso27001.ts, owasp.ts and cve.ts.

export interface TechnicalImpact {
  /** Confidentiality impact score (0 to 100) */
  confidentiality: number;
  /** Integrity impact score (0 to 100) */
  integrity: number;
  /** Availability impact score (0 to 100) */
  availability: number;
}

export interface SecurityImpactInfo {
  /** Concise, professional explanation of the detected vulnerability. */
  description: string;
  /** Consequences expressed in business/management terms. */
  businessImpact: string[];
  /** CIA triad ratings — independent from CVSS. */
  technicalImpact: TechnicalImpact;
  /** High-level recommendation — NO commands, configs or step-by-step guides. */
  recommendation: string;
}

export type CiaLevelLabel = "Faible" | "Modéré" | "Élevé" | "Critique";

export interface CiaCategoryInfo {
  level: CiaLevelLabel;
  percentage: number;
  barColor: string;
  textColor: string;
  badgeBg: string;
  badgeBorder: string;
}

/**
 * Calculates textual level, color palette, and progress bar properties from a 0–100 score.
 * 0–25 %   → Faible (Vert)
 * 26–50 %  → Modéré (Jaune/Ambre)
 * 51–75 %  → Élevé (Orange)
 * 76–100 % → Critique (Rouge)
 */
export function getCiaCategoryInfo(score: number): CiaCategoryInfo {
  const percentage = Math.min(100, Math.max(0, Math.round(score)));

  if (percentage <= 25) {
    return {
      level: "Faible",
      percentage,
      barColor: "bg-emerald-500",
      textColor: "text-emerald-700",
      badgeBg: "bg-emerald-50 text-emerald-700",
      badgeBorder: "border-emerald-200",
    };
  }
  if (percentage <= 50) {
    return {
      level: "Modéré",
      percentage,
      barColor: "bg-amber-500",
      textColor: "text-amber-700",
      badgeBg: "bg-amber-50 text-amber-700",
      badgeBorder: "border-amber-200",
    };
  }
  if (percentage <= 75) {
    return {
      level: "Élevé",
      percentage,
      barColor: "bg-orange-500",
      textColor: "text-orange-700",
      badgeBg: "bg-orange-50 text-orange-700",
      badgeBorder: "border-orange-200",
    };
  }
  return {
    level: "Critique",
    percentage,
    barColor: "bg-red-500",
    textColor: "text-red-700",
    badgeBg: "bg-red-50 text-red-700",
    badgeBorder: "border-red-200",
  };
}

// ── Per-tool impact definitions ───────────────────────────────────────────────

const SECURITY_IMPACT_MAP: Record<string, SecurityImpactInfo> = {

  "ssl-checker": {
    description:
      "Le certificat SSL/TLS protégeant ce domaine est invalide, expiré ou mal configuré. " +
      "Les navigateurs modernes refusent d'établir une connexion sécurisée et affichent " +
      "des avertissements bloquants à tous les visiteurs.",
    businessImpact: [
      "Perte immédiate de tout le trafic web en raison des blocages des navigateurs modernes.",
      "Atteinte grave à la réputation de la marque et érosion de la confiance des clients.",
      "Risque de non-conformité réglementaire (RGPD, PCI-DSS) en cas d'exposition de données non chiffrées.",
      "Impact financier direct sur les services e-commerce ou les plateformes digitales rendus inaccessibles.",
    ],
    technicalImpact: {
      confidentiality: 85,
      integrity: 80,
      availability: 95,
    },
    recommendation:
      "Renouvelez ou remplacez le certificat SSL/TLS par un certificat valide émis par une " +
      "Autorité de Certification reconnue, et activez le renouvellement automatique.",
  },

  "tls-analyzer": {
    description:
      "Le serveur accepte des versions obsolètes du protocole TLS (TLS 1.0 ou TLS 1.1) ou " +
      "utilise des suites de chiffrement faibles, exposant les communications à des attaques " +
      "cryptographiques connues (POODLE, BEAST, SWEET32).",
    businessImpact: [
      "Les données sensibles des utilisateurs peuvent être interceptées en clair sur les réseaux publics.",
      "Non-conformité avec la norme PCI-DSS 4.0 qui impose TLS 1.2 minimum pour le traitement des paiements.",
      "Atteinte à l'image de marque en cas de fuite de données liée à un chiffrement défaillant.",
      "Risque accru lors d'audits réglementaires ou de certifications de sécurité.",
    ],
    technicalImpact: {
      confidentiality: 78,
      integrity: 65,
      availability: 15,
    },
    recommendation:
      "Désactivez les protocoles TLS 1.0 et TLS 1.1, et restreignez le serveur à TLS 1.2 " +
      "et TLS 1.3 avec des suites de chiffrement robustes uniquement.",
  },

  "security-headers": {
    description:
      "Un ou plusieurs en-têtes HTTP de sécurité critiques sont absents des réponses du serveur, " +
      "exposant l'application aux attaques côté client telles que le Clickjacking, le " +
      "Cross-Site Scripting (XSS) ou l'injection de contenu non autorisé.",
    businessImpact: [
      "Exposition aux attaques de Clickjacking pouvant tromper les utilisateurs dans des actions non désirées.",
      "Risque d'usurpation de l'interface de l'application via des scripts malveillants (XSS).",
      "Non-conformité avec les standards de sécurité applicative (OWASP, ISO 27001, PCI-DSS).",
      "Atteinte à la réputation suite à la divulgation publique d'une vulnérabilité exploitable.",
    ],
    technicalImpact: {
      confidentiality: 60,
      integrity: 75,
      availability: 10,
    },
    recommendation:
      "Configurez les en-têtes de sécurité manquants (HSTS, CSP, X-Frame-Options, " +
      "X-Content-Type-Options) dans la configuration HTTP de votre serveur.",
  },

  "cookie-analyzer": {
    description:
      "Les cookies de session ne disposent pas d'un ou plusieurs attributs de sécurité " +
      "essentiels (Secure, HttpOnly, SameSite), exposant les jetons d'authentification " +
      "au vol via des scripts malveillants ou des canaux réseau non chiffrés.",
    businessImpact: [
      "Risque de détournement de session permettant à un attaquant d'accéder aux comptes utilisateurs.",
      "Risque de non-conformité RGPD concernant la protection sécurisée des données personnelles.",
      "Exposition des sessions utilisateurs sur les réseaux Wi-Fi publics non sécurisés.",
      "Atteinte à la confiance client en cas d'incident de sécurité lié à l'authentification.",
    ],
    technicalImpact: {
      confidentiality: 82,
      integrity: 58,
      availability: 10,
    },
    recommendation:
      "Définissez les attributs Secure, HttpOnly et SameSite sur tous les cookies " +
      "d'authentification et de session pour prévenir leur interception et les attaques CSRF.",
  },

  "csp-validator": {
    description:
      "L'en-tête Content-Security-Policy (CSP) est absent ou incorrectement configuré, " +
      "n'offrant aucune protection contre les attaques Cross-Site Scripting (XSS) et " +
      "l'injection de contenu tiers non autorisé.",
    businessImpact: [
      "Les failles XSS permettent à des attaquants d'usurper l'identité de votre site auprès de vos utilisateurs.",
      "Exposition des identifiants, données de paiement et informations personnelles à des scripts tiers malveillants.",
      "Risque de redirections malveillantes portant atteinte à l'image de marque.",
      "Exposition réglementaire sous le RGPD et la norme PCI-DSS en cas d'exfiltration de données.",
    ],
    technicalImpact: {
      confidentiality: 88,
      integrity: 91,
      availability: 24,
    },
    recommendation:
      "Mettez en place un en-tête Content-Security-Policy strict qui autorise uniquement " +
      "les sources de contenu de confiance et bloque l'exécution de scripts non déclarés.",
  },

  "dmarc-checker": {
    description:
      "Aucune politique DMARC n'est configurée ou la politique existante est trop permissive " +
      "(p=none), permettant à n'importe quelle entité d'envoyer des emails en usurpant " +
      "l'identité de votre domaine.",
    businessImpact: [
      "Des campagnes de phishing peuvent usurper votre nom de domaine pour cibler vos clients, partenaires et employés.",
      "Atteinte à la réputation du domaine affectant la délivrabilité des emails légitimes.",
      "Perte de confiance des clients si des emails frauduleux sont attribués à votre organisation.",
      "Responsabilité légale potentielle en cas de violation de données liée à du phishing.",
    ],
    technicalImpact: {
      confidentiality: 72,
      integrity: 85,
      availability: 15,
    },
    recommendation:
      "Publiez un enregistrement DMARC avec au minimum une politique de quarantaine " +
      "(p=quarantine) et configurez les rapports de surveillance pour votre domaine.",
  },

  "spf-checker": {
    description:
      "L'enregistrement SPF (Sender Policy Framework) est absent, mal configuré ou utilise " +
      "un qualificateur permissif (~all ou +all), permettant à des serveurs non autorisés " +
      "d'envoyer des emails au nom de votre domaine.",
    businessImpact: [
      "Risque d'usurpation d'adresse email facilitant des campagnes de phishing contre vos clients.",
      "Risque de mise sur liste noire du domaine affectant la distribution des emails légitimes.",
      "Érosion de la confiance des partenaires et clients face à des communications frauduleuses.",
      "Problèmes de conformité avec les standards d'authentification des emails (RFC 7208).",
    ],
    technicalImpact: {
      confidentiality: 45,
      integrity: 78,
      availability: 15,
    },
    recommendation:
      "Publiez un enregistrement SPF valide référençant uniquement les serveurs de messagerie " +
      "autorisés et appliquez une politique de rejet strict (-all) pour tous les autres expéditeurs.",
  },
};

// ── Fallback for unknown tool slugs ───────────────────────────────────────────

const DEFAULT_IMPACT: SecurityImpactInfo = {
  description:
    "Une anomalie de sécurité a été détectée par ce module d'analyse. " +
    "Examinez les détails du résultat pour évaluer l'impact sur votre infrastructure.",
  businessImpact: [
    "Risque potentiel d'exposition et de compromission des systèmes ou des données.",
    "Impact possible sur la disponibilité, la confidentialité ou l'intégrité des actifs numériques.",
  ],
  technicalImpact: {
    confidentiality: 45,
    integrity: 40,
    availability: 20,
  },
  recommendation:
    "Examinez les résultats détaillés de ce module et appliquez les bonnes pratiques " +
    "de sécurité recommandées pour votre type d'infrastructure.",
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns structured security impact data for a given tool slug.
 * Always returns a value — falls back to a generic impact if the slug is unknown.
 */
export function getSecurityImpact(toolSlug: string): SecurityImpactInfo {
  return SECURITY_IMPACT_MAP[toolSlug] ?? DEFAULT_IMPACT;
}
