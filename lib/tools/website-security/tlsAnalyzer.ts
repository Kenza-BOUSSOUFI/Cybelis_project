import { TlsCollectionResult } from '../../collectors/tls';

export interface TlsIssue {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface TlsAnalyzeResult {
  protocol: string;
  isProtocolSecure: boolean;
  cipherName: string;
  isCipherStrong: boolean;
  score: 'A' | 'B' | 'C' | 'F';
  issues: TlsIssue[];
}

/**
 * TLS Analyzer Tool
 * 
 * Responsabilité : Analyser le protocole TLS et la suite de chiffrement (cipher)
 * négociés lors de la connexion (récoltés par TlsCollector).
 * Identifie l'utilisation de protocoles obsolètes (TLS 1.0, 1.1) ou 
 * de chiffrements faibles (RC4, 3DES, MD5, etc.).
 */
export class TlsAnalyzer {
  /**
   * Évalue la sécurité du protocole négocié.
   * TLSv1.3 est optimal. TLSv1.2 est standard. Le reste est obsolète.
   */
  private static evaluateProtocol(protocol: string): { isSecure: boolean; score: 'A' | 'B' | 'F'; issue?: TlsIssue } {
    const proto = protocol.toUpperCase();
    
    if (proto === 'TLSV1.3') {
      return { isSecure: true, score: 'A' };
    }
    
    if (proto === 'TLSV1.2') {
      // TLS 1.2 est toujours robuste mais n'est plus l'état de l'art
      return { 
        isSecure: true, 
        score: 'B',
        issue: { severity: 'low', message: 'Le serveur utilise TLS 1.2. Une mise à jour vers TLS 1.3 est recommandée.' } 
      };
    }
    
    // Tout ce qui est en dessous (TLSv1.1, TLSv1.0, SSLv3, SSLv2) est vulnérable
    return {
      isSecure: false,
      score: 'F',
      issue: { severity: 'high', message: `Le protocole ${protocol} est obsolète et vulnérable. Passez à TLS 1.2 minimum.` }
    };
  }

  /**
   * Vérifie si le nom du cipher contient des algorithmes connus pour être faibles ou cassés.
   */
  private static evaluateCipher(cipherName: string): { isStrong: boolean; issue?: TlsIssue } {
    const upperCipher = cipherName.toUpperCase();
    
    // Liste non-exhaustive d'algorithmes considérés comme faibles/cassés
    const weakKeywords = ['RC4', 'MD5', 'DES', '3DES', 'EXPORT', 'NULL', 'ANON', 'SHA1'];

    for (const keyword of weakKeywords) {
      if (upperCipher.includes(keyword)) {
        return {
          isStrong: false,
          issue: { severity: 'high', message: `La suite de chiffrement (${cipherName}) utilise un algorithme faible/déprécié (${keyword}).` }
        };
      }
    }

    // Si on a du GCM, CHACHA20, ou AES256, c'est généralement très fort
    // Pour une analyse basique, l'absence de weak keywords suffit pour le valider "Fort"
    return { isStrong: true };
  }

  /**
   * Exécute l'analyse sur le protocole et les chiffrements
   */
  static analyze(tlsData: TlsCollectionResult): TlsAnalyzeResult {
    const issues: TlsIssue[] = [];
    const protocol = tlsData.protocol || 'Unknown';
    const cipherName = tlsData.cipher?.name || 'Unknown';

    // Cas de connexion totalement échouée
    if (protocol === 'Unknown' || !tlsData.cipher) {
      issues.push({ severity: 'high', message: tlsData.error || 'Impossible de déterminer le protocole TLS et la suite de chiffrement.' });
      return {
        protocol,
        isProtocolSecure: false,
        cipherName,
        isCipherStrong: false,
        score: 'F',
        issues
      };
    }

    // 1. Analyse du Protocole
    const protoEval = this.evaluateProtocol(protocol);
    if (protoEval.issue) {
      issues.push(protoEval.issue);
    }

    // 2. Analyse du Chiffrement
    const cipherEval = this.evaluateCipher(cipherName);
    if (cipherEval.issue) {
      issues.push(cipherEval.issue);
    }

    // 3. Calcul du Score Global
    let finalScore = protoEval.score;
    
    // Si le chiffrement est faible, le score tombe drastiquement
    if (!cipherEval.isStrong) {
      finalScore = 'F';
    }

    return {
      protocol,
      isProtocolSecure: protoEval.isSecure,
      cipherName,
      isCipherStrong: cipherEval.isStrong,
      score: finalScore,
      issues
    };
  }
}
