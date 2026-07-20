import { TlsCollectionResult, TlsCertificateData } from '../collectors/tls';

export interface SslIssue {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface SslCheckResult {
  isValid: boolean;
  isExpired: boolean;
  isSelfSigned: boolean;
  validForDomain: boolean;
  daysRemaining: number;
  issues: SslIssue[];
  score: 'A' | 'B' | 'C' | 'F';
}

/**
 * SSL Checker Tool
 * 
 * Responsabilité : Analyser les données brutes du certificat TLS fournies par le TlsCollector.
 * Il vérifie la validité des dates, l'adéquation du domaine, l'autorité de certification
 * et retourne un rapport structuré avec une note globale.
 */
export class SslChecker {
  /**
   * Vérifie si un nom de domaine correspond à un pattern de certificat (gestion des wildcards)
   * ex: target="www.example.com" correspond à "*.example.com"
   */
  private static matchDomain(targetDomain: string, certDomain: string): boolean {
    const cleanTarget = targetDomain.trim().toLowerCase();
    const cleanCert = certDomain.trim().toLowerCase();

    if (cleanTarget === cleanCert) return true;

    // Gestion du wildcard (ex: *.example.com)
    if (cleanCert.startsWith('*.')) {
      const baseDomain = cleanCert.substring(2);
      // Le wildcard couvre uniquement un niveau de sous-domaine
      const parts = cleanTarget.split('.');
      if (parts.length >= 2) {
        const targetBase = parts.slice(1).join('.');
        return targetBase === baseDomain;
      }
    }

    return false;
  }

  /**
   * Vérifie si le domaine cible est couvert par le certificat 
   * (via Subject Alternative Names ou le Common Name)
   */
  private static checkDomainMatch(hostname: string, cert: TlsCertificateData): boolean {
    // 1. Vérification dans les Subject Alternative Names (SANs) - Standard moderne
    if (cert.subjectaltname) {
      // Format typique: "DNS:example.com, DNS:*.example.com"
      const sans = cert.subjectaltname.split(',').map(s => s.trim());
      for (const san of sans) {
        if (san.startsWith('DNS:')) {
          const domain = san.substring(4);
          if (this.matchDomain(hostname, domain)) {
            return true;
          }
        }
      }
    }

    // 2. Fallback sur le Common Name (CN) si pas trouvé dans les SANs
    if (cert.subject && cert.subject.CN) {
      return this.matchDomain(hostname, cert.subject.CN);
    }

    return false;
  }

  /**
   * Calcule le nombre de jours restants avant expiration
   */
  private static calculateDaysRemaining(validTo: string): number {
    const expiryDate = new Date(validTo);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Exécute l'analyse SSL complète
   */
  static analyze(tlsData: TlsCollectionResult): SslCheckResult {
    const issues: SslIssue[] = [];
    
    // Cas critique : Aucun certificat (échec de connexion TLS par exemple)
    if (!tlsData.certificate) {
      issues.push({ severity: 'high', message: tlsData.error || 'Aucun certificat SSL/TLS détecté.' });
      return {
        isValid: false,
        isExpired: false,
        isSelfSigned: false,
        validForDomain: false,
        daysRemaining: 0,
        issues,
        score: 'F'
      };
    }

    const cert = tlsData.certificate;
    let isExpired = false;
    let isSelfSigned = false;
    let score: SslCheckResult['score'] = 'A';

    // 1. Analyse des dates
    const daysRemaining = this.calculateDaysRemaining(cert.validTo);
    if (daysRemaining <= 0) {
      isExpired = true;
      score = 'F';
      issues.push({ severity: 'high', message: 'Le certificat SSL a expiré.' });
    } else if (daysRemaining <= 15) {
      if (score === 'A') score = 'C';
      issues.push({ severity: 'medium', message: `Le certificat expire très bientôt (${daysRemaining} jours).` });
    } else if (daysRemaining <= 30) {
      if (score === 'A') score = 'B';
      issues.push({ severity: 'low', message: `Le certificat expirera dans ${daysRemaining} jours.` });
    }

    // 2. Vérification de l'autorité et Self-Signed
    if (!tlsData.isAuthorized) {
      score = 'F'; // Autorité non reconnue = risque critique
      const authError = tlsData.authorizationError || '';
      
      if (authError.includes('SELF_SIGNED')) {
        isSelfSigned = true;
        issues.push({ severity: 'high', message: 'Le certificat est auto-signé (Self-Signed) et non approuvé par une autorité publique.' });
      } else {
        issues.push({ severity: 'high', message: `Chaîne de certification invalide : ${authError}` });
      }
    }

    // 3. Vérification de la correspondance du domaine
    const validForDomain = this.checkDomainMatch(tlsData.hostname, cert);
    if (!validForDomain) {
      score = 'F';
      issues.push({ severity: 'high', message: `Le certificat n'est pas valide pour le domaine "${tlsData.hostname}".` });
    }

    // Calcul du statut isValid global
    const isValid = !isExpired && !isSelfSigned && validForDomain && tlsData.isAuthorized;

    return {
      isValid,
      isExpired,
      isSelfSigned,
      validForDomain,
      daysRemaining,
      issues,
      score
    };
  }
}
