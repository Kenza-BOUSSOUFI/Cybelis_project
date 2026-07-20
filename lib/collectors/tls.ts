import * as tls from 'tls';

export interface TlsCertificateData {
  subject: Record<string, string>;
  issuer: Record<string, string>;
  validFrom: string;
  validTo: string;
  fingerprint: string;
  fingerprint256: string;
  serialNumber: string;
  subjectaltname?: string;
}

export interface TlsCipherData {
  name: string;
  standardName?: string;
  version: string;
}

export interface TlsCollectionResult {
  hostname: string;
  port: number;
  protocol: string;
  cipher: TlsCipherData | null;
  certificate: TlsCertificateData | null;
  isAuthorized: boolean;
  authorizationError?: string;
  error?: string;
}

/**
 * TLS Collector
 * 
 * Responsabilité : Collecter les données brutes de la connexion TLS/SSL 
 * (certificats, protocole négocié, ciphers, erreurs de validation).
 * Ce module n'effectue aucune analyse de sécurité (notes A, B, etc.).
 */
export class TlsCollector {
  /**
   * Extrait le hostname depuis une URL ou une chaîne brute.
   */
  private static extractHostname(target: string): string {
    try {
      // Si la cible contient un schéma (ex: https://), on le parse
      if (target.startsWith('http://') || target.startsWith('https://')) {
        return new URL(target).hostname;
      }
      // Sinon on suppose que c'est un domaine (et on peut ajouter un schéma bidon pour le parser)
      return new URL(`https://${target}`).hostname;
    } catch {
      // Fallback
      return target;
    }
  }

  /**
   * Nettoie les objets `subject` et `issuer` retournés par le module tls 
   * (le module tls peut retourner des champs non standard qu'on force en chaîne)
   */
  private static parseDict(dict: any): Record<string, string> {
    if (!dict) return {};
    const parsed: Record<string, string> = {};
    for (const key in dict) {
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        parsed[key] = String(dict[key]);
      }
    }
    return parsed;
  }

  /**
   * Effectue une connexion TLS vers le serveur pour récolter les informations du certificat.
   * `rejectUnauthorized: false` est indispensable pour pouvoir récupérer un certificat invalide ou expiré et l'analyser.
   */
  static async collect(target: string, port = 443, timeoutMs = 10000): Promise<TlsCollectionResult> {
    const hostname = this.extractHostname(target);

    return new Promise((resolve) => {
      let resolved = false;

      // Timer pour éviter que la requête ne reste bloquée indéfiniment
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          if (socket && !socket.destroyed) {
            socket.destroy();
          }
          resolve({
            hostname,
            port,
            protocol: 'Unknown',
            cipher: null,
            certificate: null,
            isAuthorized: false,
            error: 'Connection timeout',
          });
        }
      }, timeoutMs);

      // On désactive la vérification stricte pour pouvoir "voir" un mauvais certificat
      const options: tls.ConnectionOptions = {
        host: hostname,
        port: port,
        servername: hostname, // Requis pour le SNI (Server Name Indication)
        rejectUnauthorized: false,
      };

      const socket = tls.connect(options, () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);

        const protocol = socket.getProtocol();
        const cipherInfo = socket.getCipher();
        const peerCert = socket.getPeerCertificate(false);
        
        let certificate: TlsCertificateData | null = null;

        // peerCert peut être vide si le serveur n'envoie pas de cert (très rare)
        if (peerCert && Object.keys(peerCert).length > 0) {
          certificate = {
            subject: this.parseDict(peerCert.subject),
            issuer: this.parseDict(peerCert.issuer),
            validFrom: peerCert.valid_from,
            validTo: peerCert.valid_to,
            fingerprint: peerCert.fingerprint,
            fingerprint256: peerCert.fingerprint256,
            serialNumber: peerCert.serialNumber,
            subjectaltname: peerCert.subjectaltname,
          };
        }

        const result: TlsCollectionResult = {
          hostname,
          port,
          protocol: protocol || 'Unknown',
          cipher: cipherInfo ? {
            name: cipherInfo.name,
            standardName: cipherInfo.standardName,
            version: cipherInfo.version,
          } : null,
          certificate,
          isAuthorized: socket.authorized,
          authorizationError: socket.authorizationError ? (socket.authorizationError as any).message || String(socket.authorizationError) : undefined,
        };

        socket.destroy(); // Propre: on ferme la connexion dès la collecte terminée
        resolve(result);
      });

      socket.on('error', (err: any) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);

        resolve({
          hostname,
          port,
          protocol: 'Unknown',
          cipher: null,
          certificate: null,
          isAuthorized: false,
          error: err.message || 'TLS Connection failed',
        });
      });
    });
  }
}
