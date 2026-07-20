import { HttpCollectionResult, HttpResponseData } from '../collectors/http';

export interface CookieIssue {
  severity: 'high' | 'medium' | 'low';
  cookieName: string;
  message: string;
}

export interface CookieData {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'Strict' | 'Lax' | 'None' | 'Not Set';
  expires?: string;
  maxAge?: string;
  isSession: boolean;
}

export interface CookieAnalyzerResult {
  score: 'A' | 'B' | 'C' | 'F';
  scoreNum: number;
  cookiesFound: number;
  analyzedCookies: CookieData[];
  issues: CookieIssue[];
}

/**
 * Cookie Analyzer Tool
 * 
 * Responsabilité : Extraire et analyser les en-têtes `set-cookie` 
 * depuis la chaîne de redirection et la réponse finale du HttpCollector.
 * Il vérifie la présence des flags de sécurité essentiels : Secure, HttpOnly, SameSite.
 */
export class CookieAnalyzer {
  
  /**
   * Sépare proprement une chaîne contenant de multiples cookies.
   * L'API Fetch concatène plusieurs "set-cookie" avec une virgule, mais le format
   * de date "Expires=" contient aussi une virgule. On utilise un lookbehind négatif.
   */
  private static splitCombinedCookies(combinedCookies: string): string[] {
    // Coupe à la virgule, SAUF si elle est suivie d'un jour de la semaine (format Date RFC)
    return combinedCookies
      .split(/,(?!\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b)/i)
      .map(c => c.trim())
      .filter(c => c.length > 0);
  }

  /**
   * Parse une chaîne brute `set-cookie` en un objet structuré
   */
  private static parseCookie(rawCookie: string): CookieData | null {
    const parts = rawCookie.split(';').map(p => p.trim());
    if (parts.length === 0) return null;

    // La première partie est toujours "Nom=Valeur"
    const nameValue = parts[0].split('=');
    const name = nameValue[0];
    const value = nameValue.slice(1).join('='); // Au cas où la valeur contiendrait un '='

    if (!name) return null;

    const cookieData: CookieData = {
      name,
      value,
      secure: false,
      httpOnly: false,
      sameSite: 'Not Set',
      isSession: true
    };

    // Analyse des attributs suivants
    for (let i = 1; i < parts.length; i++) {
      const attribute = parts[i];
      const attrLower = attribute.toLowerCase();

      if (attrLower === 'secure') {
        cookieData.secure = true;
      } else if (attrLower === 'httponly') {
        cookieData.httpOnly = true;
      } else if (attrLower.startsWith('samesite=')) {
        const sameSiteValue = attribute.split('=')[1]?.toLowerCase();
        if (sameSiteValue === 'strict') cookieData.sameSite = 'Strict';
        else if (sameSiteValue === 'lax') cookieData.sameSite = 'Lax';
        else if (sameSiteValue === 'none') cookieData.sameSite = 'None';
      } else if (attrLower.startsWith('domain=')) {
        cookieData.domain = attribute.split('=')[1];
      } else if (attrLower.startsWith('path=')) {
        cookieData.path = attribute.split('=')[1];
      } else if (attrLower.startsWith('expires=')) {
        cookieData.expires = attribute.substring(8);
        cookieData.isSession = false;
      } else if (attrLower.startsWith('max-age=')) {
        cookieData.maxAge = attribute.substring(8);
        cookieData.isSession = false;
      }
    }

    return cookieData;
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
   * Exécute l'analyse de tous les cookies capturés durant la requête HTTP
   */
  static analyze(httpData: HttpCollectionResult): CookieAnalyzerResult {
    const rawCookiesList: string[] = [];
    const analyzedCookies: CookieData[] = [];
    const issues: CookieIssue[] = [];
    let scoreNum = 100;

    // 1. Extraire les cookies de la chaîne de redirection ET de la réponse finale
    const allResponses: HttpResponseData[] = [...httpData.redirectChain];
    if (httpData.finalResponse) {
      allResponses.push(httpData.finalResponse);
    }

    for (const response of allResponses) {
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        const separated = this.splitCombinedCookies(setCookieHeader);
        rawCookiesList.push(...separated);
      }
    }

    // Si aucun cookie n'a été trouvé, on renvoie une note parfaite
    if (rawCookiesList.length === 0) {
      return {
        score: 'A',
        scoreNum: 100,
        cookiesFound: 0,
        analyzedCookies: [],
        issues: []
      };
    }

    // 2. Parser et analyser chaque cookie
    for (const rawCookie of rawCookiesList) {
      const cookie = this.parseCookie(rawCookie);
      if (!cookie) continue;

      analyzedCookies.push(cookie);

      // Analyse Sécuritaire par cookie
      let hasVulnerability = false;

      // -- HttpOnly --
      // Manquer de HttpOnly expose le cookie aux attaques XSS. (Pénalité forte)
      if (!cookie.httpOnly) {
        issues.push({ severity: 'high', cookieName: cookie.name, message: "L'attribut 'HttpOnly' est manquant. Ce cookie est vulnérable aux attaques XSS (JavaScript)." });
        scoreNum -= 20;
        hasVulnerability = true;
      }

      // -- Secure --
      // Manquer de Secure autorise la transmission en HTTP clair. (Pénalité moyenne/forte)
      if (!cookie.secure) {
        issues.push({ severity: 'high', cookieName: cookie.name, message: "L'attribut 'Secure' est manquant. Ce cookie peut être intercepté sur des réseaux non chiffrés (HTTP)." });
        scoreNum -= 15;
        hasVulnerability = true;
      }

      // -- SameSite --
      // Permet d'atténuer les attaques CSRF
      if (cookie.sameSite === 'Not Set') {
        issues.push({ severity: 'medium', cookieName: cookie.name, message: "L'attribut 'SameSite' n'est pas défini. Les navigateurs récents forcent 'Lax' par défaut, mais il est recommandé de l'expliciter." });
        scoreNum -= 5;
      } else if (cookie.sameSite === 'None' && !cookie.secure) {
        // Règle d'or: SameSite=None OBLIGE l'attribut Secure
        issues.push({ severity: 'high', cookieName: cookie.name, message: "L'attribut 'SameSite=None' est utilisé sans le flag 'Secure'. Ce cookie sera rejeté par les navigateurs modernes." });
        scoreNum -= 25;
        hasVulnerability = true;
      }

      // -- Expiration très lointaine (Max-Age / Expires) --
      // Les cookies persistants (qui ne s'effacent pas à la fermeture) avec de longues durées sont risqués s'ils sont volés.
      if (!cookie.isSession) {
        // C'est juste une alerte 'low', on ne pénalise pas lourdement un cookie persistant sans connaître sa nature
        issues.push({ severity: 'low', cookieName: cookie.name, message: "Ce cookie est persistant (non-session). S'il contient des données sensibles, assurez-vous que la durée de vie est la plus courte possible." });
      }
    }

    // Éviter de descendre sous zéro
    scoreNum = Math.max(0, scoreNum);

    return {
      score: this.gradeScore(scoreNum),
      scoreNum,
      cookiesFound: analyzedCookies.length,
      analyzedCookies,
      issues
    };
  }
}
