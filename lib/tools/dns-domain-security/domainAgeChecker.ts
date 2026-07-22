import { WhoisCollectionResult } from '../../collectors/whois';

export interface DomainAgeIssue {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface DomainAgeCheckerResult {
  score: 'A' | 'B' | 'C' | 'D' | 'F';
  scoreNum: number;
  creationDate: string | null;
  ageInDays: number | null;
  ageInYears: number | null;
  isYoungDomain: boolean;
  issues: DomainAgeIssue[];
}

/**
 * Domain Age Checker Tool
 * 
 * Responsabilité : Évaluer l'ancienneté et la maturité du domaine à partir de sa date de création (déjà collectée).
 * Les domaines très récents (< 30-90 jours) présentent statistiquement un risque plus élevé de phishing ou de spam.
 */
export class DomainAgeChecker {
  private static gradeScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  static analyze(whoisData: WhoisCollectionResult): DomainAgeCheckerResult {
    let scoreNum = 100;
    const issues: DomainAgeIssue[] = [];

    if (!whoisData.creationDate) {
      issues.push({ severity: 'low', message: "Impossible de déterminer la date de création du domaine." });
      return {
        score: 'A',
        scoreNum: 100,
        creationDate: null,
        ageInDays: null,
        ageInYears: null,
        isYoungDomain: false,
        issues
      };
    }

    const created = new Date(whoisData.creationDate);
    if (isNaN(created.getTime())) {
      issues.push({ severity: 'low', message: "Format de date de création invalide dans les données WHOIS." });
      return {
        score: 'A',
        scoreNum: 100,
        creationDate: whoisData.creationDate,
        ageInDays: null,
        ageInYears: null,
        isYoungDomain: false,
        issues
      };
    }

    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const ageInDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const ageInYears = Number((ageInDays / 365.25).toFixed(1));

    let isYoungDomain = false;

    if (ageInDays < 30) {
      isYoungDomain = true;
      scoreNum -= 50;
      issues.push({ severity: 'high', message: `Le domaine est extrêmement récent (créé il y a seulement ${ageInDays} jours). Les nouveaux domaines sont fréquemment associés à des campagnes de phishing.` });
    } else if (ageInDays < 90) {
      isYoungDomain = true;
      scoreNum -= 30;
      issues.push({ severity: 'medium', message: `Le domaine est récent (créé il y a ${ageInDays} jours / moins de 3 mois).` });
    } else if (ageInDays < 365) {
      scoreNum -= 10;
      issues.push({ severity: 'low', message: `Le domaine a moins d'un an (${ageInDays} jours).` });
    }

    scoreNum = Math.max(0, scoreNum);

    return {
      score: this.gradeScore(scoreNum),
      scoreNum,
      creationDate: whoisData.creationDate,
      ageInDays,
      ageInYears,
      isYoungDomain,
      issues
    };
  }
}
