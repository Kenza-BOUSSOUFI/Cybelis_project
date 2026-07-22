import { DnsCollectionResult } from '../../collectors/dns';

export interface DkimIssue {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface DkimCheckerResult {
  score: 'A' | 'B' | 'C' | 'D' | 'F';
  scoreNum: number;
  hasDkim: boolean;
  detectedSelectors: string[];
  dkimRecords: Record<string, string>;
  issues: DkimIssue[];
}

/**
 * DKIM Checker Tool
 * 
 * Responsabilité : Analyser la présence et la configuration de la signature DKIM (DomainKeys Identified Mail)
 * dans les enregistrements TXT des sélecteurs `._domainkey`.
 */
export class DkimChecker {
  private static gradeScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  static analyze(dnsData: DnsCollectionResult): DkimCheckerResult {
    let scoreNum = 100;
    const issues: DkimIssue[] = [];
    const detectedSelectors: string[] = [];
    const dkimRecords: Record<string, string> = {};

    const dkimTxts = dnsData.txt.filter(t => t.domain.includes('._domainkey.'));

    for (const item of dkimTxts) {
      const match = item.domain.match(/^([^.]+)\._domainkey\./i);
      const selector = match ? match[1] : item.domain;
      const val = item.value;

      if (val.includes('v=DKIM1') || val.includes('p=')) {
        detectedSelectors.push(selector);
        dkimRecords[selector] = val;

        if (val.includes('p=;') || val.endsWith('p=')) {
          scoreNum -= 20;
          issues.push({ severity: 'medium', message: `La clé DKIM pour le sélecteur '${selector}' est révoquée (p= vide).` });
        }
      }
    }

    const hasDkim = detectedSelectors.length > 0;

    if (!hasDkim) {
      scoreNum = 50;
      issues.push({ severity: 'medium', message: "Aucune clé publique DKIM trouvée sur les sélecteurs standards interrogés. Assurez-vous d'avoir configuré DKIM." });
    }

    scoreNum = Math.max(0, scoreNum);

    return {
      score: this.gradeScore(scoreNum),
      scoreNum,
      hasDkim,
      detectedSelectors,
      dkimRecords,
      issues
    };
  }
}
