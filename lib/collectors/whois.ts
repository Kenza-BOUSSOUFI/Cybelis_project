// @ts-ignore
import whois from 'whois-json';

export interface WhoisCollectionResult {
  domain: string;
  registrar: string | null;
  creationDate: string | null;
  expirationDate: string | null;
  updatedDate: string | null;
  domainStatus: string[];
  nameservers: string[];
  isAvailable: boolean;
  error?: string;
}

/**
 * WHOIS Collector
 *
 * Responsabilité :
 * Collecter en une seule requête toutes les informations WHOIS
 * nécessaires aux outils d'analyse du Scan Engine.
 *
 * Le collecteur récupère :
 * - le registrar
 * - la date de création
 * - la date d'expiration
 * - la date de dernière mise à jour
 * - les statuts du domaine
 * - les serveurs de noms (Name Servers)
 *
 * Cette approche suit l'architecture "Collect Once, Analyze Many",
 * permettant aux différents outils de réutiliser les mêmes données
 * sans effectuer de nouvelles requêtes WHOIS.
 *
 * Le collecteur n'effectue aucune analyse de sécurité.
 * Il se limite à récupérer et normaliser les informations WHOIS.
 */

export class WhoisCollector {
  /**
   * Extrait le nom de domaine principal (registrable) depuis une URL ou un hôte.
   */
  private static extractDomain(target: string): string {
    let hostname = target.trim();
    try {
      if (target.startsWith('http://') || target.startsWith('https://')) {
        hostname = new URL(target).hostname;
      }
    } catch {
      // Fallback sur la chaîne brute
    }

    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    return hostname.toLowerCase();
  }

  /**
   * Effectue une requête WHOIS pour le domaine.
   */
  static async collect(target: string, timeoutMs = 10000): Promise<WhoisCollectionResult> {
    const domain = this.extractDomain(target);

    try {
      const whoisPromise = whois(domain, { follow: 2, timeout: timeoutMs });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('WHOIS query timeout')), timeoutMs)
      );

      const res: any = await Promise.race([whoisPromise, timeoutPromise]);

      if (!res || typeof res !== 'object' || Object.keys(res).length === 0) {
        return {
          domain,
          registrar: null,
          creationDate: null,
          expirationDate: null,
          updatedDate: null,
          domainStatus: [],
          nameservers: [],
          isAvailable: true,
          error: 'Aucune donnée WHOIS retournée pour ce domaine.'
        };
      }

      const registrar = res.registrar || res.registrarName || res.sponsoringRegistrar || null;
      const creationDate = res.creationDate || res.created || res.registrationDate || res.createdDate || null;
      const expirationDate = res.registrarRegistrationExpirationDate || res.registryExpiryDate || res.expirationDate || res.expires || res.expiresDate || null;
      const updatedDate = res.updatedDate || res.lastUpdated || res.changed || null;

      let domainStatus: string[] = [];
      if (res.domainStatus) {
        if (Array.isArray(res.domainStatus)) {
          domainStatus = res.domainStatus;
        } else if (typeof res.domainStatus === 'string') {
          domainStatus = res.domainStatus.split(/\s+/).filter(Boolean);
        }
      } else if (res.status) {
        domainStatus = Array.isArray(res.status) ? res.status : [res.status];
      }

      let nameservers: string[] = [];
      if (res.nameServer) {
        if (Array.isArray(res.nameServer)) {
          nameservers = res.nameServer;
        } else if (typeof res.nameServer === 'string') {
          nameservers = res.nameServer.split(/\s+/).filter(Boolean);
        }
      } else if (res.nameservers) {
        nameservers = Array.isArray(res.nameservers) ? res.nameservers : [res.nameservers];
      }

      const isAvailable = Boolean(!res.domainName && !registrar && !creationDate);

      return {
        domain,
        registrar,
        creationDate,
        expirationDate,
        updatedDate,
        domainStatus,
        nameservers: nameservers.map(ns => ns.toLowerCase().replace(/\.$/, '')),
        isAvailable
      };
    } catch (error: any) {
      return {
        domain,
        registrar: null,
        creationDate: null,
        expirationDate: null,
        updatedDate: null,
        domainStatus: [],
        nameservers: [],
        isAvailable: false,
        error: error.message || 'Échec de la requête WHOIS'
      };
    }
  }
}
