import { HttpCollector } from './collectors/http';
import { TlsCollector } from './collectors/tls';

import { SslChecker } from './tools/sslChecker';
import { TlsAnalyzer } from './tools/tlsAnalyzer';
import { HeadersChecker } from './tools/headersChecker';
import { CookieAnalyzer } from './tools/cookieAnalyzer';
import { HttpMethodsAnalyzer } from './tools/httpMethodsAnalyzer';
import { CorsAnalyzer } from './tools/corsAnalyzer';
import { CspValidator } from './tools/cspValidator';
import { RobotsAnalyzer } from './tools/robotsAnalyzer';
import { SitemapChecker } from './tools/sitemapChecker';

export interface ScanReport {
  targetUrl: string;
  scanDate: string;
  globalScore: number;
  globalGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  modules: {
    ssl: ReturnType<typeof SslChecker.analyze>;
    tls: ReturnType<typeof TlsAnalyzer.analyze>;
    headers: ReturnType<typeof HeadersChecker.analyze>;
    cookies: ReturnType<typeof CookieAnalyzer.analyze>;
    methods: ReturnType<typeof HttpMethodsAnalyzer.analyze>;
    cors: ReturnType<typeof CorsAnalyzer.analyze>;
    csp: ReturnType<typeof CspValidator.analyze>;
    robots: ReturnType<typeof RobotsAnalyzer.analyze>;
    sitemap: ReturnType<typeof SitemapChecker.analyze>;
  };
}

/**
 * Scan Engine
 * 
 * Responsabilité : Chef d'orchestre global. 
 * Il n'effectue aucune analyse lui-même. 
 * Il pilote les collecteurs (en parallèle pour la performance),
 * distribue les données brutes aux outils, et agrège le JSON final.
 */
export class ScanEngine {
  
  /**
   * Convertit les notes lettres des outils (ex: SslChecker) en valeurs numériques
   */
  private static convertGradeToScore(grade: string): number {
    switch (grade) {
      case 'A': return 100;
      case 'B': return 80;
      case 'C': return 50;
      case 'D': return 30;
      case 'F': return 0;
      default: return 0;
    }
  }

  /**
   * Calcule une moyenne globale basée sur les scores numériques
   */
  private static calculateGlobalScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
  }

  /**
   * Convertit le score global final en grade
   */
  private static getGlobalGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  /**
   * Lance un scan de sécurité complet sur la cible
   */
  static async runFullScan(targetUrl: string): Promise<ScanReport> {
    // 1. Normalisation de l'URL
    let baseUrl = targetUrl.trim();
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    let domain = '';
    let origin = '';
    try {
      const parsedUrl = new URL(baseUrl);
      domain = parsedUrl.hostname;
      origin = parsedUrl.origin;
    } catch (e) {
      throw new Error(`L'URL fournie ("${targetUrl}") est invalide.`);
    }

    // 2. Phase de Collecte (Requêtes réseau exécutées en parallèle)
    const [
      httpData,
      optionsData,
      tlsData,
      robotsData,
      sitemapData
    ] = await Promise.all([
      HttpCollector.collectGet(baseUrl),
      HttpCollector.collectOptions(baseUrl),
      TlsCollector.collect(domain),
      HttpCollector.collectGet(`${origin}/robots.txt`, true),
      HttpCollector.collectGet(`${origin}/sitemap.xml`, true)
    ]);

    // 3. Phase d'Analyse (Distribution stricte des données)
    const sslResult = SslChecker.analyze(tlsData);
    const tlsResult = TlsAnalyzer.analyze(tlsData);
    const headersResult = HeadersChecker.analyze(httpData);
    const cookiesResult = CookieAnalyzer.analyze(httpData);
    const methodsResult = HttpMethodsAnalyzer.analyze(optionsData);
    const corsResult = CorsAnalyzer.analyze(optionsData);
    const cspResult = CspValidator.analyze(httpData);
    const robotsResult = RobotsAnalyzer.analyze(robotsData);
    const sitemapResult = SitemapChecker.analyze(sitemapData);

    // 4. Agrégation des scores
    const scores = [
      this.convertGradeToScore(sslResult.score),
      this.convertGradeToScore(tlsResult.score),
      headersResult.scoreNum,
      cookiesResult.scoreNum,
      methodsResult.scoreNum,
      corsResult.scoreNum,
      cspResult.scoreNum,
      robotsResult.scoreNum,
      sitemapResult.scoreNum
    ];

    const globalScore = this.calculateGlobalScore(scores);

    // 5. Génération du Rapport JSON
    return {
      targetUrl: baseUrl,
      scanDate: new Date().toISOString(),
      globalScore,
      globalGrade: this.getGlobalGrade(globalScore),
      modules: {
        ssl: sslResult,
        tls: tlsResult,
        headers: headersResult,
        cookies: cookiesResult,
        methods: methodsResult,
        cors: corsResult,
        csp: cspResult,
        robots: robotsResult,
        sitemap: sitemapResult
      }
    };
  }
}
