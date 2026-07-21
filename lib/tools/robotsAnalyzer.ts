import { HttpCollectionResult } from '../collectors/http';

export interface RobotsIssue {
  severity: 'high' | 'medium' | 'low';
  path: string;
  message: string;
}

export interface RobotsRule {
  userAgent: string;
  allow: string[];
  disallow: string[];
}

export interface RobotsAnalyzerResult {
  score: 'A' | 'B' | 'C' | 'F';
  scoreNum: number;
  isFound: boolean;
  rules: RobotsRule[];
  sitemaps: string[];
  sensitivePathsLeaked: string[];
  issues: RobotsIssue[];
}

/**
 * Robots.txt Analyzer Tool
 * 
 * Responsabilité : Analyser le contenu du fichier robots.txt (récupéré par le HttpCollector).
 * Il parse les directives (User-agent, Allow, Disallow, Sitemap) et détecte
 * les fuites potentielles d'informations (chemins sensibles masqués aux bots mais
 * visibles par les attaquants).
 */
export class RobotsAnalyzer {
  // Liste de mots-clés souvent utilisés pour cacher des zones sensibles
  private static readonly SENSITIVE_KEYWORDS = [
    'admin', 'login', 'wp-admin', 'wp-login', 'config', 'api', 
    '.env', '.git', 'backup', 'tmp', 'database', 'db', 'logs'
  ];

  /**
   * Parse le contenu textuel brut du robots.txt
   */
  private static parseRobotsTxt(body: string): { rules: RobotsRule[], sitemaps: string[] } {
    const rules: RobotsRule[] = [];
    const sitemaps: string[] = [];
    
    let currentRule: RobotsRule | null = null;
    const lines = body.split('\n');

    for (let line of lines) {
      // Nettoyage de la ligne (retrait des commentaires et espaces)
      line = line.split('#')[0].trim();
      if (!line) continue;

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();

      if (key === 'user-agent') {
        // Nouveau bloc User-Agent
        currentRule = { userAgent: value, allow: [], disallow: [] };
        rules.push(currentRule);
      } else if (key === 'allow' && currentRule) {
        currentRule.allow.push(value);
      } else if (key === 'disallow' && currentRule) {
        currentRule.disallow.push(value);
      } else if (key === 'sitemap') {
        sitemaps.push(value);
      }
    }

    return { rules, sitemaps };
  }

  /**
   * Vérifie si un chemin disallow contient des mots-clés sensibles
   */
  private static isPathSensitive(path: string): boolean {
    const lowerPath = path.toLowerCase();
    
    // Ignorer les chemins très courts ou génériques comme "/" ou "/?"
    if (lowerPath.length < 3) return false;

    return this.SENSITIVE_KEYWORDS.some(keyword => lowerPath.includes(keyword));
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
   * Exécute l'analyse sur les données collectées
   */
  static analyze(httpData: HttpCollectionResult): RobotsAnalyzerResult {
    let scoreNum = 100;
    const issues: RobotsIssue[] = [];
    const sensitivePathsLeaked = new Set<string>();

    // Vérification de l'existence du fichier
    // On considère qu'un robots.txt valide renvoie un code 200 avec du texte
    if (!httpData.finalResponse || httpData.finalResponse.status !== 200 || !httpData.body) {
      return {
        score: 'A', // L'absence de robots.txt n'est pas une faille
        scoreNum: 100,
        isFound: false,
        rules: [],
        sitemaps: [],
        sensitivePathsLeaked: [],
        issues: [{ severity: 'low', path: 'N/A', message: "Le fichier robots.txt n'a pas été trouvé (Code " + (httpData.finalResponse?.status || 'Erreur') + ")." }]
      };
    }

    const { rules, sitemaps } = this.parseRobotsTxt(httpData.body);

    // 1. Détection des chemins sensibles exposés
    for (const rule of rules) {
      for (const path of rule.disallow) {
        if (this.isPathSensitive(path)) {
          sensitivePathsLeaked.add(path);
        }
      }
    }

    // 2. Évaluation du risque
    const leakedPathsArray = Array.from(sensitivePathsLeaked);
    
    if (leakedPathsArray.length > 0) {
      // Pour chaque chemin sensible trouvé, on réduit la note.
      // Le robots.txt est un fichier public. Disallow: /admin indique explicitement 
      // aux hackers que le dossier /admin existe.
      scoreNum -= 20 * leakedPathsArray.length;
      
      for (const path of leakedPathsArray) {
        issues.push({
          severity: 'medium',
          path,
          message: `Le chemin '${path}' a été défini en Disallow. Bien que cela empêche l'indexation Google, le fichier robots.txt est public et révèle cette route sensible aux attaquants.`
        });
      }
    }

    if (rules.length === 0 && sitemaps.length === 0) {
      issues.push({
        severity: 'low',
        path: 'N/A',
        message: "Le fichier robots.txt existe mais semble vide ou mal formaté."
      });
    }

    scoreNum = Math.max(0, scoreNum);

    return {
      score: this.gradeScore(scoreNum),
      scoreNum,
      isFound: true,
      rules,
      sitemaps,
      sensitivePathsLeaked: leakedPathsArray,
      issues
    };
  }
}
