import { HttpCollector } from './collectors/http';
import { TlsCollector } from './collectors/tls';
import { DnsCollector } from './collectors/dns';
import { WhoisCollector } from './collectors/whois';

import { SslChecker } from './tools/website-security/sslChecker';
import { TlsAnalyzer } from './tools/website-security/tlsAnalyzer';
import { HeadersChecker } from './tools/website-security/securityHeadersChecker';
import { CookieAnalyzer } from './tools/website-security/cookieAnalyzer';
import { HttpMethodsAnalyzer } from './tools/website-security/httpMethodsAnalyzer';
import { CorsAnalyzer } from './tools/website-security/corsAnalyzer';
import { CspValidator } from './tools/website-security/cspValidator';
import { RedirectAnalyzer } from './tools/website-security/redirectAnalyzer';
import { RobotsAnalyzer } from './tools/website-security/robotsAnalyzer';
import { SitemapChecker } from './tools/website-security/sitemapChecker';

import { SpfChecker } from './tools/email-security/spfChecker';
import { DkimChecker } from './tools/email-security/dkimChecker';
import { DmarcChecker } from './tools/email-security/dmarcChecker';

import { DnsLookup } from './tools/dns-domain-security/dnsLookup';
import { WhoisLookup } from './tools/dns-domain-security/whoisLookup';
import { DomainAgeChecker } from './tools/dns-domain-security/domainAgeChecker';

export interface ScanReport {
  targetUrl: string;
  scanDate: string;
  globalScore: number;
  globalGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  modules: {
    ssl?: ReturnType<typeof SslChecker.analyze>;
    tls?: ReturnType<typeof TlsAnalyzer.analyze>;
    headers?: ReturnType<typeof HeadersChecker.analyze>;
    cookies?: ReturnType<typeof CookieAnalyzer.analyze>;
    methods?: ReturnType<typeof HttpMethodsAnalyzer.analyze>;
    cors?: ReturnType<typeof CorsAnalyzer.analyze>;
    csp?: ReturnType<typeof CspValidator.analyze>;
    redirect?: ReturnType<typeof RedirectAnalyzer.analyze>;
    robots?: ReturnType<typeof RobotsAnalyzer.analyze>;
    sitemap?: ReturnType<typeof SitemapChecker.analyze>;
    dns?: ReturnType<typeof DnsLookup.analyze>;
    spf?: ReturnType<typeof SpfChecker.analyze>;
    dkim?: ReturnType<typeof DkimChecker.analyze>;
    dmarc?: ReturnType<typeof DmarcChecker.analyze>;
    whois?: ReturnType<typeof WhoisLookup.analyze>;
    domainAge?: ReturnType<typeof DomainAgeChecker.analyze>;
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
   * Lance un scan de sécurité complet sur la cible (compatibilité descendante)
   */
  static async runFullScan(targetUrl: string): Promise<ScanReport> {
    return this.run(targetUrl);
  }

  /**
   * Lance un scan (complet ou ciblé par outil) sur la cible
   */
  static async run(targetUrl: string, selectedToolSlugs?: string[]): Promise<ScanReport> {
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

    const runAll = !selectedToolSlugs || selectedToolSlugs.length === 0;
    const slugs = selectedToolSlugs || [];

    // Détermination des collecteurs requis
    const needHttp = runAll || slugs.some(s => ['security-headers', 'cookie-analyzer', 'csp-validator', 'redirect-analyzer'].includes(s));
    const needOptions = runAll || slugs.some(s => ['http-methods', 'cors-analyzer'].includes(s));
    const needTls = runAll || slugs.some(s => ['ssl-checker', 'tls-analyzer'].includes(s));
    const needDns = runAll || slugs.some(s => ['spf-checker', 'dkim-checker', 'dmarc-checker', 'dns-lookup'].includes(s));
    const needWhois = runAll || slugs.some(s => ['whois-lookup', 'domain-age-checker'].includes(s));
    const needRobots = runAll || slugs.includes('robots-analyzer');
    const needSitemap = runAll || slugs.includes('sitemap-checker');

    // 2. Phase de Collecte (Requêtes réseau exécutées en parallèle si nécessaires)
    const [
      httpData,
      optionsData,
      tlsData,
      dnsData,
      whoisData,
      robotsData,
      sitemapData
    ] = await Promise.all([
      needHttp ? HttpCollector.collectGet(baseUrl) : Promise.resolve(null),
      needOptions ? HttpCollector.collectOptions(baseUrl) : Promise.resolve(null),
      needTls ? TlsCollector.collect(domain) : Promise.resolve(null),
      needDns ? DnsCollector.collect(domain) : Promise.resolve(null),
      needWhois ? WhoisCollector.collect(domain) : Promise.resolve(null),
      needRobots ? HttpCollector.collectGet(`${origin}/robots.txt`, true) : Promise.resolve(null),
      needSitemap ? HttpCollector.collectGet(`${origin}/sitemap.xml`, true) : Promise.resolve(null)
    ]);

    // 3. Phase d'Analyse
    const modules: ScanReport['modules'] = {};
    const scores: number[] = [];

    // WEBSITE_SECURITY
    if (runAll || slugs.includes('ssl-checker')) {
      const res = SslChecker.analyze(tlsData || { hostname: domain, error: 'Non exécuté' } as any);
      modules.ssl = res;
      scores.push(this.convertGradeToScore(res.score));
    }
    if (runAll || slugs.includes('tls-analyzer')) {
      const res = TlsAnalyzer.analyze(tlsData || { hostname: domain, error: 'Non exécuté' } as any);
      modules.tls = res;
      scores.push(this.convertGradeToScore(res.score));
    }
    if (runAll || slugs.includes('security-headers')) {
      const res = HeadersChecker.analyze(httpData || { url: baseUrl, headers: {}, body: '', status: 0, error: 'Non exécuté' } as any);
      modules.headers = res;
      scores.push(res.scoreNum);
    }
    if (runAll || slugs.includes('cookie-analyzer')) {
      const res = CookieAnalyzer.analyze(httpData || { url: baseUrl, headers: {}, body: '', status: 0, error: 'Non exécuté' } as any);
      modules.cookies = res;
      scores.push(res.scoreNum);
    }
    if (runAll || slugs.includes('http-methods')) {
      const res = HttpMethodsAnalyzer.analyze(optionsData || { url: baseUrl, allowedMethods: [], error: 'Non exécuté' } as any);
      modules.methods = res;
      scores.push(res.scoreNum);
    }
    if (runAll || slugs.includes('cors-analyzer')) {
      const res = CorsAnalyzer.analyze(optionsData || { url: baseUrl, allowedMethods: [], error: 'Non exécuté' } as any);
      modules.cors = res;
      scores.push(res.scoreNum);
    }
    if (runAll || slugs.includes('csp-validator')) {
      const res = CspValidator.analyze(httpData || { url: baseUrl, headers: {}, body: '', status: 0, error: 'Non exécuté' } as any);
      modules.csp = res;
      scores.push(res.scoreNum);
    }
    if (runAll || slugs.includes('redirect-analyzer')) {
      const res = RedirectAnalyzer.analyze(httpData || { url: baseUrl, headers: {}, body: '', status: 0, error: 'Non exécuté' } as any);
      modules.redirect = res;
      scores.push(res.scoreNum);
    }
    if (runAll || slugs.includes('robots-analyzer')) {
      const res = RobotsAnalyzer.analyze(robotsData || { url: `${origin}/robots.txt`, headers: {}, body: '', status: 0, error: 'Non exécuté' } as any);
      modules.robots = res;
      scores.push(res.scoreNum);
    }
    if (runAll || slugs.includes('sitemap-checker')) {
      const res = SitemapChecker.analyze(sitemapData || { url: `${origin}/sitemap.xml`, headers: {}, body: '', status: 0, error: 'Non exécuté' } as any);
      modules.sitemap = res;
      scores.push(res.scoreNum);
    }

    // EMAIL_SECURITY
    if (runAll || slugs.includes('spf-checker')) {
      const res = SpfChecker.analyze(dnsData || { domain, records: [], error: 'Non exécuté' } as any);
      modules.spf = res;
      scores.push(res.scoreNum);
    }
    if (runAll || slugs.includes('dkim-checker')) {
      const res = DkimChecker.analyze(dnsData || { domain, records: [], error: 'Non exécuté' } as any);
      modules.dkim = res;
      scores.push(res.scoreNum);
    }
    if (runAll || slugs.includes('dmarc-checker')) {
      const res = DmarcChecker.analyze(dnsData || { domain, records: [], error: 'Non exécuté' } as any);
      modules.dmarc = res;
      scores.push(res.scoreNum);
    }

    // DNS_DOMAIN_SECURITY
    if (runAll || slugs.includes('dns-lookup')) {
      const res = DnsLookup.analyze(dnsData || { domain, records: [], error: 'Non exécuté' } as any);
      modules.dns = res;
      scores.push(res.scoreNum);
    }
    if (runAll || slugs.includes('whois-lookup')) {
      const res = WhoisLookup.analyze(whoisData || { domain, rawData: '', error: 'Non exécuté' } as any);
      modules.whois = res;
      scores.push(res.scoreNum);
    }
    if (runAll || slugs.includes('domain-age-checker')) {
      const res = DomainAgeChecker.analyze(whoisData || { domain, rawData: '', error: 'Non exécuté' } as any);
      modules.domainAge = res;
      scores.push(res.scoreNum);
    }

    const globalScore = this.calculateGlobalScore(scores);

    return {
      targetUrl: baseUrl,
      scanDate: new Date().toISOString(),
      globalScore,
      globalGrade: this.getGlobalGrade(globalScore),
      modules
    };
  }
}
