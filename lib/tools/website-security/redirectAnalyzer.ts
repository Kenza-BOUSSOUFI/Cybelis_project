import { HttpCollectionResult, HttpResponseData } from '../../collectors/http';

export interface RedirectIssue {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface RedirectAnalyzerResult {
  score: 'A' | 'B' | 'C' | 'D' | 'F';
  scoreNum: number;
  initialUrl: string;
  finalUrl: string;
  redirectCount: number;
  isHttpsEnforced: boolean;
  hasInsecureDowngrade: boolean;
  hasExcessiveRedirects: boolean;
  redirectChainUrls: string[];
  issues: RedirectIssue[];
}

/**
 * Redirect Analyzer Tool
 * 
 * Responsabilité : Analyser la chaîne de redirection HTTP renvoyée par le HttpCollector.
 * Il détecte la présence d'une redirection forcée vers HTTPS, les redirections excessives,
 * et les régressions de sécurité (downgrade HTTPS -> HTTP).
 * Aucun appel réseau supplémentaire n'est effectué.
 */
export class RedirectAnalyzer {
  private static gradeScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  static analyze(httpData: HttpCollectionResult): RedirectAnalyzerResult {
    let scoreNum = 100;
    const issues: RedirectIssue[] = [];

    const initialUrl = httpData.initialUrl;
    const finalUrl = httpData.finalUrl;
    const redirectChain = httpData.redirectChain || [];
    const redirectCount = redirectChain.length;

    const redirectChainUrls = [
      ...redirectChain.map((r: HttpResponseData) => r.url),
      finalUrl
    ];

    let isHttpsEnforced = false;
    let hasInsecureDowngrade = false;
    let hasExcessiveRedirects = false;

    if (initialUrl.startsWith('http://') && finalUrl.startsWith('https://')) {
      isHttpsEnforced = true;
    } else if (initialUrl.startsWith('http://') && finalUrl.startsWith('http://')) {
      scoreNum -= 30;
      issues.push({ severity: 'high', message: "L'URL HTTP initiale n'est pas redirigée automatiquement vers HTTPS." });
    }

    for (let i = 0; i < redirectChainUrls.length - 1; i++) {
      const current = redirectChainUrls[i];
      const next = redirectChainUrls[i + 1];

      if (current.startsWith('https://') && next.startsWith('http://')) {
        hasInsecureDowngrade = true;
        scoreNum -= 50;
        issues.push({ severity: 'high', message: `Redirection insécurisée détectée : Rétrogradation de HTTPS à HTTP (${current} -> ${next}).` });
      }
    }

    if (redirectCount > 3) {
      hasExcessiveRedirects = true;
      scoreNum -= 20;
      issues.push({ severity: 'medium', message: `Nombre excessif de redirections HTTP (${redirectCount} sauts).` });
    }

    const uniqueUrls = new Set(redirectChainUrls);
    if (uniqueUrls.size < redirectChainUrls.length) {
      scoreNum -= 40;
      issues.push({ severity: 'high', message: "La chaîne de redirection contient des doublons ou des boucles d'URL." });
    }

    scoreNum = Math.max(0, scoreNum);

    return {
      score: this.gradeScore(scoreNum),
      scoreNum,
      initialUrl,
      finalUrl,
      redirectCount,
      isHttpsEnforced,
      hasInsecureDowngrade,
      hasExcessiveRedirects,
      redirectChainUrls,
      issues
    };
  }
}
