export interface OwaspInfo {
  code: string;
  title: string;
  description: string;
  recommendations: string[];
}

export function getOwaspMapping(rawResult?: any): OwaspInfo[] {
  if (!rawResult || typeof rawResult !== "object") {
    return [];
  }

  const categories: OwaspInfo[] = [];

  // 1. Détection SSL/TLS (Cryptographic Failures - A02:2021)
  if (rawResult.isExpired === true || rawResult.isSelfSigned === true || rawResult.validForDomain === false) {
    const recs: string[] = [];
    if (rawResult.isExpired) recs.push("Renouveler immédiatement le certificat SSL/TLS auprès d'une autorité certifiée.");
    if (rawResult.isSelfSigned) recs.push("Remplacer le certificat auto-signé par un certificat émis par une autorité de certification reconnue.");
    if (rawResult.validForDomain === false) recs.push("Vérifier que le certificat couvre bien le nom de domaine cible (Subject Alternative Names).");
    
    categories.push({
      code: "A02:2021",
      title: "Cryptographic Failures (Défaillances cryptographiques)",
      description: "Faille critique liée à l'invalidité ou l'expiration du certificat protégeant les échanges.",
      recommendations: recs
    });
  }

  if (rawResult.isProtocolSecure === false || rawResult.isCipherStrong === false) {
    const recs: string[] = [];
    if (rawResult.isProtocolSecure === false) {
      recs.push(`Désactiver le protocole obsolète (${rawResult.protocol || "détecté"}) pour forcer l'utilisation de TLS 1.2 ou TLS 1.3.`);
    }
    if (rawResult.isCipherStrong === false) {
      recs.push(`Désactiver la suite de chiffrement faible détectée (${rawResult.cipherName || "inconnue"}) au profit de chiffrements robustes.`);
    }

    categories.push({
      code: "A02:2021",
      title: "Cryptographic Failures (Défaillances cryptographiques)",
      description: "Utilisation de protocoles ou de suites de chiffrement obsolètes exposant les communications à des attaques réseau.",
      recommendations: recs
    });
  }

  // 2. En-têtes HTTP manquants (Security Misconfiguration - A05:2021)
  if (Array.isArray(rawResult.missingHeaders)) {
    const missing = rawResult.missingHeaders as string[];
    const recs: string[] = [];
    
    if (missing.includes("strict-transport-security")) {
      recs.push("Ajouter l'en-tête Strict-Transport-Security (HSTS) avec max-age=31536000 et includeSubDomains.");
    }
    if (missing.includes("x-frame-options") || missing.includes("content-security-policy")) {
      recs.push("Ajouter les en-têtes X-Frame-Options (DENY/SAMEORIGIN) et Content-Security-Policy.");
    }
    if (missing.includes("x-content-type-options")) {
      recs.push("Ajouter l'en-tête X-Content-Type-Options avec la valeur 'nosniff'.");
    }

    if (recs.length > 0) {
      categories.push({
        code: "A05:2021",
        title: "Security Misconfiguration (Mauvaise configuration de sécurité)",
        description: "Absence d'en-têtes HTTP de sécurité essentiels pour protéger l'application (XSS, Clickjacking, MiTM).",
        recommendations: recs
      });
    }
  }

  // 3. Vulnérabilités Cookies & Authentification (Identification and Auth Failures - A07:2021)
  if (Array.isArray(rawResult.issues)) {
    const issues = rawResult.issues as any[];
    
    const hasSecureMissing = issues.some(i => i.message && i.message.includes("Secure"));
    const hasHttpOnlyMissing = issues.some(i => i.message && i.message.includes("HttpOnly"));
    const hasSameSiteMissing = issues.some(i => i.message && i.message.includes("SameSite"));

    const recs: string[] = [];
    if (hasSecureMissing) recs.push("Ajouter l'attribut 'Secure' pour forcer la transmission des cookies uniquement sur des connexions HTTPS.");
    if (hasHttpOnlyMissing) recs.push("Ajouter l'attribut 'HttpOnly' pour empêcher l'accès aux cookies via JavaScript (protection XSS).");
    if (hasSameSiteMissing) recs.push("Ajouter l'attribut 'SameSite=Lax' ou 'Strict' pour protéger contre les attaques CSRF.");

    if (recs.length > 0) {
      categories.push({
        code: "A07:2021",
        title: "Identification and Authentication Failures (Erreurs d'identification)",
        description: "Configuration non sécurisée des cookies exposant les sessions utilisateurs.",
        recommendations: recs
      });
    }

    // 4. Insecure Design / Misconfiguration via CORS ou Méthodes HTTP dangereuses
    const hasCorsIssue = issues.some(i => i.message && (i.message.includes("CORS") || i.message.includes("Access-Control-Allow-Origin")));
    const hasMethodsIssue = issues.some(i => i.message && (i.message.includes("OPTIONS") || i.message.includes("TRACE")));

    if (hasCorsIssue || hasMethodsIssue) {
      const corsRecs: string[] = [];
      if (hasMethodsIssue) corsRecs.push("Restreindre les méthodes HTTP autorisées aux seules méthodes strictement nécessaires (GET, POST).");
      if (hasCorsIssue) corsRecs.push("Restreindre l'en-tête 'Access-Control-Allow-Origin' à une liste blanche de domaines de confiance.");

      categories.push({
        code: "A05:2021",
        title: "Security Misconfiguration (Configuration générale)",
        description: "Méthodes HTTP potentiellement dangereuses ou configuration CORS trop permissive détectées.",
        recommendations: corsRecs
      });
    }
  }
  
  // Deduplicate categories by code
  const uniqueCategories = Array.from(new Map(categories.map(c => [c.code, c])).values());

  return uniqueCategories;
}
