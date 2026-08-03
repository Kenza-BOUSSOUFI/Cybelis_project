export interface CveInfo {
  cveId: string;
  cvssScore: number;
  cvssVersion: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN";
  description: string;
  url: string;
}

// Simple in-memory cache to avoid rate limiting and speed up scans
const cveCache = new Map<string, CveInfo | null>();

export async function fetchCveForFinding(rawResult?: any): Promise<CveInfo | null> {
  if (!rawResult || typeof rawResult !== "object") {
    return null;
  }

  let queryTerm: string | null = null;

  // 1. Analyse dynamique pour le chiffrement (TLS/SSL)
  if (rawResult.isProtocolSecure === false && typeof rawResult.protocol === "string") {
    // Format attendu pour NVD: "TLS 1.0", "SSL 3.0"
    queryTerm = rawResult.protocol.replace('V', ' ').toUpperCase(); 
  } else if (rawResult.isCipherStrong === false && typeof rawResult.cipherName === "string") {
    // Format pour algorithmes faibles
    queryTerm = rawResult.cipherName.split('-')[0];
  } 
  // 2. Analyse dynamique pour l'identification du serveur HTTP
  else {
    const headers = rawResult.presentHeaders || (rawResult.finalResponse && rawResult.finalResponse.headers);
    if (headers && typeof headers["server"] === "string") {
      const serverHeader = headers["server"];
      if (serverHeader.toLowerCase().includes("nginx")) {
        const version = serverHeader.split("/")[1] || "";
        queryTerm = version ? `nginx ${version}` : null;
      } else if (serverHeader.toLowerCase().includes("apache")) {
        const version = serverHeader.split("/")[1] || "";
        queryTerm = version ? `apache ${version}` : null;
      } else if (serverHeader.toLowerCase().includes("iis")) {
        queryTerm = "microsoft iis";
      }
    }
  }

  // 3. Filtrage strict : si aucun produit ni version spécifique n'est détecté, on refuse d'interroger la base.
  // Cela évite de lier des problèmes de pure configuration (HSTS, Cookies) à de faux CVE.
  if (!queryTerm || queryTerm.trim().length === 0) {
    return null; 
  }

  const cacheKey = queryTerm.trim().toLowerCase();
  
  if (cveCache.has(cacheKey)) {
    return cveCache.get(cacheKey) || null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    
    // NVD API v2.0
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(cacheKey)}&resultsPerPage=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "application/json" }
    });
    clearTimeout(timeout);
    
    if (res.ok) {
      const data = await res.json();
      if (data.vulnerabilities && data.vulnerabilities.length > 0) {
        const cveItem = data.vulnerabilities[0].cve;
        const cveId = cveItem.id;
        
        let cvssScore = 0;
        let cvssVersion = "UNKNOWN";
        let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN" = "UNKNOWN";
        
        // Extract Metrics (V3.1, V3.0 or V2)
        const metrics = cveItem.metrics;
        if (metrics) {
          if (metrics.cvssMetricV31 && metrics.cvssMetricV31.length > 0) {
            cvssScore = metrics.cvssMetricV31[0].cvssData.baseScore;
            cvssVersion = "3.1";
            severity = metrics.cvssMetricV31[0].cvssData.baseSeverity || "UNKNOWN";
          } else if (metrics.cvssMetricV30 && metrics.cvssMetricV30.length > 0) {
            cvssScore = metrics.cvssMetricV30[0].cvssData.baseScore;
            cvssVersion = "3.0";
            severity = metrics.cvssMetricV30[0].cvssData.baseSeverity || "UNKNOWN";
          } else if (metrics.cvssMetricV2 && metrics.cvssMetricV2.length > 0) {
            cvssScore = metrics.cvssMetricV2[0].cvssData.baseScore;
            cvssVersion = "2.0";
            severity = metrics.cvssMetricV2[0].baseSeverity || "UNKNOWN";
          }
        }

        const description = cveItem.descriptions?.find((d: any) => d.lang === "en" || d.lang === "fr")?.value || "Vulnérabilité critique identifiée.";

        const result: CveInfo = {
          cveId,
          cvssScore,
          cvssVersion,
          severity,
          description,
          url: `https://nvd.nist.gov/vuln/detail/${cveId}`
        };

        cveCache.set(cacheKey, result);
        return result;
      }
    }
    
    // Cache the empty result to prevent re-querying failing keywords
    cveCache.set(cacheKey, null);
    
  } catch (e) {
    console.error(`[CVE Fetch] Failed to fetch NVD for term "${cacheKey}":`, e);
  }

  return null;
}
