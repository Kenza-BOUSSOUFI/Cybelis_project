import { HttpResponseData } from '../../collectors/http';

export interface MethodIssue {
  severity: 'high' | 'medium' | 'low';
  method: string;
  message: string;
}

export interface HttpMethodsAnalyzerResult {
  score: 'A' | 'B' | 'C' | 'F';
  scoreNum: number;
  allowedMethods: string[];
  dangerousMethods: string[];
  issues: MethodIssue[];
}

/**
 * HTTP Methods Analyzer Tool
 * 
 * Responsabilité : Analyser les méthodes HTTP autorisées par le serveur cible.
 * Se base sur les en-têtes `Allow` ou `Access-Control-Allow-Methods` 
 * renvoyés par une requête OPTIONS (HttpCollector.collectOptions).
 */
export class HttpMethodsAnalyzer {
  // Liste des méthodes classées par risque
  private static readonly DANGEROUS_METHODS = ['TRACE', 'TRACK', 'CONNECT'];
  // PUT, DELETE, PATCH ne sont pas "dangereux" par nature (REST), mais ils requièrent 
  // une vigilance d'authentification. On les signale en "low" ou "medium".
  private static readonly MODIFIYING_METHODS = ['PUT', 'DELETE', 'PATCH'];

  /**
   * Convertit un score numérique en lettre
   */
  private static gradeScore(score: number): 'A' | 'B' | 'C' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    return 'F';
  }

  /**
   * Extrait les méthodes HTTP d'une liste de headers
   */
  private static extractMethods(headers: Record<string, string>): string[] {
    const methodsSet = new Set<string>();

    // Header standard
    const allowHeader = headers['allow'];
    if (allowHeader) {
      allowHeader.split(',').forEach(m => methodsSet.add(m.trim().toUpperCase()));
    }

    // Header CORS (souvent présent si Allow ne l'est pas)
    const corsAllowHeader = headers['access-control-allow-methods'];
    if (corsAllowHeader) {
      corsAllowHeader.split(',').forEach(m => methodsSet.add(m.trim().toUpperCase()));
    }

    return Array.from(methodsSet).filter(m => m.length > 0);
  }

  /**
   * Exécute l'analyse sur la réponse d'une requête OPTIONS
   */
  static analyze(optionsResponse: HttpResponseData | null): HttpMethodsAnalyzerResult {
    let scoreNum = 100;
    const allowedMethods: string[] = [];
    const dangerousMethods: string[] = [];
    const issues: MethodIssue[] = [];

    // Si aucune réponse (ex: le serveur bloque les requêtes OPTIONS)
    if (!optionsResponse) {
      issues.push({ 
        severity: 'low', 
        method: 'OPTIONS', 
        message: "Impossible de déterminer les méthodes (La requête OPTIONS a échoué ou a été bloquée)." 
      });
      return {
        score: 'A', // Pas d'exposition = pas de faille détectable, on donne A par défaut
        scoreNum: 100,
        allowedMethods: [],
        dangerousMethods: [],
        issues
      };
    }

    const methods = this.extractMethods(optionsResponse.headers);
    
    if (methods.length === 0) {
      issues.push({ 
        severity: 'low', 
        method: 'ALL', 
        message: "Le serveur a répondu à OPTIONS mais n'a retourné aucun en-tête 'Allow' listant les méthodes." 
      });
    }

    for (const method of methods) {
      allowedMethods.push(method);

      // 1. Analyse des méthodes critiques (Faille XST etc.)
      if (this.DANGEROUS_METHODS.includes(method)) {
        dangerousMethods.push(method);
        scoreNum -= 50; // Chute drastique du score
        
        let msg = `La méthode ${method} est activée. C'est extrêmement dangereux.`;
        if (method === 'TRACE' || method === 'TRACK') {
          msg += " Elle expose le serveur aux attaques XST (Cross-Site Tracing) permettant de voler les cookies HttpOnly.";
        } else if (method === 'CONNECT') {
          msg += " Elle pourrait être abusée pour utiliser le serveur comme proxy ouvert.";
        }
        
        issues.push({ severity: 'high', method, message: msg });
      }

      // 2. Analyse des méthodes de modification (Sensibilisation)
      if (this.MODIFIYING_METHODS.includes(method)) {
        issues.push({ 
          severity: 'low', 
          method, 
          message: `La méthode ${method} est autorisée. Vérifiez qu'elle est bien protégée par un mécanisme d'authentification robuste (REST API).` 
        });
      }
    }

    // Sécurité anti-négatif
    scoreNum = Math.max(0, scoreNum);

    return {
      score: this.gradeScore(scoreNum),
      scoreNum,
      allowedMethods,
      dangerousMethods,
      issues
    };
  }
}
