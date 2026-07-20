export interface HttpResponseData {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface HttpCollectionResult {
  initialUrl: string;
  finalUrl: string;
  redirectChain: HttpResponseData[];
  finalResponse: HttpResponseData | null;
  body: string;
  responseTimeMs: number;
  error?: string;
}

/**
 * HTTP Collector
 * 
 * Responsabilité : Collecter les données brutes (headers, statuts, body, redirections) 
 * depuis une URL cible via les requêtes HTTP (GET, OPTIONS).
 * Ce module n'effectue aucune analyse de sécurité.
 */
export class HttpCollector {
  /**
   * Convertit l'objet Headers natif (fetch) en un dictionnaire plat typé.
   */
  private static parseHeaders(headers: Headers): Record<string, string> {
    const parsed: Record<string, string> = {};
    headers.forEach((value, key) => {
      parsed[key.toLowerCase()] = value;
    });
    return parsed;
  }

  /**
   * Exécute une requête HTTP GET en suivant manuellement les redirections.
   * Conserver la chaîne de redirection est essentiel en cybersécurité 
   * (ex: vérifier le passage forcé de HTTP à HTTPS ou la perte de cookies).
   */
  static async collectGet(targetUrl: string, includeBody = false, maxRedirects = 5, timeoutMs = 10000): Promise<HttpCollectionResult> {
    let currentUrl = targetUrl;
    const redirectChain: HttpResponseData[] = [];
    let redirectsCount = 0;
    const startTime = performance.now();
    let body = '';

    try {
      // Validation de base de l'URL
      new URL(targetUrl);

      while (true) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        let response: Response;
        try {
          response = await fetch(currentUrl, {
            method: 'GET',
            redirect: 'manual', // On gère manuellement pour capturer les headers à chaque saut
            signal: controller.signal,
            headers: {
              'User-Agent': 'Cybelis-Security-Analyzer/1.0',
            }
          });
        } finally {
          clearTimeout(timeoutId);
        }

        const headers = this.parseHeaders(response.headers);
        const status = response.status;
        
        const responseData: HttpResponseData = {
          url: currentUrl,
          status,
          statusText: response.statusText,
          headers
        };

        // Gestion des redirections (codes 3xx avec header Location)
        if (status >= 300 && status < 400 && headers['location']) {
          redirectChain.push(responseData);
          redirectsCount++;
          
          if (redirectsCount > maxRedirects) {
            throw new Error(`Too many redirects (max: ${maxRedirects})`);
          }
          
          // Reconstruire l'URL absolue si le header Location est relatif
          const nextUrl = new URL(headers['location'], currentUrl).toString();
          currentUrl = nextUrl;
        } else {
          // Réponse finale atteinte
          if (includeBody) {
            body = await response.text();
          } else {
            // Annuler le flux réseau pour économiser la mémoire et la bande passante
            if (response.body) {
              await response.body.cancel().catch(() => {});
            }
          }
          const endTime = performance.now();
          
          return {
            initialUrl: targetUrl,
            finalUrl: currentUrl,
            redirectChain,
            finalResponse: responseData,
            body,
            responseTimeMs: Math.round(endTime - startTime),
          };
        }
      }
    } catch (error: any) {
      const endTime = performance.now();
      return {
        initialUrl: targetUrl,
        finalUrl: currentUrl,
        redirectChain,
        finalResponse: null,
        body: '',
        responseTimeMs: Math.round(endTime - startTime),
        error: error.message || 'Unknown error occurred during HTTP collection',
      };
    }
  }

  /**
   * Exécute une requête HTTP OPTIONS sur une URL donnée (souvent l'URL finale).
   * Utile pour récupérer les headers CORS ou les méthodes autorisées (Allow).
   */
  static async collectOptions(targetUrl: string, timeoutMs = 5000): Promise<HttpResponseData | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(targetUrl, {
        method: 'OPTIONS',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Cybelis-Security-Analyzer/1.0',
        }
      });

      return {
        url: targetUrl,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
      };
    } catch (error) {
      // En cas d'erreur sur OPTIONS, on retourne null car certains serveurs bloquent cette méthode
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
