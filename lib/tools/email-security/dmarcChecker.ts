import { DnsCollectionResult } from '../../collectors/dns';

export interface DmarcIssue {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface DmarcCheckerResult {
  score: 'A' | 'B' | 'C' | 'D' | 'F';
  scoreNum: number;
  hasDmarc: boolean;
  dmarcRecord: string | null;
  policy: 'reject' | 'quarantine' | 'none' | 'unknown';
  hasRua: boolean;
  hasRuf: boolean;
  issues: DmarcIssue[];
}

/**
 * DMARC Checker Tool
 * 
 * Responsabilité : Analyser l'enregistrement DMARC (Domain-based Message Authentication, Reporting, and Conformance)
 * pour valider les politiques d'alignement email et de rapport d'usurpation.
 */
export class DmarcChecker {
  private static gradeScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  static analyze(dnsData: DnsCollectionResult): DmarcCheckerResult {
    let scoreNum = 100;
    const issues: DmarcIssue[] = [];

    const dmarcRecords = dnsData.txt
      .filter(t => t.domain.startsWith('_dmarc.') || t.value.toLowerCase().startsWith('v=dmarc1'))
      .map(t => t.value);

    if (dmarcRecords.length === 0) {
      issues.push({ severity: 'high', message: "Aucun enregistrement DMARC détecté (sous-domaine _dmarc). Le domaine ne protège pas ses emails contre le phishing." });
      return {
        score: 'F',
        scoreNum: 0,
        hasDmarc: false,
        dmarcRecord: null,
        policy: 'unknown',
        hasRua: false,
        hasRuf: false,
        issues
      };
    }

    if (dmarcRecords.length > 1) {
      scoreNum -= 30;
      issues.push({ severity: 'high', message: "Plusieurs enregistrements DMARC trouvés. Seul un enregistrement DMARC doit exister sous _dmarc." });
    }

    const record = dmarcRecords[0];
    const lowerRecord = record.toLowerCase();

    let policy: DmarcCheckerResult['policy'] = 'unknown';
    const policyMatch = lowerRecord.match(/;\s*p=([a-z]+)/) || lowerRecord.match(/^v=dmarc1;\s*p=([a-z]+)/);

    if (policyMatch) {
      const pVal = policyMatch[1];
      if (pVal === 'reject') policy = 'reject';
      else if (pVal === 'quarantine') policy = 'quarantine';
      else if (pVal === 'none') policy = 'none';
    }

    if (policy === 'none') {
      scoreNum -= 30;
      issues.push({ severity: 'medium', message: "La politique DMARC est configurée sur 'p=none'. Les emails frauduleux sont uniquement surveillés mais pas bloqués." });
    } else if (policy === 'quarantine') {
      scoreNum -= 10;
      issues.push({ severity: 'low', message: "La politique DMARC est configurée sur 'p=quarantine'. Les emails suspects vont en spam. Le mode 'p=reject' est recommandé." });
    } else if (policy === 'unknown') {
      scoreNum -= 40;
      issues.push({ severity: 'high', message: "Impossible de déterminer la politique DMARC (tag 'p=' manquant ou invalide)." });
    }

    const hasRua = lowerRecord.includes('rua=');
    const hasRuf = lowerRecord.includes('ruf=');

    if (!hasRua) {
      scoreNum -= 15;
      issues.push({ severity: 'medium', message: "Aucune adresse de rapport agrégé (tag 'rua=') configurée dans DMARC." });
    }

    if (lowerRecord.includes('pct=')) {
      const pctMatch = lowerRecord.match(/pct=(\d+)/);
      if (pctMatch && parseInt(pctMatch[1], 10) < 100) {
        scoreNum -= 15;
        issues.push({ severity: 'medium', message: `Le pourcentage de filtrage DMARC ('pct=${pctMatch[1]}') est inférieur à 100%.` });
      }
    }

    scoreNum = Math.max(0, scoreNum);

    return {
      score: this.gradeScore(scoreNum),
      scoreNum,
      hasDmarc: true,
      dmarcRecord: record,
      policy,
      hasRua,
      hasRuf,
      issues
    };
  }
}
