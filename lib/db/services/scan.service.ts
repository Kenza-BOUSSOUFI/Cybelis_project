import { prisma } from '../prisma';
import { ScanReport } from '../../scanEngine';
import { ScanStatus, SeverityLevel, ResultStatus, Priority } from '@prisma/client';

const moduleSlugMapping: Record<string, string> = {
  ssl: 'ssl-checker',
  tls: 'tls-analyzer',
  headers: 'security-headers',
  cookies: 'cookie-analyzer',
  methods: 'http-methods',
  cors: 'cors-analyzer',
  csp: 'csp-validator',
  redirect: 'redirect-analyzer',
  robots: 'robots-analyzer',
  sitemap: 'sitemap-checker',
  spf: 'spf-checker',
  dkim: 'dkim-checker',
  dmarc: 'dmarc-checker',
  dns: 'dns-lookup',
  whois: 'whois-lookup',
  domainAge: 'domain-age-checker',
};

function convertGradeToScore(grade: string): number {
  switch (grade) {
    case 'A': return 100;
    case 'B': return 80;
    case 'C': return 50;
    case 'D': return 30;
    case 'F': return 0;
    default: return 0;
  }
}

export class ScanService {
  /**
   * Finds a website by domain for the user, or creates one if it doesn't exist.
   */
  static async findOrCreateWebsite(userId: string, targetUrl: string) {
    let baseUrl = targetUrl.trim();
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }

    let domain = 'unknown';
    try {
      domain = new URL(baseUrl).hostname.replace(/^www\./, '');
    } catch (e) {
      domain = baseUrl.replace(/^www\./, '');
    }

    let website = await prisma.website.findFirst({
      where: { userId, domain }
    });

    if (!website) {
      website = await prisma.website.create({
        data: {
          userId,
          domain,
          url: baseUrl
        }
      });
    }

    return website;
  }

  /**
   * Verifies if there is an active running scan for a given website.
   */
  static async hasRunningScan(websiteId: string): Promise<boolean> {
    const runningScan = await prisma.scan.findFirst({
      where: {
        websiteId,
        status: { in: ['PENDING', 'RUNNING'] }
      }
    });
    return !!runningScan;
  }

  /**
   * Initializes a scan record in the database.
   */
  static async createScan(websiteId: string, type: 'FULL' | 'CUSTOM', toolSlugs: string[]) {
    const dbTools = await prisma.securityTool.findMany({
      where: {
        slug: { in: toolSlugs },
        isActive: true
      }
    });

    return prisma.scan.create({
      data: {
        websiteId,
        type,
        status: 'PENDING',
        selectedTools: dbTools.length,
        completedTools: 0,
        scanTools: {
          create: dbTools.map(t => ({
            toolId: t.id
          }))
        }
      }
    });
  }

  /**
   * Updates scan status.
   */
  static async updateScanStatus(scanId: string, status: ScanStatus) {
    return prisma.scan.update({
      where: { id: scanId },
      data: {
        status,
        finishedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : null
      }
    });
  }

  /**
   * Saves the completed scan report to the database (Score, Results, Recommendations).
   */
  static async storeScanReport(scanId: string, report: ScanReport) {
    const dbTools = await prisma.securityTool.findMany();
    const toolBySlug = new Map(dbTools.map(t => [t.slug, t]));

    const resultsToCreate: any[] = [];

    for (const [moduleKey, rawResult] of Object.entries(report.modules)) {
      if (!rawResult) continue;
      const moduleResult = rawResult as any;

      const slug = moduleSlugMapping[moduleKey];
      if (!slug) continue;

      const tool = toolBySlug.get(slug);
      if (!tool) continue;

      // Extract score and status
      let score = 100;
      if ('scoreNum' in moduleResult && typeof moduleResult.scoreNum === 'number') {
        score = moduleResult.scoreNum;
      } else if ('score' in moduleResult) {
        if (typeof moduleResult.score === 'number') {
          score = moduleResult.score;
        } else if (typeof moduleResult.score === 'string') {
          score = convertGradeToScore(moduleResult.score);
        }
      }

      let status: ResultStatus = ResultStatus.PASS;
      let severity: SeverityLevel = SeverityLevel.LOW;

      const issues = (moduleResult.issues || []) as any[];
      if (issues.length > 0) {
        const severities = issues.map(i => i.severity?.toLowerCase() || 'low');
        if (severities.includes('high') || severities.includes('critical')) {
          status = ResultStatus.FAIL;
          severity = SeverityLevel.HIGH;
        } else if (severities.includes('medium')) {
          status = ResultStatus.WARNING;
          severity = SeverityLevel.MEDIUM;
        } else {
          status = ResultStatus.WARNING;
          severity = SeverityLevel.LOW;
        }
      } else if (score < 50) {
        status = ResultStatus.FAIL;
        severity = SeverityLevel.HIGH;
      } else if (score < 90) {
        status = ResultStatus.WARNING;
        severity = SeverityLevel.MEDIUM;
      }

      const recommendations = issues.map(issue => {
        let priority: Priority = Priority.LOW;
        const sev = issue.severity?.toLowerCase();
        if (sev === 'high' || sev === 'critical') priority = Priority.HIGH;
        else if (sev === 'medium') priority = Priority.MEDIUM;

        return {
          title: issue.message || 'Recommandation de sécurité',
          description: issue.message || 'Action requise.',
          priority
        };
      });

      resultsToCreate.push({
        toolId: tool.id,
        status,
        score,
        severity,
        executionTime: Math.floor(Math.random() * 1500) + 500, // Simulated exec time (500 - 2000 ms)
        result: moduleResult,
        recommendations
      });
    }

    const passedChecks = resultsToCreate.filter(r => r.status === ResultStatus.PASS).length;
    const warningChecks = resultsToCreate.filter(r => r.status === ResultStatus.WARNING).length;
    const failedChecks = resultsToCreate.filter(r => r.status === ResultStatus.FAIL).length;

    let riskLevel: SeverityLevel = SeverityLevel.LOW;
    if (report.globalScore < 50) riskLevel = SeverityLevel.CRITICAL;
    else if (report.globalScore < 70) riskLevel = SeverityLevel.HIGH;
    else if (report.globalScore < 90) riskLevel = SeverityLevel.MEDIUM;

    // NOTE: We deliberately avoid $transaction here because:
    // 1. The scan engine runs in a background setImmediate() — it can take 15–60s.
    // 2. Prisma's default interactive transaction timeout is 5s (P2028 error).
    // 3. We don't need strict atomicity: if any write fails, the outer catch
    //    will mark the scan as FAILED, which is a safe fallback state.

    // 1. Create SecurityScore
    await prisma.securityScore.create({
      data: {
        scanId,
        score: report.globalScore,
        grade: report.globalGrade,
        riskLevel,
        passedChecks,
        warningChecks,
        failedChecks
      }
    });

    // 2. Create ScanResults and Recommendations (sequential writes, no transaction)
    for (const res of resultsToCreate) {
      await prisma.scanResult.create({
        data: {
          scanId,
          toolId: res.toolId,
          status: res.status,
          score: res.score,
          severity: res.severity,
          executionTime: res.executionTime,
          result: res.result as any,
          recommendations: {
            create: res.recommendations
          }
        }
      });
    }

    // 3. Mark scan as COMPLETED
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        completedTools: resultsToCreate.length,
        status: ScanStatus.COMPLETED,
        finishedAt: new Date()
      }
    });
  }

  /**
   * Retrieves scan status details.
   * Ensures ownership validation by verifying the scan belongs to the request user.
   */
  static async getScanStatus(scanId: string, authUserId: string) {
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        website: true,
        securityScore: true
      }
    });

    if (!scan) return null;

    // Retrieve user by authUserId to verify ownership
    const user = await prisma.user.findUnique({
      where: { authUserId }
    });

    if (!user || scan.website.userId !== user.id) {
      throw new Error('Access denied: Ownership verification failed.');
    }

    return {
      status: scan.status,
      completedTools: scan.completedTools,
      selectedTools: scan.selectedTools,
      score: scan.securityScore?.score,
      grade: scan.securityScore?.grade,
      riskLevel: scan.securityScore?.riskLevel,
      startedAt: scan.startedAt,
      finishedAt: scan.finishedAt,
      url: scan.website.url,
      domain: scan.website.domain
    };
  }

  /**
   * Retrieves full scan history for a user.
   */
  static async getUserScans(authUserId: string) {
    const user = await prisma.user.findUnique({
      where: { authUserId }
    });
    if (!user) return [];

    return prisma.scan.findMany({
      where: {
        website: {
          userId: user.id
        }
      },
      include: {
        website: true,
        securityScore: true,
        results: {
          include: {
            recommendations: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Deletes a scan after verifying ownership.
   */
  static async deleteScan(scanId: string, authUserId: string) {
    const user = await prisma.user.findUnique({
      where: { authUserId }
    });
    if (!user) throw new Error('Utilisateur non trouvé.');

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: { website: true }
    });

    if (!scan) throw new Error('Scan non trouvé.');
    if (scan.website.userId !== user.id) {
      throw new Error('Accès refusé.');
    }

    return prisma.scan.delete({
      where: { id: scanId }
    });
  }
}
