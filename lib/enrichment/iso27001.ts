export interface IsoControl {
  code: string;
  name: string;
  category: "Cryptographie" | "Sécurité Réseau" | "Applications" | "Messagerie" | "Configurations";
  status: "CONFORME" | "NON_CONFORME";
  details: string;
  recommendation?: string;
}

export interface Iso27001Report {
  compliancePercentage: number;
  totalControls: number;
  passedCount: number;
  failedCount: number;
  controls: IsoControl[];
  recommendations: string[];
}

export function calculateIso27001Compliance(results: any[]): Iso27001Report {
  if (!results || results.length === 0) {
    return {
      compliancePercentage: 0,
      totalControls: 0,
      passedCount: 0,
      failedCount: 0,
      controls: [],
      recommendations: []
    };
  }

  const controls: IsoControl[] = [];
  const validRawResults = results
    .map(r => r.result)
    .filter(r => r && typeof r === "object");

  // 1. Cryptography Control A.10.1
  // Evaluated ONLY if properties like isExpired or isProtocolSecure are present
  const hasCryptoChecks = validRawResults.some(r => r.isExpired !== undefined || r.isProtocolSecure !== undefined);
  if (hasCryptoChecks) {
    const isPass = validRawResults.every(r => {
      if (r.isExpired === true || r.isSelfSigned === true || r.validForDomain === false) return false;
      if (r.isProtocolSecure === false || r.isCipherStrong === false) return false;
      return true;
    });

    controls.push({
      code: "A.10.1 / A.5.15",
      name: "Chiffrement et Protection des Données en Transit (SSL/TLS)",
      category: "Cryptographie",
      status: isPass ? "CONFORME" : "NON_CONFORME",
      details: isPass
        ? "La robustesse du chiffrement SSL/TLS évaluée est conforme aux standards."
        : "Certificat SSL invalide/expiré ou suites de chiffrement obsolètes identifiés dans les résultats bruts.",
      recommendation: isPass ? undefined : "Restreindre l'accès réseau aux protocoles sécurisés (TLS 1.2 minimum) et déployer des certificats SSL valides."
    });
  }

  // 2. Network Security Control A.13.1
  // Evaluated ONLY if properties like missingHeaders or forcesHttps exist
  const hasNetworkChecks = validRawResults.some(r => Array.isArray(r.missingHeaders) || r.forcesHttps !== undefined);
  if (hasNetworkChecks) {
    const isPass = validRawResults.every(r => {
      if (Array.isArray(r.missingHeaders) && r.missingHeaders.includes("strict-transport-security")) return false;
      if (r.forcesHttps === false) return false;
      return true;
    });

    controls.push({
      code: "A.13.1 / A.8.20",
      name: "Sécurité des Réseaux et En-têtes HTTP (HSTS & Redirection)",
      category: "Sécurité Réseau",
      status: isPass ? "CONFORME" : "NON_CONFORME",
      details: isPass
        ? "Protection robuste confirmée via HSTS et des redirections sécurisées obligatoires."
        : "Absence d'en-tête Strict-Transport-Security (HSTS) ou trafic clair toléré.",
      recommendation: isPass ? undefined : "Appliquer l'en-tête HSTS et forcer toutes les connexions vers HTTPS."
    });
  }

  // 3. Web Application & Cookie Control A.14.1
  // Evaluated ONLY if analyzedCookies exists or CORS/CSP issues exist
  const hasAppChecks = validRawResults.some(r => 
    Array.isArray(r.analyzedCookies) || 
    (Array.isArray(r.issues) && r.issues.some((i: any) => i.message && (i.message.includes("CORS") || i.message.includes("CSP") || i.message.includes("Content-Security-Policy"))))
  );
  if (hasAppChecks) {
    const isPass = validRawResults.every(r => {
      if (Array.isArray(r.issues)) {
        const hasAppFlaw = r.issues.some((i: any) => i.message && (i.message.includes("Secure") || i.message.includes("HttpOnly") || i.message.includes("CORS") || i.message.includes("CSP")));
        if (hasAppFlaw) return false;
      }
      return true;
    });

    controls.push({
      code: "A.14.1 / A.8.24",
      name: "Sécurité des Applications Web, Cookies et CSP",
      category: "Applications",
      status: isPass ? "CONFORME" : "NON_CONFORME",
      details: isPass
        ? "Mécanismes de protection de session (Cookies) et restrictions CSP validés par le scan."
        : "Absence d'attributs obligatoires (Secure/HttpOnly) sur les cookies ou politique Content-Security-Policy/CORS manquante/permissive.",
      recommendation: isPass ? undefined : "Isoler les composants via CSP et sécuriser les attributs des cookies de session."
    });
  }

  // 4. Email Messaging Control A.13.2
  // Evaluated ONLY if SPF/DMARC/DKIM properties exist
  const hasEmailChecks = validRawResults.some(r => r.hasSpf !== undefined || r.hasDmarc !== undefined || r.hasDkim !== undefined);
  if (hasEmailChecks) {
    const isPass = validRawResults.every(r => {
      if (r.hasSpf === false || r.hasDmarc === false || r.hasDkim === false) return false;
      if (r.policy === "none" || r.qualifier === "allow_all") return false;
      return true;
    });

    controls.push({
      code: "A.13.2 / A.8.23",
      name: "Authentification et Protection de la Messagerie (SPF/DMARC)",
      category: "Messagerie",
      status: isPass ? "CONFORME" : "NON_CONFORME",
      details: isPass
        ? "Enregistrements d'authentification email validés, prévenant l'usurpation du domaine."
        : "Configurations de sécurité DNS de la messagerie (SPF/DMARC) inexistantes ou trop permissives.",
      recommendation: isPass ? undefined : "Implémenter la validation des emails via SPF stricts (-all) et DMARC (p=quarantine ou reject)."
    });
  }

  const totalControls = controls.length;
  const passedCount = controls.filter(c => c.status === "CONFORME").length;
  const failedCount = totalControls - passedCount;
  const compliancePercentage = totalControls > 0 ? Math.round((passedCount / totalControls) * 100) : 100;

  const recommendations = controls
    .filter(c => c.status === "NON_CONFORME" && c.recommendation)
    .map(c => `[Contrôle ${c.code}] ${c.recommendation}`);

  return {
    compliancePercentage,
    totalControls,
    passedCount,
    failedCount,
    controls,
    recommendations
  };
}
