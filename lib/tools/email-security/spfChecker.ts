import { DnsCollectionResult } from '../../collectors/dns';

export interface SpfIssue {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface SpfCheckerResult {
  score: 'A' | 'B' | 'C' | 'D' | 'F';
  scoreNum: number;
  hasSpf: boolean;
  spfRecord: string | null;
  qualifier: 'hardfail' | 'softfail' | 'neutral' | 'allow_all' | 'none';
  issues: SpfIssue[];
}

/**
 * SPF Checker Tool
 * 
 * Responsabilité : Analyser l'enregistrement SPF (Sender Policy Framework) dans les DNS TXT
 * du domaine pour prévenir l'usurpation d'email (spoofing).
 */
export class SpfChecker {
  private static gradeScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  static analyze(dnsData: DnsCollectionResult): SpfCheckerResult {
    let scoreNum = 100;
    const issues: SpfIssue[] = [];

    const spfRecords = dnsData.txt
      .filter(t => t.domain === dnsData.domain && t.value.toLowerCase().startsWith('v=spf1'))
      .map(t => t.value);

    if (spfRecords.length === 0) {
      issues.push({ severity: 'high', message: "Aucun enregistrement SPF (Sender Policy Framework) détecté. Le domaine est vulnérable à l'usurpation d'email." });
      return {
        score: 'F',
        scoreNum: 0,
        hasSpf: false,
        spfRecord: null,
        qualifier: 'none',
        issues
      };
    }

    if (spfRecords.length > 1) {
      scoreNum -= 40;
      issues.push({ severity: 'high', message: `Plusieurs enregistrements SPF trouvés (${spfRecords.length}). Selon la norme RFC 7208, un domaine ne doit posséder qu'un seul enregistrement SPF.` });
    }

    const spfRecord = spfRecords[0];
    const lowerSpf = spfRecord.toLowerCase();
    let qualifier: SpfCheckerResult['qualifier'] = 'none';

    if (lowerSpf.includes('+all')) {
      qualifier = 'allow_all';
      scoreNum -= 50;
      issues.push({ severity: 'high', message: "L'enregistrement SPF se termine par '+all'. Tous les serveurs internet sont autorisés à envoyer des emails pour ce domaine." });
    } else if (lowerSpf.includes('~all')) {
      qualifier = 'softfail';
      issues.push({ severity: 'low', message: "L'enregistrement SPF utilise le qualificatif '~all' (SoftFail). Il est recommandé de passer à '-all' (HardFail) pour une sécurité maximale." });
    } else if (lowerSpf.includes('-all')) {
      qualifier = 'hardfail';
    } else if (lowerSpf.includes('?all')) {
      qualifier = 'neutral';
      scoreNum -= 20;
      issues.push({ severity: 'medium', message: "L'enregistrement SPF utilise '?all' (Neutral). Aucune politique de rejet n'est appliquée pour les expéditeurs non autorisés." });
    } else {
      scoreNum -= 15;
      issues.push({ severity: 'medium', message: "L'enregistrement SPF ne spécifie aucun mécanisme 'all' de fin." });
    }

    if (lowerSpf.includes('ptr')) {
      scoreNum -= 10;
      issues.push({ severity: 'low', message: "Le mécanisme 'ptr' est déprécié dans la norme SPF (RFC 7208) et peut ralentir la validation." });
    }

    scoreNum = Math.max(0, scoreNum);

    return {
      score: this.gradeScore(scoreNum),
      scoreNum,
      hasSpf: true,
      spfRecord,
      qualifier,
      issues
    };
  }
}
