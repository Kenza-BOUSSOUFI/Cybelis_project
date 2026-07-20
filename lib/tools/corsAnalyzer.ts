import { HttpResponseData } from '../collectors/http';

export interface CorsIssue {
  severity: 'high' | 'medium' | 'low';
  headerName: string;
  message: string;
}

export interface CorsAnalyzerResult {
  score: 'A' | 'B' | 'C' | 'F';
  scoreNum: number;
  isCorsEnabled: boolean;
  allowedOrigins: string;
  allowedMethods: string;
  allowedHeaders: string;
  allowCredentials: boolean;
  issues: CorsIssue[];
}

/**
 * CORS Analyzer Tool
 * 
 * Responsabilité : Analyser les en-têtes de Cross-Origin Resource Sharing (CORS)
 * renvoyés par la requête HTTP pour déceler des mauvaises configurations,
 * comme un Origin '*' associé à des Credentials, ou un 'null' Origin.
 */
export class CorsAnalyzer {
  
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
   * Exécute l'analyse CORS
   */
  static analyze(httpResponse: HttpResponseData | null): CorsAnalyzerResult {
    let scoreNum = 100;
    const issues: CorsIssue[] = [];

    // Cas où aucune réponse n'est disponible
    if (!httpResponse) {
      return {
        score: 'A',
        scoreNum: 100,
        isCorsEnabled: false,
        allowedOrigins: '',
        allowedMethods: '',
        allowedHeaders: '',
        allowCredentials: false,
        issues: [{ severity: 'low', headerName: 'N/A', message: "Aucune donnée n'a pu être analysée." }]
      };
    }

    const headers = httpResponse.headers;
    const origin = headers['access-control-allow-origin'];
    const credentials = headers['access-control-allow-credentials'];
    const methods = headers['access-control-allow-methods'] || '';
    const allowHeaders = headers['access-control-allow-headers'] || '';

    // Si pas de Allow-Origin, le CORS n'est pas activé, donc le navigateur 
    // applique la politique Same-Origin classique (c'est très sécurisé par défaut).
    if (!origin) {
      return {
        score: 'A',
        scoreNum: 100,
        isCorsEnabled: false,
        allowedOrigins: '',
        allowedMethods: methods,
        allowedHeaders: allowHeaders,
        allowCredentials: false,
        issues: []
      };
    }

    const allowCredentials = credentials === 'true';

    // 1. Analyse de l'Origin
    if (origin === '*') {
      if (allowCredentials) {
        // C'est une faille de configuration majeure (bien que les navigateurs modernes la bloquent,
        // c'est l'intention d'une faille de sécurité critique).
        scoreNum -= 50;
        issues.push({
          severity: 'high',
          headerName: 'access-control-allow-origin',
          message: "Configuration invalide et dangereuse : Le joker '*' est utilisé en même temps que 'Access-Control-Allow-Credentials: true'."
        });
      } else {
        // API Publique. Ce n'est pas une faille si l'API est conçue pour être publique, 
        // mais c'est un risque si des données sensibles y transitent.
        scoreNum -= 20;
        issues.push({
          severity: 'medium',
          headerName: 'access-control-allow-origin',
          message: "L'origine est définie sur '*'. L'API est donc publique. Assurez-vous qu'aucune donnée privée n'est exposée."
        });
      }
    } else if (origin === 'null') {
      // L'origine 'null' est extrêmement dangereuse car n'importe quel iframe local ou data URL
      // peut prendre l'origine 'null' et bypasser les sécurités CORS.
      scoreNum -= 50;
      issues.push({
        severity: 'high',
        headerName: 'access-control-allow-origin',
        message: "L'origine est configurée sur 'null'. C'est une faille majeure. Les attaquants peuvent usurper cette origine via des iframes sandboxés."
      });
    } else if (origin.split(',').length > 1) {
      // Le standard CORS ne permet qu'une seule origine ou '*'. Renvoyer une liste cassera les navigateurs.
      scoreNum -= 15;
      issues.push({
        severity: 'medium',
        headerName: 'access-control-allow-origin',
        message: "Plusieurs domaines sont renvoyés dans cet en-tête. Le standard W3C exige une seule origine ou '*'. La requête risque d'échouer côté client."
      });
    } else {
      // Un domaine spécifique (ex: https://example.com)
      // C'est la configuration la plus sécurisée (si le domaine est légitime).
      issues.push({
        severity: 'low',
        headerName: 'access-control-allow-origin',
        message: `L'accès CORS est restreint au domaine strict : ${origin}`
      });
    }

    // 2. Analyse de l'Access-Control-Max-Age
    const maxAge = headers['access-control-max-age'];
    if (!maxAge) {
      issues.push({
        severity: 'low',
        headerName: 'access-control-max-age',
        message: "L'en-tête Max-Age est manquant. Les navigateurs referont une requête OPTIONS à chaque appel, ce qui impacte les performances."
      });
    }

    scoreNum = Math.max(0, scoreNum);

    return {
      score: this.gradeScore(scoreNum),
      scoreNum,
      isCorsEnabled: true,
      allowedOrigins: origin,
      allowedMethods: methods,
      allowedHeaders: allowHeaders,
      allowCredentials,
      issues
    };
  }
}
