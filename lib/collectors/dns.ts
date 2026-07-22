import { promises as dnsPromises } from 'dns';

export interface DnsRecordMx {
  exchange: string;
  priority: number;
}

export interface DnsRecordCaa {
  critical: number;
  issue?: string;
  issuewild?: string;
  iodef?: string;
}

export interface DnsTxtRecord {
  domain: string;
  value: string;
}

export interface DnsCollectionResult {
  domain: string;
  a: string[];
  aaaa: string[];
  mx: DnsRecordMx[];
  txt: DnsTxtRecord[];
  ns: string[];
  caa: DnsRecordCaa[];
  error?: string;
}

/**
 * DNS Collector
 *
 * Responsabilité :
 * Collecter en une seule phase tous les enregistrements DNS
 * nécessaires aux outils d'analyse du Scan Engine.
 *
 * Le collecteur récupère :
 * - A
 * - AAAA
 * - MX
 * - TXT
 * - NS
 * - CAA
 * - l'enregistrement DMARC (_dmarc)
 * - les principaux sélecteurs DKIM
 *
 * Cette approche suit l'architecture "Collect Once, Analyze Many",
 * afin d'éviter plusieurs requêtes DNS redondantes et d'améliorer
 * les performances globales du scan.
 *
 * Le collecteur n'effectue aucune analyse de sécurité.
 * Il se limite à récupérer et normaliser les données DNS.
 */

export class DnsCollector {
  /**
   * Extrait le nom de domaine propre depuis une URL ou une chaîne brute.
   */
  private static extractDomain(target: string): string {
    try {
      if (target.startsWith('http://') || target.startsWith('https://')) {
        return new URL(target).hostname;
      }
      return new URL(`https://${target}`).hostname;
    } catch {
      return target.trim().toLowerCase();
    }
  }

  /**
   * Collecte l'ensemble des enregistrements DNS pour le domaine.
   */
  static async collect(target: string): Promise<DnsCollectionResult> {
    const domain = this.extractDomain(target);

    // Cibles à interroger pour les enregistrements TXT (domaine, _dmarc et sélecteurs DKIM courants)
    const dkimSelectors = ['default', 'google', 'selector1', 'k1', 'mail', 's1', 's2015', 's2017'];
    const txtTargets = [
      domain,
      `_dmarc.${domain}`,
      ...dkimSelectors.map(s => `${s}._domainkey.${domain}`)
    ];

    try {
      const [aRes, aaaaRes, mxRes, nsRes, caaRes, ...txtResults] = await Promise.allSettled([
        dnsPromises.resolve4(domain),
        dnsPromises.resolve6(domain),
        dnsPromises.resolveMx(domain),
        dnsPromises.resolveNs(domain),
        dnsPromises.resolveCaa(domain),
        ...txtTargets.map(t => dnsPromises.resolveTxt(t).then(records => ({ target: t, records })))
      ]);

      const a = aRes.status === 'fulfilled' ? aRes.value : [];
      const aaaa = aaaaRes.status === 'fulfilled' ? aaaaRes.value : [];
      const mx = mxRes.status === 'fulfilled' ? mxRes.value.map(m => ({ exchange: m.exchange, priority: m.priority })) : [];
      const ns = nsRes.status === 'fulfilled' ? nsRes.value : [];
      const caa = caaRes.status === 'fulfilled' ? caaRes.value.map(c => ({
        critical: c.critical,
        issue: c.issue,
        issuewild: c.issuewild,
        iodef: c.iodef
      })) : [];

      const txt: DnsTxtRecord[] = [];
      for (const res of txtResults) {
        if (res.status === 'fulfilled' && res.value && res.value.records) {
          for (const chunk of res.value.records) {
            txt.push({
              domain: res.value.target,
              value: chunk.join('')
            });
          }
        }
      }

      return {
        domain,
        a,
        aaaa,
        mx,
        txt,
        ns,
        caa
      };
    } catch (error: any) {
      return {
        domain,
        a: [],
        aaaa: [],
        mx: [],
        txt: [],
        ns: [],
        caa: [],
        error: error.message || 'Échec de la collecte DNS'
      };
    }
  }
}
