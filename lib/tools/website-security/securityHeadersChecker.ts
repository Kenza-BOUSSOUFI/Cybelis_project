import { HttpCollectionResult } from '../../collectors/http';


export interface HeaderIssue {
  severity: 'high' | 'medium' | 'low';
  headerName: string;
  message: string;
}

export interface SecurityHeadersResult {
  score: 'A' | 'B' | 'C' | 'D' | 'F';
  presentHeaders: Record<string, string>;
  missingHeaders: string[];
  issues: HeaderIssue[];
  scoreNum: number;
}

/**
 * Security Headers Checker Tool
 * 
 * Responsabilité : Analyser les en-têtes HTTP retournés par le HttpCollector
 * pour vérifier la présence et la bonne configuration des défenses standard 
 * (HSTS, CSP, X-Frame-Options, etc.).
 */
export class HeadersChecker {
  // Liste des en-têtes de sécurité essentiels et leur pénalité si absents
  private static readonly SECURITY_HEADERS = [
    { name: 'strict-transport-security', penalty: 20 },
    { name: 'content-security-policy', penalty: 25 },
    { name: 'x-frame-options', penalty: 15 },
    { name: 'x-content-type-options', penalty: 10 },
    { name: 'referrer-policy', penalty: 5 },
    { name: 'permissions-policy', penalty: 5 }
  ];

  /**
   * Analyse détaillée de la valeur du HSTS
   */
  private static checkHstsConfig(value: string, issues: HeaderIssue[]) {
    if (!value.includes('max-age=')) {
      issues.push({ severity: 'high', headerName: 'strict-transport-security', message: "L'attribut 'max-age' est manquant." });
      return;
    }
    
    // Extraction basique du max-age
    const match = value.match(/max-age=(\d+)/);
    if (match) {
      const maxAge = parseInt(match[1], 10);
      if (maxAge < 15768000) { // Moins de 6 mois
        issues.push({ severity: 'medium', headerName: 'strict-transport-security', message: "La durée 'max-age' est inférieure à 6 mois (15768000 secondes)." });
      }
    }
    
    if (!value.includes('includeSubDomains')) {
      issues.push({ severity: 'low', headerName: 'strict-transport-security', message: "L'attribut 'includeSubDomains' est manquant, les sous-domaines ne sont pas protégés." });
    }
  }

  /**
   * Analyse détaillée de la valeur du CSP
   */
  private static checkCspConfig(value: string, issues: HeaderIssue[]) {
    if (value.includes("unsafe-inline")) {
      issues.push({ severity: 'medium', headerName: 'content-security-policy', message: "L'utilisation de 'unsafe-inline' rend le CSP vulnérable aux attaques XSS." });
    }
    if (value.includes("unsafe-eval")) {
      issues.push({ severity: 'medium', headerName: 'content-security-policy', message: "L'utilisation de 'unsafe-eval' est déconseillée." });
    }
  }

  /**
   * Convertit un score numérique en lettre
   */
  private static gradeScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  /**
   * Exécute l'analyse des en-têtes HTTP
   */
  static analyze(httpData: HttpCollectionResult): SecurityHeadersResult {
    let scoreNum = 100;
    const presentHeaders: Record<string, string> = {};
    const missingHeaders: string[] = [];
    const issues: HeaderIssue[] = [];

    // Si pas de réponse finale (erreur réseau par ex)
    if (!httpData.finalResponse) {
      issues.push({ severity: 'high', headerName: 'N/A', message: "Aucune réponse HTTP reçue pour analyser les en-têtes." });
      return {
        score: 'F',
        scoreNum: 0,
        presentHeaders: {},
        missingHeaders: this.SECURITY_HEADERS.map(h => h.name),
        issues
      };
    }

    const headers = httpData.finalResponse.headers; // Les clés sont déjà en minuscules grâce au Collector

    // 1. Vérification de la présence des en-têtes
    for (const rule of this.SECURITY_HEADERS) {
      const headerValue = headers[rule.name];

      if (headerValue !== undefined && headerValue !== null) {
        presentHeaders[rule.name] = headerValue as string;
      } else {
        missingHeaders.push(rule.name);
        scoreNum -= rule.penalty;
        
        const severity = rule.penalty >= 15 ? 'high' : (rule.penalty >= 10 ? 'medium' : 'low');
        issues.push({ 
          severity, 
          headerName: rule.name, 
          message: `L'en-tête de sécurité ${rule.name} est manquant.` 
        });
      }
    }

    // 2. Vérification de la configuration des en-têtes présents
    if (presentHeaders['strict-transport-security']) {
      // Le HSTS n'a de sens que sur HTTPS. Si l'URL finale est HTTP, c'est inutile.
      if (!httpData.finalUrl.startsWith('https://')) {
        issues.push({ severity: 'medium', headerName: 'strict-transport-security', message: "L'en-tête HSTS est présent mais l'URL servie est en clair (HTTP)." });
      } else {
        this.checkHstsConfig(presentHeaders['strict-transport-security'], issues);
      }
    }

    if (presentHeaders['content-security-policy']) {
      this.checkCspConfig(presentHeaders['content-security-policy'], issues);
    }

    if (presentHeaders['x-frame-options']) {
      const val = presentHeaders['x-frame-options'].toLowerCase();
      if (val !== 'deny' && val !== 'sameorigin') {
        issues.push({ severity: 'medium', headerName: 'x-frame-options', message: "L'en-tête X-Frame-Options devrait être 'DENY' ou 'SAMEORIGIN'." });
      }
    }

    if (presentHeaders['x-content-type-options']) {
      if (presentHeaders['x-content-type-options'].toLowerCase() !== 'nosniff') {
        issues.push({ severity: 'medium', headerName: 'x-content-type-options', message: "L'en-tête X-Content-Type-Options doit valoir 'nosniff'." });
      }
    }

    // 3. Détection des vieux en-têtes (Deprecated)
    if (headers['x-xss-protection']) {
      issues.push({ severity: 'low', headerName: 'x-xss-protection', message: "L'en-tête X-XSS-Protection est déprécié. Utilisez plutôt Content-Security-Policy." });
    }
    if (headers['pragma'] === 'no-cache') {
      issues.push({ severity: 'low', headerName: 'pragma', message: "L'en-tête Pragma est déprécié (HTTP/1.0). Utilisez Cache-Control." });
    }

    // Sécurité: le score ne peut pas être inférieur à 0
    scoreNum = Math.max(0, scoreNum);

    return {
      score: this.gradeScore(scoreNum),
      scoreNum,
      presentHeaders,
      missingHeaders,
      issues
    };
  }
}


export { HeadersChecker as SecurityHeadersChecker };
