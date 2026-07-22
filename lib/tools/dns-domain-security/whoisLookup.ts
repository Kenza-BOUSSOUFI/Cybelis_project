import { WhoisCollectionResult } from '../../collectors/whois';

export interface WhoisIssue {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface WhoisLookupResult {
  score: 'A' | 'B' | 'C' | 'D' | 'F';
  scoreNum: number;
  registrar: string | null;
  creationDate: string | null;
  expirationDate: string | null;
  updatedDate: string | null;
  domainStatus: string[];
  daysUntilExpiration: number | null;
  issues: WhoisIssue[];
}

/**
 * WHOIS Lookup Tool
 * 
 * Responsabilité : Analyser les données WHOIS fournies par le WhoisCollector.
 * Vérifie la présence d'un registrar valide, la proximité de la date d'expiration,
 * et les verrous de protection du domaine (domainStatus).
 */
export class WhoisLookup {
  private static gradeScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  private static calculateDaysUntilExpiration(expirationDateStr: string | null): number | null {
    if (!expirationDateStr) return null;
    const expDate = new Date(expirationDateStr);
    if (isNaN(expDate.getTime())) return null;

    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static analyze(whoisData: WhoisCollectionResult): WhoisLookupResult {
    let scoreNum = 100;
    const issues: WhoisIssue[] = [];

    if (whoisData.error || whoisData.isAvailable) {
      issues.push({ severity: 'high', message: whoisData.error || "Le domaine n'a renvoyé aucune donnée WHOIS." });
      return {
        score: 'F',
        scoreNum: 0,
        registrar: null,
        creationDate: null,
        expirationDate: null,
        updatedDate: null,
        domainStatus: [],
        daysUntilExpiration: null,
        issues
      };
    }

    if (!whoisData.registrar) {
      scoreNum -= 20;
      issues.push({ severity: 'medium', message: "Le registrar du domaine n'est pas identifié dans les données WHOIS." });
    }

    const daysUntilExpiration = this.calculateDaysUntilExpiration(whoisData.expirationDate);
    if (daysUntilExpiration !== null) {
      if (daysUntilExpiration <= 0) {
        scoreNum -= 80;
        issues.push({ severity: 'high', message: "Le domaine a expiré !" });
      } else if (daysUntilExpiration <= 30) {
        scoreNum -= 40;
        issues.push({ severity: 'high', message: `Le domaine expire dans moins de 30 jours (${daysUntilExpiration} jours restants). Renouvelez-le rapidement.` });
      } else if (daysUntilExpiration <= 60) {
        scoreNum -= 15;
        issues.push({ severity: 'medium', message: `Le domaine expire dans ${daysUntilExpiration} jours.` });
      }
    }

    const statusJoined = whoisData.domainStatus.join(' ').toLowerCase();
    const hasTransferLock = statusJoined.includes('transferprohibited');
    const hasDeleteLock = statusJoined.includes('deleteprohibited');

    if (!hasTransferLock) {
      scoreNum -= 10;
      issues.push({ severity: 'low', message: "Le domaine ne dispose pas du verrou de transfert (clientTransferProhibited / serverTransferProhibited)." });
    }

    if (!hasDeleteLock) {
      scoreNum -= 5;
      issues.push({ severity: 'low', message: "Le domaine ne dispose pas du verrou de suppression (clientDeleteProhibited / serverDeleteProhibited)." });
    }

    scoreNum = Math.max(0, scoreNum);

    return {
      score: this.gradeScore(scoreNum),
      scoreNum,
      registrar: whoisData.registrar,
      creationDate: whoisData.creationDate,
      expirationDate: whoisData.expirationDate,
      updatedDate: whoisData.updatedDate,
      domainStatus: whoisData.domainStatus,
      daysUntilExpiration,
      issues
    };
  }
}
