import { DnsCollectionResult } from '../../collectors/dns';

export interface DnsIssue {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface DnsLookupResult {
  score: 'A' | 'B' | 'C' | 'D' | 'F';
  scoreNum: number;
  hasA: boolean;
  hasIpv6: boolean;
  hasMx: boolean;
  hasNsRedundancy: boolean;
  hasCaa: boolean;
  recordsCount: {
    a: number;
    aaaa: number;
    mx: number;
    ns: number;
    caa: number;
    txt: number;
  };
  issues: DnsIssue[];
}

/**
 * DNS Lookup Tool
 * 
 * Responsabilité : Analyser la structure et la résilience de la configuration DNS du domaine
 * (présence d'IPv4, IPv6, redondance des serveurs de noms NS, présence de CAA).
 */
export class DnsLookup {
  private static gradeScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  static analyze(dnsData: DnsCollectionResult): DnsLookupResult {
    let scoreNum = 100;
    const issues: DnsIssue[] = [];

    if (dnsData.error) {
      issues.push({ severity: 'high', message: `Erreur lors de la résolution DNS : ${dnsData.error}` });
      return {
        score: 'F',
        scoreNum: 0,
        hasA: false,
        hasIpv6: false,
        hasMx: false,
        hasNsRedundancy: false,
        hasCaa: false,
        recordsCount: { a: 0, aaaa: 0, mx: 0, ns: 0, caa: 0, txt: 0 },
        issues
      };
    }

    const hasA = dnsData.a.length > 0;
    const hasIpv6 = dnsData.aaaa.length > 0;
    const hasMx = dnsData.mx.length > 0;
    const hasNsRedundancy = dnsData.ns.length >= 2;
    const hasCaa = dnsData.caa.length > 0;

    if (!hasA) {
      scoreNum -= 30;
      issues.push({ severity: 'high', message: "Aucun enregistrement IPv4 (A) trouvé pour ce domaine." });
    }

    if (!hasNsRedundancy) {
      scoreNum -= 20;
      issues.push({ severity: 'medium', message: "Moins de 2 serveurs de noms (NS) configurés. La redondance DNS n'est pas assurée." });
    }

    if (!hasIpv6) {
      scoreNum -= 10;
      issues.push({ severity: 'low', message: "Aucun enregistrement IPv6 (AAAA) configuré pour la compatibilité IPv6 moderne." });
    }

    if (!hasCaa) {
      scoreNum -= 15;
      issues.push({ severity: 'medium', message: "Aucun enregistrement CAA trouvé. N'importe quelle autorité de certification peut émettre un certificat pour ce domaine." });
    }

    scoreNum = Math.max(0, scoreNum);

    return {
      score: this.gradeScore(scoreNum),
      scoreNum,
      hasA,
      hasIpv6,
      hasMx,
      hasNsRedundancy,
      hasCaa,
      recordsCount: {
        a: dnsData.a.length,
        aaaa: dnsData.aaaa.length,
        mx: dnsData.mx.length,
        ns: dnsData.ns.length,
        caa: dnsData.caa.length,
        txt: dnsData.txt.length
      },
      issues
    };
  }
}
