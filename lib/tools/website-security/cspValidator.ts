import { HttpCollectionResult } from '../../collectors/http';

export interface CspIssue {
  severity: 'high' | 'medium' | 'low';
  directive: string;
  message: string;
}

export interface CspValidatorResult {
  score: 'A' | 'B' | 'C' | 'F';
  scoreNum: number;
  isCspEnabled: boolean;
  rawPolicy: string;
  parsedDirectives: Record<string, string[]>;
  issues: CspIssue[];
}

/**
 * CSP Validator Tool
 * 
 * Responsabilité : Parser et analyser en profondeur l'en-tête Content-Security-Policy (CSP)
 * récolté par le HttpCollector. Il détecte les directives trop permissives
 * comme 'unsafe-inline', 'unsafe-eval', ou l'utilisation du joker '*'.
 */
export class CspValidator {
  
  /**
   * Parse la chaîne CSP brute en un dictionnaire de directives et de valeurs
   */
  private static parseCsp(rawCsp: string): Record<string, string[]> {
    const directives: Record<string, string[]> = {};
    
    const parts = rawCsp.split(';');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      const tokens = trimmed.split(/\s+/);
      const directiveName = tokens[0].toLowerCase();
      const directiveValues = tokens.slice(1);
      
      directives[directiveName] = directiveValues;
    }
    
    return directives;
  }

  /**
   * Analyse une directive spécifique pour y chercher des patterns dangereux
   */
  private static analyzeDirective(directiveName: string, values: string[], issues: CspIssue[]): number {
    let penalty = 0;
    const lowerValues = values.map(v => v.toLowerCase());

    if (lowerValues.includes("'unsafe-inline'")) {
      penalty += 20;
      issues.push({
        severity: 'high',
        directive: directiveName,
        message: `La directive autorise 'unsafe-inline'. Cela annule la protection contre les failles XSS en permettant l'exécution de code injecté directement dans le HTML.`
      });
    }

    if (lowerValues.includes("'unsafe-eval'")) {
      penalty += 15;
      issues.push({
        severity: 'high',
        directive: directiveName,
        message: `La directive autorise 'unsafe-eval'. Cela permet l'utilisation de fonctions comme eval(), souvent ciblées par les attaquants.`
      });
    }

    if (lowerValues.includes("*")) {
      penalty += 20;
      issues.push({
        severity: 'high',
        directive: directiveName,
        message: `La directive utilise le joker '*'. Elle autorise le chargement de ressources depuis N'IMPORTE QUEL domaine.`
      });
    }

    // Autoriser data: ou blob: dans script-src ou object-src est dangereux
    if ((directiveName === 'script-src' || directiveName === 'object-src' || directiveName === 'default-src')) {
      if (lowerValues.some(v => v.startsWith('data:'))) {
        penalty += 15;
        issues.push({
          severity: 'high',
          directive: directiveName,
          message: `La directive autorise le schéma 'data:'. Un attaquant pourrait injecter un script encodé en base64.`
        });
      }
      if (lowerValues.some(v => v.startsWith('http:'))) {
        penalty += 15;
        issues.push({
          severity: 'medium',
          directive: directiveName,
          message: `La directive autorise le chargement depuis des URL en clair 'http:'. Les ressources peuvent être interceptées (Man-In-The-Middle).`
        });
      }
    }

    return penalty;
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
   * Exécute l'analyse CSP complète
   */
  static analyze(httpData: HttpCollectionResult): CspValidatorResult {
    const issues: CspIssue[] = [];
    let scoreNum = 100;

    if (!httpData.finalResponse || !httpData.finalResponse.headers['content-security-policy']) {
      issues.push({ severity: 'high', directive: 'N/A', message: "Aucun Content-Security-Policy (CSP) n'a été détecté. Le site n'a pas de bouclier contre les attaques XSS." });
      return {
        score: 'F',
        scoreNum: 0,
        isCspEnabled: false,
        rawPolicy: '',
        parsedDirectives: {},
        issues
      };
    }

    const rawPolicy = httpData.finalResponse.headers['content-security-policy'];
    const parsedDirectives = this.parseCsp(rawPolicy);

    // 1. Analyse globale (Directives manquantes)
    if (!parsedDirectives['default-src']) {
      scoreNum -= 10;
      issues.push({
        severity: 'medium',
        directive: 'default-src',
        message: "La directive 'default-src' est manquante. Sans elle, si une ressource spécifique n'a pas sa directive, elle sera autorisée par défaut."
      });
    }

    if (!parsedDirectives['object-src']) {
      issues.push({
        severity: 'low',
        directive: 'object-src',
        message: "La directive 'object-src' est manquante. Il est recommandé de la définir à 'none' pour bloquer les plugins obsolètes (Flash, Java)."
      });
    } else if (!parsedDirectives['object-src'].includes("'none'")) {
      issues.push({
        severity: 'low',
        directive: 'object-src',
        message: "La directive 'object-src' devrait idéalement être configurée sur 'none'."
      });
    }

    // 2. Analyse détaillée par directive
    for (const [directiveName, values] of Object.entries(parsedDirectives)) {
      scoreNum -= this.analyzeDirective(directiveName, values, issues);
    }

    scoreNum = Math.max(0, scoreNum);

    return {
      score: this.gradeScore(scoreNum),
      scoreNum,
      isCspEnabled: true,
      rawPolicy,
      parsedDirectives,
      issues
    };
  }
}
