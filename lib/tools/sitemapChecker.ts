import { HttpCollectionResult } from '../collectors/http';

export interface SitemapIssue {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface SitemapCheckerResult {
  score: 'A' | 'B' | 'C' | 'F';
  scoreNum: number;
  isFound: boolean;
  isValidXml: boolean;
  urlsCount: number;
  extractedUrls: string[];
  issues: SitemapIssue[];
}

/**
 * Sitemap Checker Tool
 * 
 * Responsabilité : Analyser le fichier sitemap.xml fourni par le HttpCollector.
 * Vérifier son existence, valider grossièrement sa structure XML, 
 * extraire les URLs présentes (via balise <loc>) et formuler des alertes.
 */
export class SitemapChecker {
  
  /**
   * Extrait les URLs depuis le XML via les balises <loc>
   * N'utilise volontairement aucune librairie tierce pour respecter la contrainte d'autonomie.
   */
  private static extractUrls(xmlBody: string): string[] {
    const urls: string[] = [];
    // Recherche globale de la balise <loc> peu importe le namespace ou la casse
    const regex = /<loc[^>]*>([\s\S]*?)<\/loc>/gi;
    let match;

    while ((match = regex.exec(xmlBody)) !== null) {
      const url = match[1].trim();
      if (url) {
        urls.push(url);
      }
    }

    return urls;
  }

  /**
   * Vérifie grossièrement si le corps ressemble à du XML ou à un Sitemap
   */
  private static checkXmlValidity(body: string): boolean {
    const lowerBody = body.trim().toLowerCase();
    // Un sitemap standard commence par une déclaration xml ou une balise urlset/sitemapindex
    return lowerBody.startsWith('<?xml') || lowerBody.startsWith('<urlset') || lowerBody.startsWith('<sitemapindex');
  }

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
   * Exécute l'analyse du sitemap
   */
  static analyze(httpData: HttpCollectionResult): SitemapCheckerResult {
    let scoreNum = 100;
    const issues: SitemapIssue[] = [];
    const extractedUrls: string[] = [];
    let isValidXml = false;

    // 1. Vérification de l'existence
    if (!httpData.finalResponse || httpData.finalResponse.status !== 200 || !httpData.body) {
      return {
        score: 'A', // L'absence de sitemap.xml n'est pas une faille de sécurité, juste un point SEO
        scoreNum: 100,
        isFound: false,
        isValidXml: false,
        urlsCount: 0,
        extractedUrls: [],
        issues: [{ severity: 'low', message: "Le fichier sitemap.xml n'a pas été trouvé ou renvoie une erreur (Code " + (httpData.finalResponse?.status || 'N/A') + ")." }]
      };
    }

    // 2. Validation basique de la structure XML
    const body = httpData.body;
    isValidXml = this.checkXmlValidity(body);

    if (!isValidXml) {
      scoreNum -= 20;
      issues.push({ 
        severity: 'medium', 
        message: "Le fichier trouvé ne ressemble pas à un document XML ou Sitemap valide. Les moteurs de recherche pourraient l'ignorer." 
      });
    }

    // 3. Extraction des URLs
    const urls = this.extractUrls(body);
    extractedUrls.push(...urls);

    // 4. Analyse des limites et contenus
    if (urls.length === 0 && isValidXml) {
      scoreNum -= 10;
      issues.push({ 
        severity: 'low', 
        message: "Le sitemap est valide mais aucune URL (balise <loc>) n'y a été trouvée." 
      });
    }

    if (urls.length > 50000) {
      scoreNum -= 20;
      issues.push({ 
        severity: 'medium', 
        message: `Le Sitemap contient ${urls.length} URLs. La limite standard recommandée par les moteurs de recherche est de 50 000. Divisez-le avec un SitemapIndex.` 
      });
    }

    // Détection d'URL HTTP non chiffrées dans le sitemap (Mauvaise pratique SEO et Sécurité)
    const httpUrls = urls.filter(url => url.toLowerCase().startsWith('http://'));
    if (httpUrls.length > 0) {
      scoreNum -= 15;
      issues.push({ 
        severity: 'medium', 
        message: `Le Sitemap contient ${httpUrls.length} URL(s) en 'http://' (non chiffrées). Assurez-vous de forcer le 'https://' pour éviter le Mixed Content et protéger l'indexation.` 
      });
    }

    scoreNum = Math.max(0, scoreNum);

    return {
      score: this.gradeScore(scoreNum),
      scoreNum,
      isFound: true,
      isValidXml,
      urlsCount: extractedUrls.length,
      extractedUrls,
      issues
    };
  }
}
